// Mock Location for server-side (expo-location is mobile-only)
const Location = {
  requestForegroundPermissionsAsync: async () => ({ status: "denied" }),
  getCurrentPositionAsync: async () => ({ coords: { latitude: 0, longitude: 0 } }),
  reverseGeocodeAsync: async () => [{ subregion: "Unknown", region: "Unknown" }],
  Accuracy: { Low: "low" }
};

import { Database } from "sqlite";
import { openDb } from "./db";

type PermissionStatus = "granted" | "denied" | "prompt";

export interface PermissionRecord {
  type: "coarse" | "manual";
  status: PermissionStatus;
  area_code?: string; // ADM2 code from reverse geocode (if available)
  updated_at: string;
}

// table init
async function init(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS permissions_cache (
      key TEXT PRIMARY KEY,
      status TEXT,
      type TEXT,
      area_code TEXT,
      updated_at TEXT
    );
  `);
}

export async function getPermissionStatus(db?: Database): Promise<PermissionRecord | null> {
  const dbc = db || await openDb();
  await init(dbc);
  const row = await dbc.get(
    `SELECT status,type,area_code,updated_at FROM permissions_cache WHERE key='location'`
  );
  return row ? {
    status: row.status as PermissionStatus,
    type: row.type as "coarse"|"manual",
    area_code: row.area_code ?? undefined,
    updated_at: row.updated_at
  } : null;
}

export async function requestLocationPermission(db?: Database): Promise<PermissionRecord> {
  const dbc = db || await openDb();
  await init(dbc);

  let status: PermissionStatus = "prompt";
  let type: "coarse"|"manual" = "manual";
  let area_code: string|undefined;

  try {
    const { status: sysStatus } = await Location.requestForegroundPermissionsAsync();
    if (sysStatus === "granted") {
      status = "granted";
      type = "coarse";

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low
      });

      // TODO: plug into your location-service reverse geocode here:
      // area_code = await reverseGeocodeToAdm2(loc.coords.latitude, loc.coords.longitude);
    } else if (sysStatus === "denied") {
      status = "denied";
      type = "manual";
    }
  } catch (e) {
    status = "denied";
    type = "manual";
  }

  const rec: PermissionRecord = {
    status, type, area_code,
    updated_at: new Date().toISOString()
  };

  await dbc.run(
    `INSERT OR REPLACE INTO permissions_cache (key,status,type,area_code,updated_at)
     VALUES ('location',?,?,?,?)`,
    rec.status, rec.type, rec.area_code ?? null, rec.updated_at
  );

  return rec;
}