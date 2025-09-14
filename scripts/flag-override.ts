import { open } from "sqlite";
import sqlite3 from "sqlite3";

(async () => {
  const db = await open({ filename: "data/app.db", driver: sqlite3.Database });
  const key = process.argv[2];
  const user = process.argv[3];
  const json = process.argv[4];
  
  if (!key || !user || !json) {
    console.log("usage: tsx scripts/flag-override.ts <key> <user_id> '<json_value>'");
    console.log("example: tsx scripts/flag-override.ts spray_window user123 '{\"enabled\": false}'");
    process.exit(1);
  }
  
  try {
    // Validate JSON
    JSON.parse(json);
  } catch (e) {
    console.error("Invalid JSON:", e.message);
    process.exit(1);
  }
  
  await db.run(
    `INSERT OR REPLACE INTO feature_flag_overrides (key,user_id,value_json,updated_at) VALUES (?,?,?,?)`,
    key, user, json, new Date().toISOString()
  );
  console.log("✅ Override set");
  await db.close();
})().catch(e => { console.error(e); process.exit(1); });
