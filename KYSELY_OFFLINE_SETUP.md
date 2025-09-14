# Kysely + React Native Offline Setup

## Quick Start

### 1. Install Dependencies
```bash
# Server dependencies (already installed)
npm install kysely better-sqlite3

# Mobile dependencies (add to your React Native/Expo project)
npm install @tanstack/react-query react-native-mmkv ulid react-native-get-random-values
```

### 2. Start Server with Kysely
```bash
npm run prices:server
# Now using typed Kysely queries instead of raw SQL
```

### 3. Test Typed Endpoints
```bash
# Delta sync with type safety
curl "http://localhost:3000/api/cache/sync?user_id=user123&areas=TH-10-XX&crops=rice,durian"

# Mutation queue with typed validation
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
          "target_min": 80,
          "target_max": 95,
          "unit": "THB/kg",
          "active": true
        }
      }
    ]
  }'
```

## Server Architecture

### **Kysely Database Layer**
- **Type Safety** - Full TypeScript types for all tables
- **Query Builder** - Fluent SQL builder with autocomplete
- **Transaction Support** - Atomic batch operations
- **Conflict Resolution** - Server-wins with timestamp comparison

### **Key Files**
- `src/lib/db/kysely.ts` - Database types and connection
- `src/lib/offline/kysely-repo.ts` - Typed repository methods
- `src/lib/offline/kysely-service.ts` - Service layer with Kysely
- `src/api/offline-cache.ts` - Express router (updated to use Kysely)

### **Database Schema**
```typescript
interface DB {
  markets: Markets;
  price_quotes: PriceQuotes;
  shops: Shops;
  product_classes: ProductClasses;
  shop_tickets: ShopTickets;
  price_alerts: PriceAlerts;
  outbox_log: OutboxLog;
}
```

## Mobile Architecture

### **React Native Components**
- **MMKV Storage** - Fast key-value storage for outbox
- **React Query** - Caching and sync state management
- **Type Safety** - Shared types between server and client
- **Offline-First** - Queue mutations when offline

### **Key Files**
- `src/mobile/offline/outbox.ts` - MMKV outbox store
- `src/mobile/offline/cursor.ts` - Sync cursor management
- `src/mobile/offline/hooks.ts` - React Query hooks

## Usage Examples

### **Server-Side (Kysely)**
```typescript
import { makeDb } from "./lib/db/kysely";
import { OfflineRepo } from "./lib/offline/kysely-repo";

const db = makeDb();
const repo = new OfflineRepo(db);

// Get shops with area filtering
const shops = await repo.getShopsSince("2024-01-01T00:00:00Z", ["TH-10-XX"]);

// Upsert price alert with conflict resolution
const result = await repo.upsertPriceAlert("user123", {
  id: "ALERT-abc",
  crop: "durian",
  target_min: 80,
  target_max: 95,
  unit: "THB/kg",
  active: true,
  updated_at: "2024-01-01T10:00:00Z"
});
// Returns: "inserted" | "updated" | "skipped"
```

### **Mobile-Side (React Native)**
```typescript
import { useOfflineSync, useOutboxFlush, enqueuePriceAlertUpsert } from "./mobile/offline/hooks";

function PriceAlertsScreen() {
  const sync = useOfflineSync();
  const flush = useOutboxFlush();

  // Sync on app focus
  useEffect(() => {
    sync.mutate({ 
      user_id: "user123", 
      areas: ["TH-10-XX"], 
      crops: ["rice", "durian"] 
    });
  }, []);

  // Queue offline mutation
  const handleCreateAlert = async () => {
    await enqueuePriceAlertUpsert({
      user_id: "user123",
      id: "ALERT-new",
      crop: "durian",
      target_min: 80,
      target_max: 95,
      unit: "THB/kg",
      active: true,
      updated_at: new Date().toISOString()
    });
    
    // Flush when online
    if (isOnline) {
      flush.mutate();
    }
  };

  return (
    <View>
      <Button onPress={handleCreateAlert} title="Create Alert" />
      {sync.isPending && <Text>Syncing...</Text>}
      {flush.isPending && <Text>Flushing outbox...</Text>}
    </View>
  );
}
```

## Type Safety Benefits

### **Database Queries**
```typescript
// ❌ Before: Raw SQL with no type safety
const shops = await db.all(`
  SELECT id, name_th, province_code 
  FROM shops 
  WHERE is_active = 1
`);

// ✅ After: Kysely with full type safety
const shops = await db.selectFrom("shops")
  .select(["id", "name_th", "province_code"])
  .where("is_active", "=", 1)
  .execute();
// shops is typed as Shops[]
```

### **Mutation Validation**
```typescript
// ❌ Before: No validation
const result = await processQueue(db, mutations);

// ✅ After: Type-safe mutations
const result = await processQueueKysely(db, mutations);
// mutations is typed as ClientMutation[]
// result is typed as { ok: boolean; results: MutationResult[] }
```

## Performance Optimizations

### **1. Delta Sync**
- Only fetch records modified since last sync
- Use `updated_at` timestamps for efficient filtering
- Limit results to 2000 records per entity type

### **2. Batch Processing**
- Process up to 25 mutations per batch
- Use database transactions for atomicity
- Implement retry logic for failed mutations

### **3. Conflict Resolution**
- Server-wins policy with timestamp comparison
- Skip mutations with older timestamps
- Log all conflicts for monitoring

## Error Handling

### **Server-Side**
```typescript
try {
  const result = await processQueueKysely(db, mutations);
  return { ok: true, results: result.results };
} catch (error) {
  console.error("Queue processing failed:", error);
  return { ok: false, error: error.message };
}
```

### **Mobile-Side**
```typescript
const sync = useOfflineSync({
  onError: (error) => {
    console.error("Sync failed:", error);
    // Show user-friendly error message
  },
  onSuccess: (data) => {
    console.log("Sync successful:", data);
    // Update UI with new data
  }
});
```

## Monitoring & Debugging

### **Outbox Status**
```typescript
// Check outbox status
const outbox = getOutbox();
console.log(`Outbox has ${outbox.length} pending mutations`);

// Check sync cursor
const cursor = getCursor();
console.log(`Last sync: ${cursor}`);
```

### **Database Queries**
```typescript
// Monitor mutation success rate
const stats = await db.selectFrom("outbox_log")
  .select([
    "status",
    sql<number>`count(*)`.as("count")
  ])
  .groupBy("status")
  .execute();
```

## Migration from Raw SQL

### **1. Update Imports**
```typescript
// Before
import { openOfflineDb } from "../lib/offline/db";
import { doSync, processQueue } from "../lib/offline/service";

// After
import { makeDb } from "../lib/db/kysely";
import { doSyncKysely, processQueueKysely } from "../lib/offline/kysely-service";
```

### **2. Update Database Connection**
```typescript
// Before
const db = await openOfflineDb();

// After
const db = makeDb();
```

### **3. Update Service Calls**
```typescript
// Before
const bundle = await doSync(db, query);
const result = await processQueue(db, mutations);

// After
const bundle = await doSyncKysely(db, query);
const result = await processQueueKysely(db, mutations);
```

## Testing

### **Unit Tests**
```typescript
import { makeDb } from "./lib/db/kysely";
import { OfflineRepo } from "./lib/offline/kysely-repo";

describe("OfflineRepo", () => {
  let db: Kysely<DB>;
  let repo: OfflineRepo;

  beforeEach(() => {
    db = makeDb(":memory:");
    repo = new OfflineRepo(db);
  });

  it("should upsert price alert", async () => {
    const result = await repo.upsertPriceAlert("user123", {
      id: "ALERT-test",
      crop: "rice",
      target_min: 50,
      target_max: 60,
      unit: "THB/kg",
      active: true
    });
    expect(result).toBe("inserted");
  });
});
```

### **Integration Tests**
```typescript
import request from "supertest";
import app from "./server";

describe("Offline Cache API", () => {
  it("should sync user data", async () => {
    const response = await request(app)
      .get("/api/cache/sync?user_id=user123")
      .expect(200);
    
    expect(response.body).toHaveProperty("server_time");
    expect(response.body).toHaveProperty("next_since");
    expect(response.body).toHaveProperty("refs");
    expect(response.body).toHaveProperty("user");
  });
});
```

The Kysely + React Native offline system provides type-safe, performant offline capabilities for your Thailand farming AI app!
