import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import fs from "fs";
import path from "path";

export async function openAnalyticsDb(dbPath = process.env.ANALYTICS_DB_PATH || "data/app.db") {
  const db: Database = await open({ filename: dbPath, driver: sqlite3.Database });
  const schema = fs.readFileSync(path.join("src","db","schema","analytics.sql"), "utf8");
  await db.exec(schema);
  return db;
}
