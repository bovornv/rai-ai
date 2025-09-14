import { open } from "sqlite";
import sqlite3 from "sqlite3";
import fs from "fs";

async function main() {
  const db = await open({ filename: process.env.FLAGS_DB_PATH || "data/app.db", driver: sqlite3.Database });
  const schema = fs.readFileSync("src/db/schema/feature_flags.sql", "utf8");
  await db.exec(schema);

  const now = new Date().toISOString();
  const flags = [
    {
      key: "spray_window",
      description: "Show Spray Window badge in Today tab",
      enabled: 1,
      value_json: JSON.stringify({ enabled: true }),
      rules_json: JSON.stringify([
        { match: { platform_in: ["android","ios"] }, rollout: 100, variant: { enabled: true } }
      ]),
      updated_at: now
    },
    {
      key: "outbreak_radar",
      description: "Hyperlocal outbreak radar card",
      enabled: 1,
      value_json: JSON.stringify({ enabled: false }),
      rules_json: JSON.stringify([
        { match: { country_in: ["TH"], app_version_gte: "1.1.0" }, rollout: 50, variant: { enabled: true } }
      ]),
      updated_at: now
    },
    {
      key: "price_alerts",
      description: "Enable price alerts feature",
      enabled: 1,
      value_json: JSON.stringify({ enabled: true, free_quota: 1 }),
      rules_json: null,
      updated_at: now
    },
    {
      key: "shop_ticket",
      description: "Shop Ticket flow",
      enabled: 1,
      value_json: JSON.stringify({ enabled: true, ttl_hours: 72 }),
      rules_json: null,
      updated_at: now
    },
    {
      key: "ml_thresholds",
      description: "Per-crop ML thresholds",
      enabled: 1,
      value_json: JSON.stringify({ rice: 0.75, durian: 0.75 }),
      rules_json: JSON.stringify([
        // Example: higher threshold on iOS (demo)
        { match: { platform_in: ["ios"] }, rollout: 100, variant: { rice: 0.78, durian: 0.78 } }
      ]),
      updated_at: now
    },
    {
      key: "ml_backend",
      description: "INT8 vs FP16 default backend",
      enabled: 1,
      value_json: JSON.stringify({ rice: "int8", durian: "int8" }),
      rules_json: JSON.stringify([
        { match: { platform_in: ["android"], app_version_gte: "1.2.0" }, rollout: 50, variant: { rice: "fp16", durian: "fp16" } }
      ]),
      updated_at: now
    }
  ];

  await db.exec("BEGIN");
  for (const f of flags) {
    await db.run(
      `INSERT INTO feature_flags (key,description,enabled,value_json,rules_json,updated_at)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(key) DO UPDATE SET
         description=excluded.description,
         enabled=excluded.enabled,
         value_json=excluded.value_json,
         rules_json=excluded.rules_json,
         updated_at=excluded.updated_at`,
      f.key, f.description, f.enabled, f.value_json, f.rules_json, f.updated_at
    );
  }
  await db.exec("COMMIT");
  await db.close();
  console.log("✅ Feature flags seeded");
}

main().catch(e => { console.error(e); process.exit(1); });
