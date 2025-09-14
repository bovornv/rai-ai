import sqlite3 from "sqlite3";
import { open } from "sqlite";

function isoDay(d=new Date()){ return d.toISOString().slice(0,10); }

(async () => {
  const db = await open({ filename: process.env.CRASH_DB_PATH || "data/app.db", driver: sqlite3.Database });
  const to = new Date(); to.setUTCHours(0,0,0,0);
  const from = new Date(to.getTime() - 24*3600*1000);

  const rows = await db.all(`
    SELECT app_version, stack_hash, exception_type, COUNT(*) AS n
    FROM crash_reports
    WHERE occurred_at >= ? AND occurred_at < ?
    GROUP BY app_version, stack_hash, exception_type
    ORDER BY n DESC
    LIMIT 50;
  `, from.toISOString(), to.toISOString());

  console.log(`Crash digest ${isoDay(from)} → ${isoDay(to)}\n`);
  for (const r of rows) {
    console.log(`${r.n} × [${r.app_version}] ${r.exception_type || "Exception"}  ${r.stack_hash}`);
  }
  await db.close();
})().catch(e => { console.error(e); process.exit(1); });
