-- Shop Ticket Service Database Schema
-- Migration 001: Create tables

-- shops & staff
CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_th TEXT NOT NULL,
  province_code TEXT, 
  amphoe_code TEXT, 
  tambon_code TEXT,
  address TEXT, 
  phone TEXT, 
  line_id TEXT,
  referral_code TEXT UNIQUE,            -- printed at counter (for attribution)
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- product classes (neutral, not brand-biased)
CREATE TABLE IF NOT EXISTS product_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,             -- e.g., "fungicide_triazole"
  name_th TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- tickets
CREATE TABLE IF NOT EXISTS shop_tickets (
  id TEXT PRIMARY KEY,                  -- short ULID
  user_id TEXT NOT NULL,
  crop TEXT NOT NULL,                   -- "rice" | "durian"
  diagnosis_key TEXT NOT NULL,          -- e.g., "rice_brown_spot"
  severity INTEGER,                     -- 1..5
  recommended_classes TEXT NOT NULL,    -- JSON array of product class keys
  dosage_note TEXT,
  rai REAL,                             -- area
  status TEXT NOT NULL,                 -- "issued" | "scanned" | "fulfilled" | "expired" | "canceled"
  shop_id INTEGER,                      -- optional: pre-selected shop
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  redeemed_at TEXT,
  hmac_sig TEXT NOT NULL,               -- anti-tamper signature for QR payload
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- what was actually sold (recorded at counter)
CREATE TABLE IF NOT EXISTS ticket_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  shop_id INTEGER NOT NULL,
  item_desc TEXT NOT NULL,              -- "Triazole fungicide 500cc"
  class_key TEXT,                       -- nullable (if unknown)
  qty REAL, 
  unit TEXT,                            -- e.g., 2, "bottle"
  price_thb REAL,                       -- per unit or total (decide once)
  total_thb REAL NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES shop_tickets(id),
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user ON shop_tickets(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON shop_tickets(status, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_expires ON shop_tickets(expires_at);
CREATE INDEX IF NOT EXISTS idx_sales_shop ON ticket_sales(shop_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_ticket ON ticket_sales(ticket_id);
CREATE INDEX IF NOT EXISTS idx_shops_referral ON shops(referral_code);
CREATE INDEX IF NOT EXISTS idx_shops_province ON shops(province_code, is_active);
