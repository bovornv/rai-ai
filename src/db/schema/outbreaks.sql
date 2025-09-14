-- Outbreak raw reports (no images here; only hashes/references)
CREATE TABLE IF NOT EXISTS outbreak_reports (
  id            TEXT PRIMARY KEY,
  geohash5      TEXT NOT NULL,
  crop          TEXT NOT NULL,              -- 'rice' | 'durian'
  label         TEXT NOT NULL,
  confidence    REAL,                       -- null for manual
  observed_at   TEXT NOT NULL,              -- ISO
  source        TEXT NOT NULL,              -- 'scan' | 'manual' | 'partner'
  photo_hash    TEXT,
  ticket_id     TEXT,
  partner_id    TEXT,
  device_id     TEXT,
  field_id      TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_or_time ON outbreak_reports (observed_at);
CREATE INDEX IF NOT EXISTS idx_or_geo ON outbreak_reports (geohash5, crop);
CREATE INDEX IF NOT EXISTS idx_or_label ON outbreak_reports (label);

-- Daily aggregates (for fast trend/radar)
CREATE TABLE IF NOT EXISTS outbreak_agg_daily (
  geohash5    TEXT NOT NULL,
  crop        TEXT NOT NULL,
  date        TEXT NOT NULL,         -- 'YYYY-MM-DD'
  count       INTEGER NOT NULL,
  top1_label  TEXT,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (geohash5, crop, date)
);

-- Roll-up job (run daily/hourly)
-- Re-aggregate last 35 days to be safe, then upsert.
WITH src AS (
  SELECT
    geohash5, crop,
    substr(observed_at, 1, 10) AS date,
    COUNT(*) AS cnt
  FROM outbreak_reports
  WHERE observed_at >= datetime('now', '-35 days')
    AND (confidence IS NULL OR confidence >= 0.75)
  GROUP BY geohash5, crop, date
),
top AS (
  SELECT geohash5, crop, date, label
  FROM (
    SELECT geohash5, crop, substr(observed_at,1,10) AS date, label,
           ROW_NUMBER() OVER (PARTITION BY geohash5,crop,substr(observed_at,1,10) ORDER BY COUNT(*) DESC) AS rn
    FROM outbreak_reports
    WHERE observed_at >= datetime('now', '-35 days')
      AND (confidence IS NULL OR confidence >= 0.75)
    GROUP BY geohash5,crop,date,label
  ) t WHERE rn=1
)
INSERT INTO outbreak_agg_daily (geohash5, crop, date, count, top1_label, updated_at)
SELECT s.geohash5, s.crop, s.date, s.cnt, t.label, strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM src s LEFT JOIN top t
  ON s.geohash5=t.geohash5 AND s.crop=t.crop AND s.date=t.date
ON CONFLICT(geohash5,crop,date) DO UPDATE SET
  count=excluded.count, top1_label=excluded.top1_label, updated_at=excluded.updated_at;
