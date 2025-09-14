PRAGMA foreign_keys = ON;

-- Track last processed mutation for dedupe / observability
CREATE TABLE IF NOT EXISTS outbox_log (
  mutation_id TEXT PRIMARY KEY,        -- client-supplied ULID/UUID
  user_id TEXT,
  entity TEXT,                         -- e.g., "price_alert", "shop_ticket_status"
  op TEXT,                             -- "insert" | "update" | "delete"
  status TEXT,                         -- "applied" | "skipped" | "conflict" | "error"
  message TEXT,
  created_at TEXT NOT NULL,            -- server time when recorded
  updated_at TEXT NOT NULL             -- server time when updated (idempotent replays)
);

-- Minimal "updated_at" wiring for delta sync (add to your tables if missing)
-- price_alerts (user-owned)
CREATE TABLE IF NOT EXISTS price_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  crop TEXT NOT NULL,                  -- "rice" | "durian"
  market_key TEXT,                     -- e.g., "talaadthai_pathumthani"
  variety TEXT, size TEXT,
  target_min REAL, target_max REAL,
  unit TEXT NOT NULL,                  -- e.g., "THB/kg"
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- shop_tickets already exists in your stack; ensure it has updated_at
-- (No-op on subsequent runs; if SQLite errors on duplicate column, just ignore in bootstrap)
-- ALTER TABLE shop_tickets ADD COLUMN updated_at TEXT;

-- reference tables (read-only for client; already exist)
-- shops (ensure updated_at exists)
-- ALTER TABLE shops ADD COLUMN updated_at TEXT;

-- product_classes (ensure updated_at exists)
CREATE TABLE IF NOT EXISTS product_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name_th TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
