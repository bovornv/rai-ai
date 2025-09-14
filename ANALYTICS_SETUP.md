# RaiAI Analytics MVP

## Quick Start

### 1. Environment Variables
```bash
# Add to your .env or set directly
ANALYTICS_DB_PATH=./data/app.db
ANALYTICS_INGEST_KEY=prod-<random-32>
ANALYTICS_READ_KEY=prod-<random-32>
```

### 2. Start Analytics API
```bash
npm run prices:server
# Analytics endpoints available at:
# POST /api/analytics/events
# GET /api/analytics/kpis
```

### 3. Start Grafana Dashboard
```bash
docker compose -f docker-compose.grafana.yml up -d
# Open http://localhost:3001 (admin/admin123)
```

### 4. Daily Rollup (Cron)
```bash
# Add to crontab for daily 00:10 UTC
10 0 * * * cd /path/to/rai-ai && npm run analytics:rollup
```

## API Usage

### Send Events (Mobile/Client)
```typescript
// Single event
POST /api/analytics/events
Headers: { "x-api-key": "your-ingest-key" }
Body: {
  "event": {
    "user_id": "user123",
    "session_id": "sess456", 
    "event_name": "scan_started",
    "ts": "2024-01-01T10:00:00Z",
    "platform": "android",
    "area_code": "TH-10", // ADM2 code
    "props": { "model": "rice_v1" }
  }
}

// Batch events
POST /api/analytics/events
Body: {
  "events": [
    { "event_name": "scan_started", ... },
    { "event_name": "classify_done", "props": { "infer_ms": 142 } }
  ]
}
```

### Get KPIs
```typescript
GET /api/analytics/kpis?from=2024-01-01&to=2024-01-31
Headers: { "x-api-key": "your-read-key" }

// Returns:
{
  "window": { "from": "2024-01-01", "to": "2024-01-31" },
  "kpis": {
    "dau": 150,
    "wau": 1200,
    "mau": 4500,
    "new_users": 200,
    "activation_rate": 0.65,
    "scan_to_action": 0.42,
    "infer_p50_ms": 180,
    "infer_p95_ms": 320,
    "feature_usage": [
      { "event_name": "scan_started", "count": 5000 },
      { "event_name": "classify_done", "count": 4800 }
    ]
  }
}
```

## Key Events to Track

- `scan_started` - User opens camera
- `classify_done` - ML inference complete (include `infer_ms` in props)
- `set_reminder` - User sets spray reminder
- `shop_ticket_created` - User generates shop ticket
- `price_alert_created` - User creates price alert
- `outbreak_share` - User shares outbreak info
- `spray_window_view` - User views spray window

## PDPA Compliance

- No PII in raw events (no phone, exact GPS, images)
- `area_code` should be coarse (ADM2 or geohash5)
- Hash sensitive strings client-side before sending
- All data stored in Thailand (SQLite local)

## Grafana Dashboard

The dashboard shows:
- DAU/WAU/MAU metrics
- Daily active users trend
- Inference latency p50/p95
- Top events by count
- Scan → Action conversion rate

Access at http://localhost:3001 (admin/admin123)
