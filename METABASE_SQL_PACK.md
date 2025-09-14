# Metabase SQL Pack for RaiAI Analytics

## Quick Setup

1. **Create Postgres connection** in Metabase pointing to your analytics database
2. **Create the helper views** (run once in psql/pgAdmin)
3. **Paste each SQL block** into Metabase as Questions
4. **Build dashboard** with the suggested visualizations

## Helper Views (Create Once)

### A. Unified user id + event date
```sql
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
```

### B. First-seen table (user activation cohorts)
```sql
CREATE OR REPLACE VIEW vw_first_seen AS
SELECT
  uid,
  MIN(ts_utc) AS first_ts_utc,
  date_trunc('week', MIN(ts_utc)) AS first_week_utc
FROM vw_events_enriched
GROUP BY uid;
```

## Analytics Questions

### 1. DAU (Distinct users today)
**Title:** DAU (Distinct users today)
**Viz:** Single Value (Stat)

```sql
SELECT COUNT(DISTINCT uid) AS dau
FROM vw_events_enriched
WHERE ts_utc >= date_trunc('day', now())
  AND ts_utc <  date_trunc('day', now()) + interval '1 day';
```

### 2. WAU (last 7 days)
**Title:** WAU (last 7 days)
**Viz:** Single Value (Stat)

```sql
SELECT COUNT(DISTINCT uid) AS wau
FROM vw_events_enriched
WHERE ts_utc >= now() - interval '7 days'
  AND ts_utc <  now();
```

### 3. MAU (last 30 days)
**Title:** MAU (last 30 days)
**Viz:** Single Value (Stat)

```sql
SELECT COUNT(DISTINCT uid) AS mau
FROM vw_events_enriched
WHERE ts_utc >= now() - interval '30 days'
  AND ts_utc <  now();
```

### 4. Daily Active Users (DAU)
**Title:** Daily Active Users (DAU)
**Viz:** Line / Area
**Params:** start_date (Date), end_date (Date)

```sql
SELECT
  date_trunc('day', ts_utc) AS day,
  COUNT(DISTINCT uid) AS dau
FROM vw_events_enriched
WHERE ts_utc >= {{start_date}}::timestamptz
  AND ts_utc <  {{end_date}}::timestamptz
GROUP BY 1
ORDER BY 1;
```

### 5. Top Events (by count)
**Title:** Top Events (by count)
**Viz:** Table / Bar
**Params:** start_date (Date), end_date (Date)

```sql
SELECT
  event_name,
  COUNT(*) AS events
FROM vw_events_enriched
WHERE ts_utc >= {{start_date}}::timestamptz
  AND ts_utc <  {{end_date}}::timestamptz
GROUP BY 1
ORDER BY events DESC
LIMIT 20;
```

### 6. Inference Latency p50/p95 (ms)
**Title:** Inference Latency p50/p95 (ms)
**Viz:** Line chart with 2 series (p50, p95)
**Params:** start_date (Date), end_date (Date)

```sql
WITH vals AS (
  SELECT
    date_trunc('day', ts_utc) AS day,
    (props->>'infer_ms')::numeric AS v
  FROM vw_events_enriched
  WHERE event_name = 'classify_done'
    AND ts_utc >= {{start_date}}::timestamptz
    AND ts_utc <  {{end_date}}::timestamptz
    AND jsonb_typeof(props->'infer_ms') = 'number'
)
SELECT
  day,
  percentile_disc(0.50) WITHIN GROUP (ORDER BY v) AS p50_ms,
  percentile_disc(0.95) WITHIN GROUP (ORDER BY v) AS p95_ms
FROM vals
GROUP BY day
ORDER BY day;
```

### 7. Scan → Action Conversion % (daily)
**Title:** Scan → Action Conversion % (daily)
**Viz:** Line
**Params:** start_date (Date), end_date (Date)

```sql
WITH scans AS (
  SELECT uid, ts_utc::timestamptz AS ts_day, date_trunc('day', ts_utc) AS day
  FROM vw_events_enriched
  WHERE event_name = 'classify_done'
    AND ts_utc >= {{start_date}}::timestamptz
    AND ts_utc <  {{end_date}}::timestamptz
),
acts AS (
  SELECT s.day, s.uid
  FROM scans s
  JOIN vw_events_enriched e
    ON e.uid = s.uid
   AND e.ts_utc >= s.ts_day
   AND e.ts_utc <= s.ts_day + interval '1 day'
   AND e.event_name IN ('set_reminder','shop_ticket_created')
  GROUP BY s.day, s.uid
),
agg AS (
  SELECT day,
         COUNT(*) AS scans,
         (SELECT COUNT(*) FROM acts a WHERE a.day = s.day) AS actions
  FROM scans s
  GROUP BY day
)
SELECT
  day,
  CASE WHEN scans = 0 THEN 0
       ELSE ROUND(100.0 * actions::numeric / scans, 1)
  END AS conv_pct
FROM agg
ORDER BY day;
```

### 8. Activation Rate (7-day)
**Title:** Activation Rate (7-day)
**Viz:** Single row Table (or three Stat tiles)
**Params:** start_date (Date), end_date (Date)

```sql
WITH cohort AS (
  SELECT f.uid, f.first_ts_utc
  FROM vw_first_seen f
  WHERE f.first_ts_utc >= {{start_date}}::timestamptz
    AND f.first_ts_utc <  {{end_date}}::timestamptz
),
activated AS (
  SELECT DISTINCT c.uid
  FROM cohort c
  JOIN vw_events_enriched e
    ON e.uid = c.uid
   AND e.ts_utc <= c.first_ts_utc + interval '7 days'
   AND e.event_name IN ('set_reminder','shop_ticket_created','price_alert_created')
)
SELECT
  COUNT(*) AS new_users,
  (SELECT COUNT(*) FROM activated) AS activated_users,
  CASE WHEN COUNT(*) = 0 THEN 0
       ELSE ROUND(100.0 * (SELECT COUNT(*) FROM activated)::numeric / COUNT(*), 1)
  END AS activation_rate_pct
FROM cohort;
```

### 9. Weekly Retention (Cohort % by week 0–8)
**Title:** Weekly Retention (Cohort % by week 0–8)
**Viz:** Table → Format as Heatmap columns (wk0–wk8)
**Params:** start_date (Date), end_date (Date)

```sql
WITH cohort AS (
  SELECT uid, date_trunc('week', first_ts_utc) AS cohort_week
  FROM vw_first_seen
  WHERE first_ts_utc >= {{start_date}}::timestamptz
    AND first_ts_utc <  {{end_date}}::timestamptz
),
activity AS (
  SELECT uid, date_trunc('week', ts_utc) AS active_week
  FROM vw_events_enriched
),
joined AS (
  SELECT c.cohort_week, a.active_week, c.uid
  FROM cohort c
  JOIN activity a USING (uid)
  WHERE a.active_week >= c.cohort_week
    AND a.active_week <  c.cohort_week + interval '9 weeks'
),
matrix AS (
  SELECT
    cohort_week,
    EXTRACT(WEEK FROM (active_week - cohort_week))::int AS wk,
    COUNT(DISTINCT uid) AS active_users
  FROM joined
  GROUP BY 1,2
),
base AS (
  SELECT cohort_week, COUNT(DISTINCT uid) AS cohort_size
  FROM cohort
  GROUP BY 1
)
SELECT
  m.cohort_week::date,
  b.cohort_size,
  ROUND(100.0 * m0.active_users::numeric / b.cohort_size, 1) AS wk0,
  ROUND(100.0 * m1.active_users::numeric / b.cohort_size, 1) AS wk1,
  ROUND(100.0 * m2.active_users::numeric / b.cohort_size, 1) AS wk2,
  ROUND(100.0 * m3.active_users::numeric / b.cohort_size, 1) AS wk3,
  ROUND(100.0 * m4.active_users::numeric / b.cohort_size, 1) AS wk4,
  ROUND(100.0 * m5.active_users::numeric / b.cohort_size, 1) AS wk5,
  ROUND(100.0 * m6.active_users::numeric / b.cohort_size, 1) AS wk6,
  ROUND(100.0 * m7.active_users::numeric / b.cohort_size, 1) AS wk7,
  ROUND(100.0 * m8.active_users::numeric / b.cohort_size, 1) AS wk8
FROM base b
LEFT JOIN matrix m0 ON m0.cohort_week=b.cohort_week AND m0.wk=0
LEFT JOIN matrix m1 ON m1.cohort_week=b.cohort_week AND m1.wk=1
LEFT JOIN matrix m2 ON m2.cohort_week=b.cohort_week AND m2.wk=2
LEFT JOIN matrix m3 ON m3.cohort_week=b.cohort_week AND m3.wk=3
LEFT JOIN matrix m4 ON m4.cohort_week=b.cohort_week AND m4.wk=4
LEFT JOIN matrix m5 ON m5.cohort_week=b.cohort_week AND m5.wk=5
LEFT JOIN matrix m6 ON m6.cohort_week=b.cohort_week AND m6.wk=6
LEFT JOIN matrix m7 ON m7.cohort_week=b.cohort_week AND m7.wk=7
LEFT JOIN matrix m8 ON m8.cohort_week=b.cohort_week AND m8.wk=8
ORDER BY cohort_week;
```

### 10. DAU by Platform
**Title:** DAU by Platform
**Viz:** Stacked Area (by platform)
**Params:** start_date (Date), end_date (Date)

```sql
SELECT
  date_trunc('day', ts_utc) AS day,
  platform,
  COUNT(DISTINCT uid) AS dau
FROM vw_events_enriched
WHERE ts_utc >= {{start_date}}::timestamptz
  AND ts_utc <  {{end_date}}::timestamptz
GROUP BY 1,2
ORDER BY 1,2;
```

### 11. Active Users by Area (Top 10)
**Title:** Active Users by Area (Top 10)
**Viz:** Bar
**Params:** start_date (Date), end_date (Date)

```sql
SELECT
  area_code,
  COUNT(DISTINCT uid) AS users
FROM vw_events_enriched
WHERE ts_utc >= {{start_date}}::timestamptz
  AND ts_utc <  {{end_date}}::timestamptz
GROUP BY 1
ORDER BY users DESC
LIMIT 10;
```

### 12. Funnel: scan_started → classify_done → action(24h)
**Title:** Funnel: scan_started → classify_done → action(24h)
**Viz:** Funnel (3-number stat or bar)
**Params:** start_date (Date), end_date (Date)

```sql
WITH base AS (
  SELECT uid, MIN(ts_utc) AS scan_ts
  FROM vw_events_enriched
  WHERE event_name='scan_started'
    AND ts_utc >= {{start_date}}::timestamptz
    AND ts_utc <  {{end_date}}::timestamptz
  GROUP BY uid
),
step2 AS (
  SELECT b.uid, MIN(e.ts_utc) AS classify_ts
  FROM base b
  JOIN vw_events_enriched e ON e.uid=b.uid
   AND e.event_name='classify_done'
   AND e.ts_utc >= b.scan_ts
   AND e.ts_utc <= b.scan_ts + interval '1 day'
  GROUP BY b.uid
),
step3 AS (
  SELECT b.uid, MIN(e.ts_utc) AS action_ts
  FROM base b
  JOIN vw_events_enriched e ON e.uid=b.uid
   AND e.event_name IN ('set_reminder','shop_ticket_created')
   AND e.ts_utc >= COALESCE((SELECT classify_ts FROM step2 s WHERE s.uid=b.uid), b.scan_ts)
   AND e.ts_utc <= b.scan_ts + interval '1 day'
  GROUP BY b.uid
)
SELECT
  (SELECT COUNT(*) FROM base)     AS step1_scan,
  (SELECT COUNT(*) FROM step2)    AS step2_classified,
  (SELECT COUNT(*) FROM step3)    AS step3_action;
```

### 13. Uncertain Rate (daily)
**Title:** Uncertain Rate (daily)
**Viz:** Line
**Params:** start_date (Date), end_date (Date)

```sql
SELECT
  date_trunc('day', ts_utc) AS day,
  ROUND(100.0 * AVG( (props->>'uncertain')::boolean::int ), 1) AS uncertain_pct
FROM vw_events_enriched
WHERE event_name='classify_done'
  AND ts_utc >= {{start_date}}::timestamptz
  AND ts_utc <  {{end_date}}::timestamptz
GROUP BY 1
ORDER BY 1;
```

### 14. Shop Tickets Created (daily)
**Title:** Shop Tickets Created (daily)
**Viz:** Line
**Params:** start_date (Date), end_date (Date)

```sql
SELECT
  date_trunc('day', ts_utc) AS day,
  COUNT(*) AS tickets
FROM vw_events_enriched
WHERE event_name='shop_ticket_created'
  AND ts_utc >= {{start_date}}::timestamptz
  AND ts_utc <  {{end_date}}::timestamptz
GROUP BY 1
ORDER BY 1;
```

## Dashboard Setup

Create a dashboard called **"RaiAI • Product KPIs"** with:

1. **DAU/WAU/MAU** (single stats)
2. **Daily Active Users** (line)
3. **p50/p95 latency** (line)
4. **Scan→Action** (line)
5. **Activation Rate** (single stat)
6. **Retention Cohort** (table heatmap)
7. **Top Events** (bar)
8. **DAU by Platform** (stacked area)
9. **Area Top10** (bar)
10. **Shop Tickets** (line)
11. **Uncertain Rate** (line)

## Optional Indexes (Postgres)

```sql
CREATE INDEX IF NOT EXISTS idx_ev_ts ON analytics_events (ts);
CREATE INDEX IF NOT EXISTS idx_ev_uid ON analytics_events ((COALESCE(user_id, anon_id)));
CREATE INDEX IF NOT EXISTS idx_ev_name_ts ON analytics_events (event_name, ts);
CREATE INDEX IF NOT EXISTS idx_ev_props_infer ON analytics_events ((props->>'infer_ms'));
```

## Data Sanity Checklist

- ✅ Ensure client sends `props.infer_ms` (number) and `props.uncertain` (boolean) for `classify_done`
- ✅ Ensure `area_code` uses ADM2 or geohash5 (no precise GPS)
- ✅ Ensure `uid` is present (either `user_id` or `anon_id`)
