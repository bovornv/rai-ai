import { useCallback, useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";
import { kv } from "../lib/storage";

export type PermissionStatus = "granted" | "denied" | "prompt";
export type PermType = "coarse" | "manual";

export type PermissionRecord = {
  status: PermissionStatus;
  type: PermType;           // "coarse" if GPS granted, "manual" if user picked area
  area_code?: string;       // ADM2/TIS-1099 or geohash5 (coarse!)
  area_label?: string;      // Human text (Province / Amphoe)
  updated_at: string;       // ISO
  // Optional last fix (coarse)
  lat?: number;
  lon?: number;
};

const K = {
  rec: "perm/location/record",
};

/** Optional: call your own reverse geocoder to resolve ADM codes. */
async function reverseGeocodeToAdm2(lat: number, lon: number): Promise<{ area_code?: string; area_label?: string }> {
  try {
    // If you've implemented your own backend:
    // const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lon=${lon}`);
    // const j = await res.json();
    // return { area_code: j?.adm2_code, area_label: j?.label };

    // Expo fallback (labels only; no ADM code):
    const parts = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    const p = parts?.[0];
    const label = [p?.subregion, p?.region].filter(Boolean).join(", ");
    return { area_code: undefined, area_label: label || undefined };
  } catch {
    return {};
  }
}

function nowISO() { return new Date().toISOString(); }

export function usePermissions() {
  const [rec, setRec] = useState<PermissionRecord | null>(() => kv.getJSON<PermissionRecord>(K.rec));

  // derive
  const status: PermissionStatus = rec?.status ?? "prompt";
  const type: PermType = rec?.type ?? "manual";
  const granted = status === "granted" && type === "coarse";

  const save = useCallback((r: PermissionRecord | null) => {
    if (!r) { kv.delete(K.rec); setRec(null); return; }
    kv.setJSON(K.rec, r); setRec(r);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const sys = await Location.getForegroundPermissionsAsync();
      if (sys.status === "granted") {
        // try a quick coarse fix (no high accuracy)
        let lat: number | undefined, lon: number | undefined, area_code: string | undefined, area_label: string | undefined;
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest, mayShowUserSettingsDialog: false });
          lat = pos.coords.latitude; lon = pos.coords.longitude;
          const adm = await reverseGeocodeToAdm2(lat, lon);
          area_code = adm.area_code; area_label = adm.area_label;
        } catch { /* ignore */ }
        const r: PermissionRecord = { status: "granted", type: "coarse", lat, lon, area_code, area_label, updated_at: nowISO() };
        save(r);
        return r;
      }
      const r: PermissionRecord = { status: sys.canAskAgain ? "prompt" : "denied", type: "manual", updated_at: nowISO(), area_code: rec?.area_code, area_label: rec?.area_label };
      save(r);
      return r;
    } catch {
      const r: PermissionRecord = { status: "denied", type: "manual", updated_at: nowISO(), area_code: rec?.area_code, area_label: rec?.area_label };
      save(r);
      return r;
    }
  }, [rec?.area_code, rec?.area_label, save]);

  const request = useCallback(async () => {
    try {
      // On Android 12+, coarse permission is under the same foreground permission;
      // expo-location shows the accuracy chooser dialog.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        // try a quick coarse fix
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
        const { latitude: lat, longitude: lon } = pos.coords;
        const { area_code, area_label } = await reverseGeocodeToAdm2(lat, lon);
        const r: PermissionRecord = { status: "granted", type: "coarse", lat, lon, area_code, area_label, updated_at: nowISO() };
        save(r);
        return r;
      }
      const r: PermissionRecord = { status: status === "denied" ? "denied" : "prompt", type: "manual", updated_at: nowISO(), area_code: rec?.area_code, area_label: rec?.area_label };
      save(r);
      return r;
    } catch {
      const r: PermissionRecord = { status: "denied", type: "manual", updated_at: nowISO(), area_code: rec?.area_code, area_label: rec?.area_label };
      save(r);
      return r;
    }
  }, [rec?.area_code, rec?.area_label, save]);

  /** Allow user to pick area manually (offline picker → ADM codes). */
  const setManualArea = useCallback((area_code: string, area_label?: string) => {
    const r: PermissionRecord = { status: "denied", type: "manual", area_code, area_label, updated_at: nowISO() };
    save(r);
    return r;
  }, [save]);

  /** Clear cached record (debug) */
  const reset = useCallback(() => { save(null); }, [save]);

  // Initialize once (read OS status lazily to avoid extra prompts)
  useEffect(() => { if (!rec) { refreshStatus(); } }, []); // eslint-disable-line

  return useMemo(() => ({
    record: rec,
    status,
    type,
    granted,
    request,          // ask user
    refreshStatus,    // re-check OS status
    setManualArea,    // user picked province/amphoe
    reset
  }), [granted, rec, request, refreshStatus, setManualArea, status, type, reset]);
}
