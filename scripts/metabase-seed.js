/**
 * Seeds a complete "RaiAI • Product KPIs" dashboard in Metabase:
 * - logs in (session)
 * - creates Questions (cards) with the SQL you approved
 * - creates Dashboard
 * - places the cards with a sensible layout
 *
 * ENV:
 *   MB_URL=https://metabase.example.com
 *   MB_USER=admin@your.co
 *   MB_PASS=******
 *   MB_DB_ID=2                  # Postgres connection id (where analytics_events lives)
 *   MB_COLLECTION_ID=           # optional: numeric collection id (default = Root)
 *
 * Run: node scripts/metabase-seed.js
 */
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const MB_URL = process.env.MB_URL || "http://localhost:3002";
const MB_USER = process.env.MB_USER || "admin@metabase.local";
const MB_PASS = process.env.MB_PASS || "metabase";
const MB_DB_ID = Number(process.env.MB_DB_ID || 2);
const MB_COLLECTION_ID = process.env.MB_COLLECTION_ID ? Number(process.env.MB_COLLECTION_ID) : null;

function nt(q, tags={}) {
  // native query payload
  return {
    type: "native",
    native: { query: q, "template-tags": tags },
    database: MB_DB_ID
  };
}
const tagDateRange = {
  start_date: { name: "start_date", "display-name": "Start date", type: "date", required: true },
  end_date:   { name: "end_date",   "display-name": "End date",   type: "date", required: true }
};

async function login() {
  const res = await fetch(`${MB_URL}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: MB_USER, password: MB_PASS })
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const j = await res.json();
  return j.id;
}

async function createCard(session, {name, description="", display="table", dataset_query, visualization_settings={}}) {
  const res = await fetch(`${MB_URL}/api/card`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Metabase-Session": session },
    body: JSON.stringify({
      name, description,
      dataset_query,
      display,
      visualization_settings,
      collection_id: MB_COLLECTION_ID
    })
  });
  if (!res.ok) throw new Error(`Create card "${name}" failed: ${res.status} ${await res.text()}`);
  return res.json(); // {id,...}
}

async function createDashboard(session, {name, description=""}) {
  const res = await fetch(`${MB_URL}/api/dashboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Metabase-Session": session },
    body: JSON.stringify({ name, description, collection_id: MB_COLLECTION_ID })
  });
  if (!res.ok) throw new Error(`Create dashboard failed: ${res.status} ${await res.text()}`);
  return res.json(); // {id,...}
}

async function addDashCard(session, dashId, cardId, x, y, w, h, paramMappings=[]) {
  const res = await fetch(`${MB_URL}/api/dashboard/${dashId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Metabase-Session": session },
    body: JSON.stringify({
      cardId,
      dashboard_id: dashId,
      sizeX: w, sizeY: h,
      row: y, col: x,
      parameter_mappings: paramMappings
    })
  });
  if (!res.ok) throw new Error(`Add card ${cardId} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function mapRangeParams(card, dashParams=["start_date","end_date"]) {
  // Wire question params to dashboard params (both named start_date / end_date)
  const mappings = [];
  for (const p of dashParams) {
    if (card.parameter_mappings?.some(m => m.parameter_name === p)) continue;
    mappings.push({
      parameter_name: p,
      card_parameter: { id: p, name: p, type: "date/range" }
    });
  }
  return mappings;
}

async function main() {
  const session = await login();
  console.log("✅ Metabase login ok");

  // --------- Create all Questions (cards) ----------
  const cards = {};

  // Views note: seed assumes you already created vw_events_enriched and vw_first_seen in PG.

  // DAU tile
  cards.dau = await createCard(session, {
    name: "DAU (today)",
    display: "scalar",
    dataset_query: nt(`
      SELECT COUNT(DISTINCT COALESCE(NULLIF(user_id,''), NULLIF(anon_id,''))) AS dau
      FROM analytics_events
      WHERE ts >= date_trunc('day', now())
        AND ts <  date_trunc('day', now()) + interval '1 day';
    `)
  });

  // WAU tile
  cards.wau = await createCard(session, {
    name: "WAU (last 7d)",
    display: "scalar",
    dataset_query: nt(`
      SELECT COUNT(DISTINCT COALESCE(NULLIF(user_id,''), NULLIF(anon_id,''))) AS wau
      FROM analytics_events
      WHERE ts >= now() - interval '7 days'
        AND ts <  now();
    `)
  });

  // MAU tile
  cards.mau = await createCard(session, {
    name: "MAU (last 30d)",
    display: "scalar",
    dataset_query: nt(`
      SELECT COUNT(DISTINCT COALESCE(NULLIF(user_id,''), NULLIF(anon_id,''))) AS mau
      FROM analytics_events
      WHERE ts >= now() - interval '30 days'
        AND ts <  now();
    `)
  });

  // DAU timeseries (uses view)
  cards.dau_ts = await createCard(session, {
    name: "Daily Active Users (DAU)",
    display: "line",
    dataset_query: nt(`
      SELECT
        date_trunc('day', ts_utc) AS day,
        COUNT(DISTINCT uid) AS dau
      FROM vw_events_enriched
      WHERE ts_utc >= {{start_date}}::timestamptz
        AND ts_utc <  {{end_date}}::timestamptz
      GROUP BY 1
      ORDER BY 1;
    `, tagDateRange)
  });

  // Top events
  cards.top_events = await createCard(session, {
    name: "Top Events (last 20)",
    display: "bar",
    dataset_query: nt(`
      SELECT event_name, COUNT(*) AS events
      FROM vw_events_enriched
      WHERE ts_utc >= {{start_date}}::timestamptz
        AND ts_utc <  {{end_date}}::timestamptz
      GROUP BY 1
      ORDER BY events DESC
      LIMIT 20;
    `, tagDateRange)
  });

  // Inference p50/p95
  cards.latency = await createCard(session, {
    name: "Inference Latency p50/p95 (ms)",
    display: "line",
    dataset_query: nt(`
      WITH vals AS (
        SELECT date_trunc('day', ts_utc) AS day,
               (props->>'infer_ms')::numeric AS v
        FROM vw_events_enriched
        WHERE event_name='classify_done'
          AND ts_utc >= {{start_date}}::timestamptz
          AND ts_utc <  {{end_date}}::timestamptz
          AND jsonb_typeof(props->'infer_ms')='number'
      )
      SELECT
        day,
        percentile_disc(0.50) WITHIN GROUP (ORDER BY v) AS p50_ms,
        percentile_disc(0.95) WITHIN GROUP (ORDER BY v) AS p95_ms
      FROM vals
      GROUP BY day
      ORDER BY day;
    `, tagDateRange)
  });

  // Scan -> Action conversion
  cards.scan_action = await createCard(session, {
    name: "Scan → Action Conversion % (daily)",
    display: "line",
    dataset_query: nt(`
      WITH scans AS (
        SELECT uid, ts_utc::timestamptz AS ts_day, date_trunc('day', ts_utc) AS day
        FROM vw_events_enriched
        WHERE event_name='classify_done'
          AND ts_utc >= {{start_date}}::timestamptz
          AND ts_utc <  {{end_date}}::timestamptz
      ),
      acts AS (
        SELECT s.day, s.uid
        FROM scans s
        JOIN vw_events_enriched e
          ON e.uid=s.uid
         AND e.ts_utc >= s.ts_day
         AND e.ts_utc <= s.ts_day + interval '1 day'
         AND e.event_name IN ('set_reminder','shop_ticket_created')
        GROUP BY s.day, s.uid
      ),
      agg AS (
        SELECT day, COUNT(*) AS scans,
               (SELECT COUNT(*) FROM acts a WHERE a.day=sc.day) AS actions
        FROM scans sc GROUP BY day
      )
      SELECT day,
             CASE WHEN scans=0 THEN 0
                  ELSE ROUND(100.0*actions::numeric/scans, 1)
             END AS conv_pct
      FROM agg ORDER BY day;
    `, tagDateRange)
  });

  // Activation rate
  cards.activation = await createCard(session, {
    name: "Activation Rate (7-day)",
    display: "scalar",
    dataset_query: nt(`
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
          ON e.uid=c.uid
         AND e.ts_utc <= c.first_ts_utc + interval '7 days'
         AND e.event_name IN ('set_reminder','shop_ticket_created','price_alert_created')
      )
      SELECT
        COUNT(*) AS new_users,
        (SELECT COUNT(*) FROM activated) AS activated_users,
        CASE WHEN COUNT(*)=0 THEN 0
             ELSE ROUND(100.0*(SELECT COUNT(*) FROM activated)::numeric/COUNT(*),1)
        END AS activation_rate_pct
      FROM cohort;
    `, tagDateRange)
  });

  // Retention cohort
  cards.retention = await createCard(session, {
    name: "Weekly Retention (wk0–wk8)",
    display: "table",
    dataset_query: nt(`
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
        FROM cohort c JOIN activity a USING (uid)
        WHERE a.active_week >= c.cohort_week
          AND a.active_week <  c.cohort_week + interval '9 weeks'
      ),
      matrix AS (
        SELECT cohort_week,
               EXTRACT(WEEK FROM (active_week - cohort_week))::int AS wk,
               COUNT(DISTINCT uid) AS active_users
        FROM joined GROUP BY 1,2
      ),
      base AS (
        SELECT cohort_week, COUNT(DISTINCT uid) AS cohort_size
        FROM cohort GROUP BY 1
      )
      SELECT
        m0.cohort_week::date,
        b.cohort_size,
        ROUND(100.0 * COALESCE(m0.active_users,0)::numeric / b.cohort_size, 1) AS wk0,
        ROUND(100.0 * COALESCE(m1.active_users,0)::numeric / b.cohort_size, 1) AS wk1,
        ROUND(100.0 * COALESCE(m2.active_users,0)::numeric / b.cohort_size, 1) AS wk2,
        ROUND(100.0 * COALESCE(m3.active_users,0)::numeric / b.cohort_size, 1) AS wk3,
        ROUND(100.0 * COALESCE(m4.active_users,0)::numeric / b.cohort_size, 1) AS wk4,
        ROUND(100.0 * COALESCE(m5.active_users,0)::numeric / b.cohort_size, 1) AS wk5,
        ROUND(100.0 * COALESCE(m6.active_users,0)::numeric / b.cohort_size, 1) AS wk6,
        ROUND(100.0 * COALESCE(m7.active_users,0)::numeric / b.cohort_size, 1) AS wk7,
        ROUND(100.0 * COALESCE(m8.active_users,0)::numeric / b.cohort_size, 1) AS wk8
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
      ORDER BY 1;
    `, tagDateRange)
  });

  // DAU by platform
  cards.dau_platform = await createCard(session, {
    name: "DAU by Platform",
    display: "area",
    dataset_query: nt(`
      SELECT date_trunc('day', ts_utc) AS day, platform, COUNT(DISTINCT uid) AS dau
      FROM vw_events_enriched
      WHERE ts_utc >= {{start_date}}::timestamptz
        AND ts_utc <  {{end_date}}::timestamptz
      GROUP BY 1,2 ORDER BY 1,2;
    `, tagDateRange),
    visualization_settings: { "stackable.stack_mode": "stack" }
  });

  // Area top 10
  cards.area_top = await createCard(session, {
    name: "Active Users by Area (Top 10)",
    display: "bar",
    dataset_query: nt(`
      SELECT area_code, COUNT(DISTINCT uid) AS users
      FROM vw_events_enriched
      WHERE ts_utc >= {{start_date}}::timestamptz
        AND ts_utc <  {{end_date}}::timestamptz
      GROUP BY 1 ORDER BY users DESC LIMIT 10;
    `, tagDateRange)
  });

  // Shop Tickets
  cards.tickets = await createCard(session, {
    name: "Shop Tickets Created (daily)",
    display: "line",
    dataset_query: nt(`
      SELECT date_trunc('day', ts_utc) AS day, COUNT(*) AS tickets
      FROM vw_events_enriched
      WHERE event_name='shop_ticket_created'
        AND ts_utc >= {{start_date}}::timestamptz
        AND ts_utc <  {{end_date}}::timestamptz
      GROUP BY 1 ORDER BY 1;
    `, tagDateRange)
  });

  // Uncertain rate
  cards.uncertain = await createCard(session, {
    name: "Uncertain Rate (daily)",
    display: "line",
    dataset_query: nt(`
      SELECT date_trunc('day', ts_utc) AS day,
             ROUND(100.0 * AVG( (props->>'uncertain')::boolean::int ), 1) AS uncertain_pct
      FROM vw_events_enriched
      WHERE event_name='classify_done'
        AND ts_utc >= {{start_date}}::timestamptz
        AND ts_utc <  {{end_date}}::timestamptz
      GROUP BY 1 ORDER BY 1;
    `, tagDateRange)
  });

  // --------- Dashboard ----------
  const dash = await createDashboard(session, {
    name: "RaiAI • Product KPIs",
    description: "Core product & ML KPIs for Thailand MVP"
  });

  // Add dashboard-level parameters (date range)
  // Metabase auto-creates parameters when first mapping; no explicit call needed.

  // Layout (12-column grid). (x,y,w,h)
  const add = (card, x,y,w,h) => addDashCard(session, dash.id, card.id, x,y,w,h, mapRangeParams(card));

  await add(cards.dau,          0, 0, 4, 4);
  await add(cards.wau,          4, 0, 4, 4);
  await add(cards.mau,          8, 0, 4, 4);

  await add(cards.dau_ts,       0, 4, 12, 8);
  await add(cards.latency,     12, 4, 12, 8);

  await add(cards.top_events,   0,12,12,8);
  await add(cards.scan_action, 12,12,12,8);

  await add(cards.activation,   0,20,6, 4);
  await add(cards.tickets,      6,20,18,8);

  await add(cards.dau_platform, 0,28,12,8);
  await add(cards.area_top,    12,28,12,8);

  await add(cards.uncertain,    0,36,24,8);
  await add(cards.retention,    0,44,24,12);

  console.log("✅ Created dashboard:", `${MB_URL}/dashboard/${dash.id}-raiai-product-kpis`);
}

main().catch(e => { console.error(e); process.exit(1); });
