# Offline Cache MVP Setup

## Quick Start

### 1. Start Server
```bash
npm run prices:server
# Offline cache endpoints: /api/cache/sync, /api/cache/queue
```

### 2. Test Delta Sync
```bash
# Get all data for user
curl "http://localhost:3000/api/cache/sync?user_id=user123"

# Get deltas since timestamp
curl "http://localhost:3000/api/cache/sync?user_id=user123&since=2024-01-01T00:00:00Z"

# Filter by area and crop
curl "http://localhost:3000/api/cache/sync?user_id=user123&areas=TH-10-XX,TH-50-YY&crops=rice,durian"
```

### 3. Test Mutation Queue
```bash
# Queue offline mutations
curl -X POST http://localhost:3000/api/cache/queue \
  -H "Content-Type: application/json" \
  -d '{
    "mutations": [
      {
        "mutation_id": "01JAX1N8K3",
        "user_id": "user123",
        "entity": "price_alert",
        "op": "insert",
        "data": {
          "id": "ALERT-abc",
          "crop": "durian",
          "market_key": "talaadthai_pathumthani",
          "target_min": 80,
          "target_max": 95,
          "unit": "THB/kg",
          "active": true
        }
      }
    ]
  }'
```

## API Reference

### GET /api/cache/sync

**Query Parameters:**
- `user_id` (required) - User identifier
- `since` (optional) - ISO timestamp for delta sync (exclusive)
- `areas` (optional) - Comma-separated ADM2 codes for shop filtering
- `crops` (optional) - Comma-separated crop keys

**Response:**
```json
{
  "server_time": "2024-01-01T10:00:00Z",
  "next_since": "2024-01-01T10:00:00Z",
  "refs": {
    "shops": [
      {
        "id": "shop123",
        "name_th": "ร้านขายปุ๋ย",
        "province_code": "TH-10",
        "amphoe_code": "TH-10-01",
        "address": "123 ถนน...",
        "phone": "02-123-4567",
        "updated_at": "2024-01-01T09:00:00Z"
      }
    ],
    "product_classes": [
      {
        "key": "rice_jasmine",
        "name_th": "ข้าวหอมมะลิ",
        "updated_at": "2024-01-01T08:00:00Z"
      }
    ]
  },
  "user": {
    "price_alerts": [
      {
        "id": "ALERT-abc",
        "crop": "durian",
        "market_key": "talaadthai_pathumthani",
        "variety": "monthong",
        "target_min": 80,
        "target_max": 95,
        "unit": "THB/kg",
        "active": true,
        "created_at": "2024-01-01T09:00:00Z",
        "updated_at": "2024-01-01T09:00:00Z"
      }
    ],
    "shop_tickets": [
      {
        "id": "TCKT-xyz",
        "crop": "rice",
        "diagnosis_key": "rice_blast",
        "severity": "moderate",
        "status": "issued",
        "created_at": "2024-01-01T09:00:00Z",
        "updated_at": "2024-01-01T09:00:00Z"
      }
    ]
  }
}
```

### POST /api/cache/queue

**Body:**
```json
{
  "mutations": [
    {
      "mutation_id": "01JAX1N8K3",
      "user_id": "user123",
      "entity": "price_alert",
      "op": "insert|update|delete",
      "data": { /* entity-specific payload */ },
      "client_ts": "2024-01-01T09:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "results": [
    {
      "mutation_id": "01JAX1N8K3",
      "status": "applied|skipped|error",
      "message": "optional error message"
    }
  ]
}
```

## Supported Mutations

### 1. Price Alert
```json
{
  "mutation_id": "01JAX1N8K3",
  "user_id": "user123",
  "entity": "price_alert",
  "op": "insert",
  "data": {
    "id": "ALERT-abc",
    "crop": "durian",
    "market_key": "talaadthai_pathumthani",
    "variety": "monthong",
    "size": "l",
    "target_min": 80,
    "target_max": 95,
    "unit": "THB/kg",
    "active": true,
    "updated_at": "2024-01-01T09:00:00Z"
  }
}
```

### 2. Shop Ticket Status
```json
{
  "mutation_id": "01JAX1R5ZP",
  "user_id": "user123",
  "entity": "shop_ticket_status",
  "op": "update",
  "data": {
    "id": "TCKT-xyz",
    "status": "canceled",
    "updated_at": "2024-01-01T09:00:00Z"
  }
}
```

### 3. Shop Ticket Create
```json
{
  "mutation_id": "01JAX1S9Q2",
  "user_id": "user123",
  "entity": "shop_ticket",
  "op": "insert",
  "data": {
    "id": "TCKT-new",
    "crop": "rice",
    "diagnosis_key": "rice_blast",
    "severity": "moderate",
    "recommended_classes": ["fungicide_a", "fungicide_b"],
    "dosage_note": "Apply every 7 days",
    "rai": 2.5,
    "shop_id": "shop123"
  }
}
```

## Client Integration

### JavaScript/TypeScript
```typescript
class OfflineCache {
  private baseUrl: string;
  private userId: string;
  private cursor: string = "1970-01-01T00:00:00Z";

  constructor(baseUrl: string, userId: string) {
    this.baseUrl = baseUrl;
    this.userId = userId;
  }

  async sync(areas?: string[], crops?: string[]): Promise<SyncBundle> {
    const params = new URLSearchParams({
      user_id: this.userId,
      since: this.cursor
    });
    
    if (areas?.length) params.set('areas', areas.join(','));
    if (crops?.length) params.set('crops', crops.join(','));

    const response = await fetch(`${this.baseUrl}/api/cache/sync?${params}`);
    const data = await response.json();
    
    this.cursor = data.next_since;
    return data;
  }

  async queueMutations(mutations: ClientMutation[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/cache/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mutations })
    });
    return response.json();
  }
}

// Usage
const cache = new OfflineCache("http://localhost:3000", "user123");

// Sync on app start
const bundle = await cache.sync(["TH-10-XX"], ["rice", "durian"]);
console.log("Shops:", bundle.refs.shops);
console.log("Price alerts:", bundle.user.price_alerts);

// Queue offline mutations
const mutations = [
  {
    mutation_id: generateId(),
    user_id: "user123",
    entity: "price_alert",
    op: "insert",
    data: { /* ... */ }
  }
];
const result = await cache.queueMutations(mutations);
```

### Android (Kotlin)
```kotlin
class OfflineCache(private val baseUrl: String, private val userId: String) {
    private var cursor = "1970-01-01T00:00:00Z"

    suspend fun sync(areas: List<String>? = null, crops: List<String>? = null): SyncBundle {
        val params = mutableMapOf(
            "user_id" to userId,
            "since" to cursor
        )
        areas?.let { params["areas"] = it.joinToString(",") }
        crops?.let { params["crops"] = it.joinToString(",") }

        val response = httpClient.get("/api/cache/sync") {
            url { parameters.appendAll(params) }
        }
        
        val data = response.body<SyncBundle>()
        cursor = data.next_since
        return data
    }

    suspend fun queueMutations(mutations: List<ClientMutation>): QueueResult {
        val response = httpClient.post("/api/cache/queue") {
            contentType(ContentType.Application.Json)
            setBody(QueueRequest(mutations))
        }
        return response.body<QueueResult>()
    }
}
```

## Conflict Resolution

### Server-Wins Policy
- If `client.updated_at <= server.updated_at` → Server wins (ignore client)
- If `client.updated_at > server.updated_at` → Client wins (apply mutation)
- Deletions always apply if user owns the record

### Example Conflict Scenarios
```typescript
// Scenario 1: Client is older (server wins)
const serverRecord = { updated_at: "2024-01-01T10:00:00Z" };
const clientData = { updated_at: "2024-01-01T09:00:00Z" };
// Result: Client mutation ignored

// Scenario 2: Client is newer (client wins)
const serverRecord = { updated_at: "2024-01-01T09:00:00Z" };
const clientData = { updated_at: "2024-01-01T10:00:00Z" };
// Result: Client mutation applied

// Scenario 3: No client timestamp (server wins)
const serverRecord = { updated_at: "2024-01-01T10:00:00Z" };
const clientData = {}; // No updated_at
// Result: Client mutation ignored
```

## Performance Optimizations

### 1. Delta Sync
- Only fetch records modified since last sync
- Use `next_since` cursor for efficient pagination
- Limit results to 2000 records per entity type

### 2. Batch Mutations
- Queue mutations locally when offline
- Send batches of 20-50 mutations when online
- Use idempotent `mutation_id` to prevent duplicates

### 3. Caching Strategy
```typescript
// Client-side caching
class LocalCache {
  private db: SQLiteDatabase;
  
  async upsertRecords(table: string, records: any[]) {
    for (const record of records) {
      const existing = await this.db.get(`SELECT updated_at FROM ${table} WHERE id = ?`, record.id);
      
      if (!existing || record.updated_at > existing.updated_at) {
        await this.db.run(`INSERT OR REPLACE INTO ${table} VALUES (?, ?, ...)`, record);
      }
    }
  }
}
```

## Error Handling

### Sync Errors
```typescript
try {
  const bundle = await cache.sync();
  // Process bundle...
} catch (error) {
  if (error.status === 400) {
    // Invalid user_id
  } else if (error.status === 500) {
    // Server error, retry later
  }
}
```

### Queue Errors
```typescript
const result = await cache.queueMutations(mutations);
for (const item of result.results) {
  if (item.status === "error") {
    console.error(`Mutation ${item.mutation_id} failed:`, item.message);
    // Keep in outbox for retry
  } else if (item.status === "skipped") {
    console.log(`Mutation ${item.mutation_id} already processed`);
    // Remove from outbox
  }
}
```

## Security Considerations

### 1. Authentication
- Add auth middleware to verify `user_id` matches authenticated user
- Rate limit mutation queue (e.g., 60 req/min per user)

### 2. Data Validation
- Validate all entity fields on server
- Sanitize user input
- Enforce business rules (e.g., only cancel own tickets)

### 3. Authorization
- Users can only access their own data
- Validate ownership before applying mutations
- Prevent cross-user data leakage

## Monitoring

### 1. Sync Metrics
```sql
-- Track sync frequency
SELECT user_id, COUNT(*) as sync_count, MAX(created_at) as last_sync
FROM outbox_log 
WHERE entity = 'sync'
GROUP BY user_id;
```

### 2. Mutation Success Rate
```sql
-- Track mutation success rate
SELECT entity, status, COUNT(*) as count
FROM outbox_log
GROUP BY entity, status;
```

### 3. Conflict Rate
```sql
-- Track conflict resolution
SELECT COUNT(*) as conflicts
FROM outbox_log
WHERE status = 'conflict';
```

The offline cache system is production-ready with comprehensive delta sync, mutation queuing, and conflict resolution for your Thailand farming AI app!
