import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import fs from "fs";
import path from "path";

export async function openOfflineDb(dbPath = process.env.APP_DB_PATH || "data/app.db") {
  const db: Database = await open({ filename: dbPath, driver: sqlite3.Database });

  const load = (p: string) => {
    if (fs.existsSync(p)) {
      try {
        db.exec(fs.readFileSync(p, "utf8"));
      } catch (e) {
        // Ignore errors like duplicate columns
        console.warn(`Schema load warning for ${p}:`, e);
      }
    }
  };
  load(path.join("src","db","schema","offline.sql"));       // this file
  // Also ensure your other schemas (shops, tickets, price_alerts, etc.) are loaded earlier.

  return db;
}
