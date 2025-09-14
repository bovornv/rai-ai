PRAGMA foreign_keys = ON;

-- Raw events (immutable)
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,                 -- stable app user id (not phone#)
  anon_id TEXT,                 -- device/session anon id if user not logged in
  session_id TEXT,
  event_name TEXT NOT NULL,     -- e.g., "scan_started", "classify_done", "set_reminder", "shop_ticket_created"
  ts TEXT NOT NULL,             -- client timestamp ISO (UTC)
  received_at TEXT NOT NULL,    -- server timestamp ISO (UTC)
  app_version TEXT,
  platform TEXT,                -- "android" | "ios" | "web"
  area_code TEXT,               -- e.g., ADM2 code (amphoe) or geohash5 (no precise GPS)
  props TEXT NOT NULL           -- JSON string of event props (sanitized)
);
CREATE INDEX IF NOT EXISTS idx_events_time ON analytics_events(ts);
CREATE INDEX IF NOT EXISTS idx_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_area ON analytics_events(area_code);

-- Daily rollups (fast KPIs)
CREATE TABLE IF NOT EXISTS analytics_daily (
  day TEXT NOT NULL,            -- YYYY-MM-DD
  metric TEXT NOT NULL,         -- e.g., "dau","wau","mau","new_users","scan_to_action","p50_infer_ms","p95_infer_ms"
  value REAL NOT NULL,
  extra TEXT,                   -- JSON (e.g., by platform)
  PRIMARY KEY (day, metric)
);
