-- Postgres views for Metabase analytics
-- Run this in your analytics Postgres database before running metabase-seed.js

-- A. Unified user id + event date
CREATE OR REPLACE VIEW vw_events_enriched AS
SELECT
  COALESCE(NULLIF(user_id, ''), NULLIF(anon_id, '')) AS uid,
  event_name,
  ts AT TIME ZONE 'UTC' AS ts_utc,
  date_trunc('day', ts) AT TIME ZONE 'UTC' AS day_utc,
  app_version,
  platform,
  area_code,
  props
FROM analytics_events
WHERE COALESCE(user_id, anon_id) IS NOT NULL;

-- B. First-seen table (user activation cohorts)
CREATE OR REPLACE VIEW vw_first_seen AS
SELECT
  uid,
  MIN(ts_utc) AS first_ts_utc,
  date_trunc('week', MIN(ts_utc)) AS first_week_utc
FROM vw_events_enriched
GROUP BY uid;

-- Optional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ev_ts ON analytics_events (ts);
CREATE INDEX IF NOT EXISTS idx_ev_uid ON analytics_events ((COALESCE(user_id, anon_id)));
CREATE INDEX IF NOT EXISTS idx_ev_name_ts ON analytics_events (event_name, ts);
CREATE INDEX IF NOT EXISTS idx_ev_props_infer ON analytics_events ((props->>'infer_ms'));
