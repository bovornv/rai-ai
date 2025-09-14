# Crash Reporting MVP Setup

## Quick Start

### 1. Environment Variables
```bash
# Add to your .env or set directly
CRASH_DB_PATH=./data/app.db
CRASH_INGEST_KEY=prod-<random-32>
```

### 2. Start Server with Crash Reporting
```bash
npm run prices:server
# Crash reporting endpoint: POST /api/crash-reports
```

### 3. Test Crash Reporting
```bash
# Single crash report
curl -X POST http://localhost:3000/api/crash-reports \
  -H "x-api-key: dev-crash" \
  -H "Content-Type: application/json" \
  -d '{
    "report": {
      "platform": "android",
      "app_version": "1.0.3 (103)",
      "os_version": "Android 13",
      "model": "RMX2020",
      "is_fatal": true,
      "thread": "main",
      "exception_type": "NullPointerException",
      "exception_message": "Attempt to invoke virtual method",
      "stacktrace": "java.lang.NullPointerException: Attempt to invoke virtual method\n  at com.rai.MainActivity.onCreate(MainActivity.java:42)",
      "occurred_at": "2024-01-01T10:00:00Z",
      "network": "wifi",
      "locale": "th-TH",
      "area_code": "TH-10"
    }
  }'

# Batch crash reports
curl -X POST http://localhost:3000/api/crash-reports \
  -H "x-api-key: dev-crash" \
  -H "Content-Type: application/json" \
  -d '{
    "reports": [
      {
        "platform": "android",
        "app_version": "1.0.3 (103)",
        "is_fatal": true,
        "stacktrace": "java.lang.NullPointerException...",
        "occurred_at": "2024-01-01T10:00:00Z"
      }
    ]
  }'
```

### 4. Daily Crash Digest
```bash
# Run daily digest (add to crontab)
npm run crash:digest
```

## API Reference

### POST /api/crash-reports

**Headers:**
- `x-api-key: your-crash-ingest-key`
- `Content-Type: application/json`

**Body (Single Report):**
```json
{
  "report": {
    "platform": "android" | "ios",
    "app_version": "1.0.3 (103)",
    "is_fatal": true,
    "stacktrace": "java.lang.NullPointerException...",
    "occurred_at": "2024-01-01T10:00:00Z",
    "device_id": "hashed-device-id",
    "user_id": "hashed-user-id",
    "os_version": "Android 13",
    "model": "RMX2020",
    "thread": "main",
    "exception_type": "NullPointerException",
    "exception_message": "Attempt to invoke virtual method",
    "breadcrumbs": [
      {
        "ts": "2024-01-01T09:59:00Z",
        "type": "log",
        "message": "User started scan",
        "meta": {"screen": "camera"}
      }
    ],
    "battery": 85,
    "memory_free_mb": 512,
    "network": "wifi",
    "locale": "th-TH",
    "area_code": "TH-10",
    "extra": {"brand": "Realme"}
  }
}
```

**Body (Batch Reports):**
```json
{
  "reports": [
    { /* crash report 1 */ },
    { /* crash report 2 */ }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "count": 1,
  "items": [
    {
      "id": 123,
      "stack_hash": "a1b2c3d4e5f6..."
    }
  ]
}
```

## Android Client Integration

### 1. Global Exception Handler
```kotlin
// App.kt
class App: Application() {
  override fun onCreate() {
    super.onCreate()
    Thread.setDefaultUncaughtExceptionHandler { t, e ->
      CrashReporter.submit(this, e, threadName = t?.name ?: "unknown")
      // Let the system crash after submission (don't swallow)
      Thread.getDefaultUncaughtExceptionHandler()?.uncaughtException(t, e)
    }
  }
}
```

### 2. Crash Reporter
```kotlin
object CrashReporter {
  fun submit(ctx: Context, ex: Throwable, threadName: String) {
    val payload = mapOf(
      "report" to mapOf(
        "platform" to "android",
        "app_version" to BuildConfig.VERSION_NAME + " (" + BuildConfig.VERSION_CODE + ")",
        "os_version" to "Android " + Build.VERSION.RELEASE,
        "model" to Build.MANUFACTURER + " " + Build.MODEL,
        "is_fatal" to true,
        "thread" to threadName,
        "exception_type" to ex::class.java.simpleName,
        "exception_message" to (ex.message ?: ""),
        "stacktrace" to Log.getStackTraceString(ex),
        "occurred_at" to Instant.now().toString(),
        "network" to getNetworkType(ctx),
        "locale" to Locale.getDefault().toLanguageTag(),
        "area_code" to getAreaCode(), // ADM2/geohash5 (no precise GPS)
        "extra" to mapOf("brand" to Build.BRAND)
      )
    )
    // TODO: enqueue to WorkManager; POST to /api/crash-reports with x-api-key
  }
}
```

### 3. Breadcrumbs (Optional)
```kotlin
object BreadcrumbLogger {
  private val breadcrumbs = mutableListOf<Map<String, Any>>()
  private val maxBreadcrumbs = 30

  fun log(type: String, message: String, meta: Map<String, Any> = emptyMap()) {
    breadcrumbs.add(mapOf(
      "ts" to Instant.now().toString(),
      "type" to type,
      "message" to message,
      "meta" to meta
    ))
    if (breadcrumbs.size > maxBreadcrumbs) {
      breadcrumbs.removeAt(0)
    }
  }
}
```

## PDPA Compliance

### Data Sanitization
- **No PII**: Strips phone, email, GPS, images, tokens
- **Hashed IDs**: Device/user IDs should be hashed client-side
- **Coarse Location**: Only ADM2 codes or geohash5 (no precise GPS)
- **Size Limits**: Stacktrace max 64KB, breadcrumbs max 50 items

### Required Fields
- `platform`: "android" | "ios"
- `app_version`: Version string
- `is_fatal`: boolean
- `stacktrace`: Exception stack trace
- `occurred_at`: ISO timestamp

### Optional Fields
- `device_id`: Hashed device identifier
- `user_id`: Hashed user identifier (if logged in)
- `breadcrumbs`: Array of recent events
- `battery`: 0-100
- `memory_free_mb`: Available memory
- `network`: "wifi" | "cell" | "offline"
- `locale`: "th-TH"
- `area_code`: ADM2 or geohash5
- `extra`: Additional metadata (sanitized)

## Rate Limiting

- **20 requests per minute** per IP address
- **512KB max payload** size
- **API key required** for all requests

## Monitoring Queries

### Grafana/Metabase Queries

**Crashes by version (last 7d):**
```sql
SELECT app_version, COUNT(*) AS crashes
FROM crash_reports
WHERE occurred_at >= datetime('now','-7 day')
GROUP BY app_version ORDER BY crashes DESC;
```

**Top crash signatures:**
```sql
SELECT stack_hash, exception_type, COUNT(*) n
FROM crash_reports
WHERE occurred_at >= date('now') AND occurred_at < date('now','+1 day')
GROUP BY stack_hash, exception_type
ORDER BY n DESC LIMIT 20;
```

**Crash rate by platform:**
```sql
SELECT platform, 
       COUNT(*) as crashes,
       COUNT(DISTINCT device_id) as affected_devices
FROM crash_reports
WHERE occurred_at >= datetime('now','-7 day')
GROUP BY platform;
```

## Daily Digest

The digest script shows:
- Top crash signatures by app version
- Exception types and frequencies
- Stack hashes for grouping similar crashes

Run daily via cron:
```bash
# Add to crontab for daily 08:00
0 8 * * * cd /path/to/rai-ai && npm run crash:digest
```

## Troubleshooting

### Common Issues
- **401 Unauthorized**: Check `CRASH_INGEST_KEY` environment variable
- **413 Payload too large**: Reduce stacktrace size or breadcrumb count
- **Rate limited**: Wait 1 minute or implement client-side batching
- **Missing required fields**: Ensure platform, app_version, stacktrace, occurred_at are present

### Debug Mode
Set `CRASH_INGEST_KEY=dev-crash` for development (no authentication required).
