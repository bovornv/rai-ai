CREATE TABLE IF NOT EXISTS fx_rates (
  day TEXT NOT NULL,           -- 'YYYY-MM-DD' (UTC)
  base TEXT NOT NULL,          -- e.g., 'USD'
  quote TEXT NOT NULL,         -- e.g., 'THB'
  rate REAL NOT NULL,          -- 1 base -> rate quote
  PRIMARY KEY (day, base, quote)
);

CREATE INDEX IF NOT EXISTS idx_fx_quote ON fx_rates(quote, day);
