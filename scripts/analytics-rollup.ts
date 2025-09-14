import { openAnalyticsDb } from "../src/lib/analytics/db";

function isoDay(d: Date) { return d.toISOString().slice(0,10); }

(async () => {
  const db = await openAnalyticsDb();
  try {
    // Example: store DAU for yesterday
    const end = new Date(); end.setUTCHours(0,0,0,0);
    const start = new Date(end.getTime() - 24*3600*1000);
    const day = isoDay(start);

    const row = await db.get<{ n:number }>(
      `SELECT COUNT(DISTINCT COALESCE(user_id,anon_id)) AS n
       FROM analytics_events WHERE ts >= ? AND ts < ?`,
      start.toISOString(), end.toISOString()
    );
    await db.run(
      `INSERT OR REPLACE INTO analytics_daily (day, metric, value, extra)
       VALUES (?, 'dau', ?, NULL)`,
      day, row?.n ?? 0
    );
    console.log(`✅ rollup for ${day} done`);
  } finally {
    await db.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
