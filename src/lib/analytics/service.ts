import { Database } from "sqlite";
import { AnalyticsEvent, KpiResult } from "./types";

const WRITE_KEY = process.env.ANALYTICS_INGEST_KEY || "dev-ingest";
const READ_KEY  = process.env.ANALYTICS_READ_KEY  || "dev-read";

export function requireWriteKey(req: any) {
  const k = req.headers["x-api-key"] || req.query.key;
  if (k !== WRITE_KEY) throw new Error("Unauthorized");
}
export function requireReadKey(req: any) {
  const k = req.headers["x-api-key"] || req.query.key;
  if (k !== READ_KEY) throw new Error("Unauthorized");
}

export function sanitize(e: AnalyticsEvent): AnalyticsEvent {
  const safeProps = { ...(e.props || {}) };
  // Strip any suspicious fields
  delete (safeProps as any).phone;
  delete (safeProps as any).gps;
  delete (safeProps as any).image;
  return {
    ...e,
    user_id: e.user_id?.slice(0,128),
    anon_id: e.anon_id?.slice(0,128),
    session_id: e.session_id?.slice(0,128),
    event_name: e.event_name.slice(0,128),
    area_code: e.area_code?.slice(0,32),
    app_version: e.app_version?.slice(0,32),
    props: safeProps
  };
}

export async function insertEvents(db: Database, list: AnalyticsEvent[]) {
  const now = new Date().toISOString();
  await db.exec("BEGIN");
  try {
    const stmt = await db.prepare(
      `INSERT INTO analytics_events
       (user_id,anon_id,session_id,event_name,ts,received_at,app_version,platform,area_code,props)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    );
    for (const x of list) {
      const e = sanitize(x);
      if (!e.ts || !e.event_name) continue;
      await stmt.run(
        e.user_id ?? null,
        e.anon_id ?? null,
        e.session_id ?? null,
        e.event_name,
        new Date(e.ts).toISOString(),
        now,
        e.app_version ?? null,
        e.platform ?? null,
        e.area_code ?? null,
        JSON.stringify(e.props ?? {})
      );
    }
    await stmt.finalize();
    await db.exec("COMMIT");
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  }
}

export async function computeKpis(db: Database, fromISO?: string, toISO?: string): Promise<KpiResult> {
  const to = toISO ? new Date(toISO).toISOString() : new Date().toISOString();
  const from = fromISO ? new Date(fromISO).toISOString() :
    new Date(Date.now() - 30*24*3600*1000).toISOString();

  // DAU/WAU/MAU by distinct user or anon
  const dau = await db.get<{ n: number }>(
    `SELECT COUNT(DISTINCT COALESCE(user_id, anon_id)) AS n
     FROM analytics_events
     WHERE ts >= datetime(?, 'unixepoch') AND ts < datetime(?, 'unixepoch')`,
    Date.parse(to)/1000 - 24*3600, Date.parse(to)/1000
  );
  const wau = await db.get<{ n: number }>(
    `SELECT COUNT(DISTINCT COALESCE(user_id, anon_id)) AS n
     FROM analytics_events
     WHERE ts >= datetime(?, 'unixepoch') AND ts < datetime(?, 'unixepoch')`,
    Date.parse(to)/1000 - 7*24*3600, Date.parse(to)/1000
  );
  const mau = await db.get<{ n: number }>(
    `SELECT COUNT(DISTINCT COALESCE(user_id, anon_id)) AS n
     FROM analytics_events
     WHERE ts >= datetime(?, 'unixepoch') AND ts < datetime(?, 'unixepoch')`,
    Date.parse(to)/1000 - 30*24*3600, Date.parse(to)/1000
  );

  // New users in window
  const newUsers = await db.get<{ n: number }>(
    `WITH first_seen AS (
       SELECT COALESCE(user_id, anon_id) AS uid, MIN(ts) AS first_ts
       FROM analytics_events
       WHERE COALESCE(user_id, anon_id) IS NOT NULL
       GROUP BY uid
     )
     SELECT COUNT(*) AS n
     FROM first_seen
     WHERE first_ts >= ? AND first_ts < ?`,
    from, to
  );

  // Activation: among users whose first_ts in window, did they perform one of target actions within 7 days?
  const activation = await db.get<{ rate: number }>(
    `WITH first_seen AS (
       SELECT COALESCE(user_id, anon_id) AS uid, MIN(ts) AS first_ts
       FROM analytics_events
       WHERE COALESCE(user_id, anon_id) IS NOT NULL
       GROUP BY uid
     ), cohort AS (
       SELECT * FROM first_seen WHERE first_ts >= ? AND first_ts < ?
     ), actions AS (
       SELECT DISTINCT COALESCE(user_id, anon_id) AS uid
       FROM analytics_events e
       JOIN cohort c ON COALESCE(e.user_id, e.anon_id) = c.uid
       WHERE e.event_name IN ('set_reminder','shop_ticket_created','price_alert_created')
         AND e.ts <= datetime(c.first_ts, '+7 days')
     )
     SELECT CASE WHEN COUNT(*)=0 THEN 0.0 ELSE (SELECT COUNT(*) FROM actions)*1.0 / COUNT(*) END AS rate
     FROM cohort`,
    from, to
  );

  // Scan→Action within 1 day of classify_done
  const scanToAction = await db.get<{ rate: number }>(
    `WITH scans AS (
       SELECT rowid AS rid, COALESCE(user_id, anon_id) AS uid, ts
       FROM analytics_events
       WHERE event_name='classify_done' AND ts >= ? AND ts < ?
     ), acts AS (
       SELECT DISTINCT s.rid
       FROM scans s
       JOIN analytics_events e ON COALESCE(e.user_id, e.anon_id) = s.uid
        AND e.ts >= s.ts AND e.ts <= datetime(s.ts, '+1 day')
        AND e.event_name IN ('set_reminder','shop_ticket_created')
     )
     SELECT CASE WHEN COUNT(*)=0 THEN 0.0 ELSE (SELECT COUNT(*) FROM acts)*1.0 / COUNT(*) END AS rate
     FROM scans`,
    from, to
  );

  // Latency (assumes you send classify_done with props.infer_ms)
  const p = await db.get<{ p50: number|null, p95: number|null }>(
    `WITH vals AS (
       SELECT CAST(json_extract(props,'$.infer_ms') AS REAL) AS v
       FROM analytics_events
       WHERE event_name='classify_done'
         AND ts >= ? AND ts < ?
         AND json_type(json_extract(props,'$.infer_ms'))='number'
     )
     SELECT
       (SELECT v FROM vals ORDER BY v LIMIT 1 OFFSET CAST(0.50*(SELECT COUNT(*) FROM vals) AS INT)) AS p50,
       (SELECT v FROM vals ORDER BY v LIMIT 1 OFFSET CAST(0.95*(SELECT COUNT(*) FROM vals) AS INT)) AS p95
  `, from, to);

  // Feature usage counts (top 10)
  const features = await db.all<{ event_name: string; count: number }[]>(
    `SELECT event_name, COUNT(*) AS count
     FROM analytics_events
     WHERE ts >= ? AND ts < ?
     GROUP BY event_name
     ORDER BY count DESC
     LIMIT 10`, from, to
  );

  return {
    dau: dau?.n ?? 0,
    wau: wau?.n ?? 0,
    mau: mau?.n ?? 0,
    new_users: newUsers?.n ?? 0,
    activation_rate: activation?.rate ?? 0,
    scan_to_action: scanToAction?.rate ?? 0,
    infer_p50_ms: p?.p50 ?? 0,
    infer_p95_ms: p?.p95 ?? 0,
    feature_usage: features
  };
}
