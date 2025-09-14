import { Router } from "express";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import crypto from "crypto";
import { loadAllFlags, loadOverridesForUser } from "../lib/feature-flags/repo";
import { evaluateFlags } from "../lib/feature-flags/eval";
import { EvalContext } from "../lib/feature-flags/types";

export async function openFlagsDb(dbPath = process.env.FLAGS_DB_PATH || "data/app.db") {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

export function makeFeatureFlagsRouter(db: Database) {
  const r = Router();

  r.get("/", async (req, res) => {
    try {
      // 1) Build context from headers/query (no PII)
      const ctx: EvalContext = {
        user_id: (req.headers["x-user-id"] as string) || (req.query.user_id as string),
        anon_id: (req.headers["x-anon-id"] as string) || (req.query.anon_id as string),
        app_version: (req.headers["x-app-version"] as string) || (req.query.app_version as string),
        platform: (req.headers["x-platform"] as any) || (req.query.platform as any),
        country: (req.headers["x-country"] as any) || (req.query.country as any) || "TH",
        area_code: (req.headers["x-area"] as string) || (req.query.area_code as string),
        crop: (req.headers["x-crop"] as any) || (req.query.crop as any)
      };

      const userKey = ctx.user_id || ctx.anon_id;
      const [rows, ovPairs] = await Promise.all([
        loadAllFlags(db),
        userKey ? loadOverridesForUser(db, userKey) : Promise.resolve([])
      ]);
      const overrides = Object.fromEntries(ovPairs.map(x => [x.key, JSON.parse(x.value_json)]));

      const flags = evaluateFlags(ctx, rows, overrides);

      // ETag for client caching (hash of payload)
      const payload = JSON.stringify({ flags, updated_at: latestUpdatedAt(rows) });
      const etag = `"W/${sha256(payload)}"`;
      if (req.headers["if-none-match"] === etag) {
        return res.status(304).end();
      }

      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "public, max-age=300");          // 5 minutes
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.json({ flags });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return r;
}

// helpers
function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
function latestUpdatedAt(rows: {updated_at:string}[]) {
  return rows.reduce((m, r) => r.updated_at > m ? r.updated_at : m, "1970-01-01T00:00:00Z");
}
