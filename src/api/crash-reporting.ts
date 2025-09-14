import { Router } from "express";
import RateLimit from "express-rate-limit";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { CrashReport } from "../lib/crash/types";
import { insertCrash } from "../lib/crash/service";
import fs from "fs";
import path from "path";

const INGEST_KEY = process.env.CRASH_INGEST_KEY || "dev-crash";

export async function openCrashDb(dbPath = process.env.CRASH_DB_PATH || "data/app.db") {
  const db: Database = await open({ filename: dbPath, driver: sqlite3.Database });
  const sql = fs.readFileSync(path.join("src","db","schema","crash.sql"), "utf8");
  await db.exec(sql);
  return db;
}

function requireKey(req: any) {
  const k = req.headers["x-api-key"] || req.query.key;
  if (k !== INGEST_KEY) throw Object.assign(new Error("Unauthorized"), { code: 401 });
}

// IP + (device_id if present) simple limiter
const limiter = RateLimit({
  windowMs: 60_000,
  limit: 20, // 20 req/min per IP
  standardHeaders: true,
  legacyHeaders: false
});

export function makeCrashRouter(db: Database) {
  const r = Router();
  r.use(limiter);

  r.post("/crash-reports", async (req, res) => {
    try {
      requireKey(req);
      const body = req.body || {};
      const reports: CrashReport[] =
        Array.isArray(body.reports) ? body.reports :
        body.report ? [body.report] :
        []; // accept {report} or {reports:[]}

      if (!reports.length) return res.status(400).json({ error: "No crash reports" });

      // Max payload safety (avoid huge uploads)
      const rawLen = JSON.stringify(body).length;
      if (rawLen > 512 * 1024) return res.status(413).json({ error: "Payload too large" });

      const results = [];
      for (const rep of reports) {
        // minimal required fields
        if (!rep.platform || !rep.app_version || !rep.stacktrace || !rep.occurred_at) {
          continue;
        }
        results.push(await insertCrash(db, rep));
      }
      res.json({ ok: true, count: results.length, items: results });
    } catch (e: any) {
      const code = e.code === 401 ? 401 : 500;
      res.status(code).json({ error: e.message });
    }
  });

  return r;
}
