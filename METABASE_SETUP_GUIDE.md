# Metabase Analytics Dashboard Setup

## Quick Start (3 Steps)

### 1. Set up Postgres + Metabase
```bash
# Start Metabase with Postgres
docker compose -f docker-compose.metabase.yml up -d

# Create analytics tables in Postgres
psql postgresql://rai:rai123@localhost:5433/analytics -f scripts/metabase-views.sql
```

### 2. Configure Environment
```bash
# Set your Metabase connection details
export MB_URL=http://localhost:3002
export MB_USER=admin@metabase.local
export MB_PASS=metabase
export MB_DB_ID=2  # Check /api/database in Metabase for your Postgres connection ID
```

### 3. Seed Dashboard
```bash
# Run the automated seeding script
npm run metabase:seed
```

You'll get: `✅ Created dashboard: http://localhost:3002/dashboard/17-raiai-product-kpis`

## Manual Setup (Alternative)

If you prefer to create the dashboard manually:

1. **Open Metabase** at http://localhost:3002
2. **Create Postgres connection** pointing to your analytics database
3. **Run the views SQL** from `scripts/metabase-views.sql`
4. **Copy SQL from** `METABASE_SQL_PACK.md` into individual Questions
5. **Build dashboard** with the suggested layout

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MB_URL` | Metabase base URL | `http://localhost:3002` |
| `MB_USER` | Metabase username | `admin@metabase.local` |
| `MB_PASS` | Metabase password | `metabase` |
| `MB_DB_ID` | Postgres connection ID | `2` |
| `MB_COLLECTION_ID` | Collection to create in | `null` (Root) |

## Dashboard Features

The seeded dashboard includes:

### Core Metrics
- **DAU/WAU/MAU** - Daily, Weekly, Monthly Active Users
- **Daily Active Users** - Time series trend
- **Activation Rate** - New users who perform key actions within 7 days

### Product Analytics
- **Top Events** - Most frequent user actions
- **Scan → Action Conversion** - ML scan to user action funnel
- **Shop Tickets Created** - Daily ticket generation
- **Uncertain Rate** - ML model confidence monitoring

### Technical Metrics
- **Inference Latency** - p50/p95 ML inference times
- **DAU by Platform** - Android/iOS/Web breakdown
- **Active Users by Area** - Geographic distribution

### Retention Analysis
- **Weekly Retention Cohort** - User retention by signup week

## Data Requirements

Ensure your `analytics_events` table has:

- `user_id` or `anon_id` (at least one required)
- `event_name` (string)
- `ts` (timestamptz)
- `platform` (android/ios/web)
- `area_code` (ADM2 or geohash5)
- `props` (jsonb with `infer_ms`, `uncertain` for classify_done events)

## Troubleshooting

### Connection Issues
- Verify Postgres is running: `docker ps`
- Check connection string in Metabase admin
- Ensure `MB_DB_ID` matches your Postgres connection ID

### Missing Data
- Verify views exist: `SELECT * FROM vw_events_enriched LIMIT 1;`
- Check data in raw table: `SELECT COUNT(*) FROM analytics_events;`
- Ensure date range filters are set in dashboard

### Performance Issues
- Add indexes from `scripts/metabase-views.sql`
- Consider materializing views for large datasets
- Use date range filters to limit query scope

## Customization

### Adding New Questions
1. Create Question in Metabase UI
2. Use `vw_events_enriched` view for consistent data
3. Add to dashboard with appropriate layout

### Modifying Layout
- Edit dashboard in Metabase UI
- Adjust card positions and sizes
- Add/remove cards as needed

### Advanced Queries
- Use the helper views for consistent user identification
- Leverage Postgres JSONB functions for props analysis
- Add custom date ranges and filters
