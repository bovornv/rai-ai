PRAGMA foreign_keys = ON;

-- Flag registry
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,               -- e.g., "spray_window", "outbreak_radar"
  description TEXT,
  enabled INTEGER NOT NULL DEFAULT 1, -- kill switch
  value_json TEXT NOT NULL,           -- default value/variant JSON
  rules_json TEXT,                    -- JSON array of rules for targeting/rollout
  updated_at TEXT NOT NULL
);

-- Optional per-user overrides (QA / support)
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
  key TEXT NOT NULL,
  user_id TEXT NOT NULL,              -- or anon_id
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (key, user_id),
  FOREIGN KEY (key) REFERENCES feature_flags(key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flag_overrides_user ON feature_flag_overrides(user_id);
