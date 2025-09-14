# Feature Flags MVP Setup

## Quick Start

### 1. Seed Feature Flags
```bash
npm run flags:seed
```

### 2. Start Server
```bash
npm run prices:server
# Feature flags endpoint: GET /api/feature-flags
```

### 3. Test Feature Flags
```bash
# Basic request
curl http://localhost:3000/api/feature-flags

# With context headers
curl -H "x-user-id: user123" \
     -H "x-app-version: 1.2.0" \
     -H "x-platform: android" \
     -H "x-country: TH" \
     -H "x-crop: rice" \
     http://localhost:3000/api/feature-flags
```

## API Reference

### GET /api/feature-flags

**Headers (Optional):**
- `x-user-id` or `x-anon-id` - User identifier for targeting
- `x-app-version` - App version (e.g., "1.2.0")
- `x-platform` - Platform ("android", "ios", "web")
- `x-country` - Country code (defaults to "TH")
- `x-area` - Area code (ADM2 or geohash5)
- `x-crop` - Crop type ("rice", "durian")

**Query Parameters (Alternative to headers):**
- `user_id`, `anon_id`, `app_version`, `platform`, `country`, `area_code`, `crop`

**Response:**
```json
{
  "flags": {
    "spray_window": { "enabled": true },
    "outbreak_radar": { "enabled": false },
    "price_alerts": { "enabled": true, "free_quota": 1 },
    "shop_ticket": { "enabled": true, "ttl_hours": 72 },
    "ml_thresholds": { "rice": 0.75, "durian": 0.75 },
    "ml_backend": { "rice": "int8", "durian": "int8" }
  }
}
```

**Caching:**
- `ETag` header for client-side caching
- `Cache-Control: public, max-age=300` (5 minutes)
- Returns `304 Not Modified` if flags unchanged

## Default Flags

### 1. spray_window
- **Description**: Show Spray Window badge in Today tab
- **Default**: `{ "enabled": true }`
- **Rules**: Enabled for all mobile platforms

### 2. outbreak_radar
- **Description**: Hyperlocal outbreak radar card
- **Default**: `{ "enabled": false }`
- **Rules**: 50% rollout for Thailand users on app version 1.1.0+

### 3. price_alerts
- **Description**: Enable price alerts feature
- **Default**: `{ "enabled": true, "free_quota": 1 }`
- **Rules**: No targeting (always enabled)

### 4. shop_ticket
- **Description**: Shop Ticket flow
- **Default**: `{ "enabled": true, "ttl_hours": 72 }`
- **Rules**: No targeting (always enabled)

### 5. ml_thresholds
- **Description**: Per-crop ML confidence thresholds
- **Default**: `{ "rice": 0.75, "durian": 0.75 }`
- **Rules**: Higher threshold (0.78) for iOS users

### 6. ml_backend
- **Description**: ML model backend selection
- **Default**: `{ "rice": "int8", "durian": "int8" }`
- **Rules**: 50% rollout of FP16 backend for Android 1.2.0+

## Client Integration

### JavaScript/TypeScript
```typescript
async function fetchFlags(baseUrl: string, ctx: Record<string,string>) {
  const res = await fetch(`${baseUrl}/api/feature-flags`, { 
    headers: ctx as any 
  });
  if (res.status === 304) return null; // unchanged
  const json = await res.json();
  return json.flags as Record<string, any>;
}

// Usage
const flags = await fetchFlags("http://localhost:3000", {
  "x-user-id": "user123",
  "x-app-version": "1.2.0",
  "x-platform": "android",
  "x-crop": "rice"
});

if (flags?.spray_window?.enabled) {
  // Show spray window feature
}

const threshold = flags?.ml_thresholds?.rice || 0.75;
```

### Android (Kotlin)
```kotlin
// Fetch flags on app startup
suspend fun fetchFlags(): Map<String, Any> {
  val headers = mapOf(
    "x-user-id" to userId,
    "x-app-version" to BuildConfig.VERSION_NAME,
    "x-platform" to "android",
    "x-crop" to currentCrop
  )
  
  val response = httpClient.get("/api/feature-flags") {
    headers { headers.forEach { (k, v) -> append(k, v) } }
  }
  
  return response.body<Map<String, Any>>()["flags"] as Map<String, Any>
}

// Usage
val flags = fetchFlags()
val showSprayWindow = flags["spray_window"]?.let { 
  (it as Map<String, Any>)["enabled"] as Boolean 
} ?: false
```

## Rule Configuration

### Targeting Rules
```json
{
  "match": {
    "platform_in": ["android", "ios"],
    "country_in": ["TH", "MY"],
    "area_prefix": "TH-40",  // Khon Kaen province
    "crop_in": ["rice"],
    "app_version_gte": "1.1.0"
  },
  "rollout": 50,  // 50% of matching users
  "variant": { "enabled": true }
}
```

### Rollout Percentages
- `0-100` - Percentage of users who get the variant
- Uses stable bucketing based on user ID
- Same user always gets same result for same rule

## QA Overrides

### Set User Override
```sql
INSERT OR REPLACE INTO feature_flag_overrides 
(key, user_id, value_json, updated_at) 
VALUES ('spray_window', 'user123', '{"enabled": false}', '2024-01-01T10:00:00Z');
```

### Admin Script
```bash
# Create scripts/flag-override.ts
tsx scripts/flag-override.ts spray_window user123 '{"enabled": false}'
```

## Kill Switch

### Disable Flag Globally
```sql
UPDATE feature_flags SET enabled = 0 WHERE key = 'spray_window';
```

### Emergency Disable
```bash
# Quick disable via SQLite CLI
sqlite3 data/app.db "UPDATE feature_flags SET enabled = 0 WHERE key = 'spray_window';"
```

## Advanced Usage

### A/B Testing
```json
{
  "key": "ml_ui_v2",
  "value_json": "{\"version\": \"v1\"}",
  "rules_json": "[
    {\"match\": {\"platform_in\": [\"android\"]}, \"rollout\": 50, \"variant\": {\"version\": \"v2\"}}
  ]"
}
```

### Gradual Rollout
```json
{
  "rules_json": "[
    {\"match\": {\"app_version_gte\": \"1.0.0\"}, \"rollout\": 10, \"variant\": {\"enabled\": true}},
    {\"match\": {\"app_version_gte\": \"1.1.0\"}, \"rollout\": 25, \"variant\": {\"enabled\": true}},
    {\"match\": {\"app_version_gte\": \"1.2.0\"}, \"rollout\": 50, \"variant\": {\"enabled\": true}}
  ]"
}
```

### Geographic Targeting
```json
{
  "rules_json": "[
    {\"match\": {\"area_prefix\": \"TH-10\"}, \"rollout\": 100, \"variant\": {\"enabled\": true}},
    {\"match\": {\"area_prefix\": \"TH-40\"}, \"rollout\": 50, \"variant\": {\"enabled\": true}}
  ]"
}
```

## Monitoring

### Flag Usage Analytics
Track flag evaluations in your analytics:
```typescript
// In your app
analytics.track('feature_flag_evaluated', {
  flag_name: 'spray_window',
  flag_value: flags.spray_window,
  user_id: userId,
  platform: 'android'
});
```

### Database Queries
```sql
-- Flag usage by platform
SELECT platform, COUNT(*) as evaluations
FROM analytics_events 
WHERE event_name = 'feature_flag_evaluated' 
  AND props->>'flag_name' = 'spray_window'
GROUP BY platform;

-- Override usage
SELECT key, COUNT(*) as overrides
FROM feature_flag_overrides
GROUP BY key;
```

## Best Practices

### 1. Naming Conventions
- Use snake_case for flag keys
- Be descriptive: `ml_thresholds` not `ml_thresh`
- Group related flags: `ml_*`, `ui_*`, `payment_*`

### 2. Default Values
- Always provide sensible defaults
- Use kill switch (enabled=0) for emergency disable
- Test with defaults before adding rules

### 3. Rollout Strategy
- Start with small percentages (10-25%)
- Monitor metrics before increasing
- Use app version gates for safety

### 4. Client Caching
- Respect ETag headers
- Cache flags locally (MMKV/SQLite)
- Refresh on app resume/foreground

### 5. Testing
- Use overrides for QA testing
- Test both enabled/disabled states
- Verify rule logic with different contexts

## Troubleshooting

### Common Issues
- **Flags not updating**: Check ETag caching, refresh client
- **Wrong targeting**: Verify context headers match rules
- **Override not working**: Check user_id matches exactly
- **Performance**: Use ETag to avoid unnecessary requests

### Debug Mode
```bash
# Check flag evaluation
curl -H "x-user-id: debug123" \
     -H "x-platform: android" \
     -H "x-app-version: 1.2.0" \
     http://localhost:3000/api/feature-flags
```

The feature flags system is production-ready with comprehensive targeting, rollout capabilities, and QA overrides for your Thailand farming AI app!
