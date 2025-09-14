PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS crash_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT,                 -- client-generated ULID/UUID (optional)
  device_id TEXT,                 -- hashed device/install id (no raw phone)
  user_id TEXT,                   -- optional (hashed) if logged in
  platform TEXT NOT NULL,         -- "android" | "ios"
  app_version TEXT NOT NULL,      -- "1.0.3 (103)"
  os_version TEXT,                -- "Android 13"
  model TEXT,                     -- "RMX2020"
  is_fatal INTEGER NOT NULL,      -- 0/1
  thread TEXT,                    -- crashed thread name
  exception_type TEXT,            -- e.g., "NullPointerException"
  exception_message TEXT,         -- short message
  stack_hash TEXT,                -- stable hash of top N frames (for grouping)
  stacktrace TEXT NOT NULL,       -- trimmed text (max 64KB recommended)
  breadcrumbs TEXT,               -- JSON array (trimmed)
  battery INTEGER,                -- 0-100 (optional)
  memory_free_mb INTEGER,         -- optional
  network TEXT,                   -- "wifi" | "cell" | "offline"
  locale TEXT,                    -- "th-TH"
  area_code TEXT,                 -- ADM2 or geohash5 (no precise GPS)
  occurred_at TEXT NOT NULL,      -- client time (ISO)
  received_at TEXT NOT NULL,      -- server time (ISO)
  extra TEXT                      -- JSON (sanitized)
);
CREATE INDEX IF NOT EXISTS idx_crash_time ON crash_reports(occurred_at);
CREATE INDEX IF NOT EXISTS idx_crash_appver ON crash_reports(app_version);
CREATE INDEX IF NOT EXISTS idx_crash_stack ON crash_reports(stack_hash);

-- Optional: store long breadcrumbs separately (use only if needed)
CREATE TABLE IF NOT EXISTS crash_breadcrumbs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crash_id INTEGER NOT NULL,
  seq INTEGER NOT NULL,
  ts TEXT,
  type TEXT,
  message TEXT,
  meta TEXT,                      -- JSON
  FOREIGN KEY (crash_id) REFERENCES crash_reports(id) ON DELETE CASCADE
);
