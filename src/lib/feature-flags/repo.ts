import { Database } from "sqlite";
import { FlagRow } from "./types";

export async function loadAllFlags(db: Database): Promise<FlagRow[]> {
  return db.all<FlagRow[]>(`SELECT * FROM feature_flags WHERE enabled=1`);
}

export async function loadOverridesForUser(db: Database, userOrAnon: string) {
  return db.all<{key:string; value_json:string}[]>(
    `SELECT key, value_json FROM feature_flag_overrides WHERE user_id=?`,
    userOrAnon
  );
}

export async function upsertFlag(db: Database, row: Omit<FlagRow, "updated_at">) {
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO feature_flags (key, description, enabled, value_json, rules_json, updated_at)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(key) DO UPDATE SET
       description=excluded.description,
       enabled=excluded.enabled,
       value_json=excluded.value_json,
       rules_json=excluded.rules_json,
       updated_at=excluded.updated_at`,
    row.key, row.description ?? null, row.enabled ? 1 : 0,
    row.value_json, row.rules_json ?? null, now
  );
}
