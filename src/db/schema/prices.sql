PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS markets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,               -- e.g., "talaadthai_pathumthani", "trea_fob"
  name TEXT NOT NULL,                     -- e.g., "TalaadThai (Pathum Thani)"
  location_code TEXT                      -- optional ADM code
);

CREATE TABLE IF NOT EXISTS price_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop TEXT NOT NULL,                     -- "rice" | "durian"
  variety TEXT,                           -- e.g., "hom_mali", "monthong"
  grade TEXT,                             -- e.g., "100%B", "export", or size grade (L, M)
  size TEXT,                              -- e.g., "L", "M", "80-100"
  unit TEXT NOT NULL,                     -- "USD/MT" | "THB/kg"
  price_min REAL NOT NULL,
  price_max REAL NOT NULL,
  currency TEXT NOT NULL,                 -- "USD" | "THB"
  source TEXT NOT NULL,                   -- "trea" | "talaadthai"
  market_id INTEGER,                      -- FK (nullable for FOB)
  observed_at TEXT NOT NULL,              -- ISO datetime (UTC)
  raw_text TEXT,                          -- original scraped text for audit
  UNIQUE(crop, variety, grade, size, unit, source, market_id, observed_at),
  FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS buyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop TEXT NOT NULL,                     -- "rice" | "durian"
  name_th TEXT,                           -- Thai name
  name_en TEXT,                           -- English name
  type TEXT NOT NULL,                     -- "exporter" | "packhouse" | "mill" | "coop"
  province TEXT,                          -- Province name
  district TEXT,                          -- District name
  address TEXT,                           -- Full address
  phone TEXT,                             -- Phone number
  line_id TEXT,                           -- LINE ID
  website TEXT,                           -- Website URL
  email TEXT,                             -- Email address
  verified_source TEXT,                   -- "trea" | "doa" | "gacc" | "manual"
  last_checked_at TEXT,                   -- ISO datetime (UTC)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quotes_crop_obs ON price_quotes(crop, observed_at);
CREATE INDEX IF NOT EXISTS idx_quotes_market_obs ON price_quotes(market_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_quotes_source_obs ON price_quotes(source, observed_at);
CREATE INDEX IF NOT EXISTS idx_buyers_crop ON buyers(crop);
CREATE INDEX IF NOT EXISTS idx_buyers_province ON buyers(province);
CREATE INDEX IF NOT EXISTS idx_buyers_type ON buyers(type);
CREATE INDEX IF NOT EXISTS idx_buyers_verified ON buyers(verified_source);
