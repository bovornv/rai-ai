# Build System API Setup

## Quick Start

### 1. Start Server
```bash
npm run prices:server
# Build endpoints: /api/build/info, /api/build/config
```

### 2. Test Build Endpoints
```bash
# Get build metadata
curl "http://localhost:3000/api/build/info"

# Get runtime configuration
curl "http://localhost:3000/api/build/config"
```

## API Reference

### GET /api/build/info

**Response:**
```json
{
  "version": "0.1.3",
  "commit": "f2a8bcd",
  "buildTime": "2025-09-13T09:45:00Z",
  "nodeEnv": "production"
}
```

### GET /api/build/config

**Response:**
```json
{
  "appName": "RaiAI Farming Assistant",
  "features": {
    "weather": true,
    "outbreak": true,
    "price": true,
    "shopTickets": true,
    "analytics": true,
    "crashReporting": true,
    "featureFlags": true,
    "offlineCache": true,
    "permissions": true
  },
  "region": "thailand",
  "environment": "production",
  "apiBaseUrl": "https://api.raiai.app"
}
```

## Configuration

### **Build Config File** (`src/config/build-config.ts`)
```typescript
export const buildConfig = {
  appName: "RaiAI Farming Assistant",
  features: {
    weather: true,
    outbreak: true,
    price: true,
    shopTickets: true,
    analytics: true,
    crashReporting: true,
    featureFlags: true,
    offlineCache: true,
    permissions: true
  },
  region: process.env.REGION || "thailand",
  environment: process.env.NODE_ENV || "development",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
};
```

### **Environment Variables**
```bash
# Build metadata (set in CI/CD)
export GIT_COMMIT=$(git rev-parse --short HEAD)
export BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Runtime configuration
export NODE_ENV=production
export REGION=thailand
export API_BASE_URL=https://api.raiai.app
```

## CI/CD Integration

### **GitHub Actions Example**
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Set build variables
        run: |
          echo "GIT_COMMIT=$(git rev-parse --short HEAD)" >> $GITHUB_ENV
          echo "BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> $GITHUB_ENV
      
      - name: Build application
        run: |
          npm ci
          npm run build
        env:
          NODE_ENV: production
          REGION: thailand
          API_BASE_URL: https://api.raiai.app
```

### **Docker Build Example**
```dockerfile
FROM node:18-alpine

# Set build metadata
ARG GIT_COMMIT=unknown
ARG BUILD_TIME
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### **Docker Compose Example**
```yaml
version: '3.8'
services:
  raiai-api:
    build:
      context: .
      args:
        GIT_COMMIT: ${GIT_COMMIT:-unknown}
        BUILD_TIME: ${BUILD_TIME:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}
    environment:
      - NODE_ENV=production
      - REGION=thailand
      - API_BASE_URL=https://api.raiai.app
    ports:
      - "3000:3000"
```

## Usage Examples

### **Health Check Integration**
```typescript
// src/server.ts
app.get("/health", async (req, res) => {
  try {
    const buildInfo = getBuildInfo();
    const stats = await pricesDb.get("SELECT COUNT(*) as count FROM price_quotes");
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      build: buildInfo,
      database: { priceQuotes: stats?.count || 0 }
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});
```

### **Client-Side Build Info**
```typescript
// Mobile app - check server version compatibility
async function checkServerCompatibility() {
  try {
    const response = await fetch(`${API_BASE}/api/build/info`);
    const buildInfo = await response.json();
    
    console.log(`Server version: ${buildInfo.version}`);
    console.log(`Build time: ${buildInfo.buildTime}`);
    
    // Check if server supports required features
    const configResponse = await fetch(`${API_BASE}/api/build/config`);
    const config = await configResponse.json();
    
    if (!config.features.offlineCache) {
      console.warn("Server doesn't support offline cache");
    }
  } catch (error) {
    console.error("Failed to check server compatibility:", error);
  }
}
```

### **Monitoring Integration**
```typescript
// Prometheus metrics with build info
import { register, collectDefaultMetrics } from 'prometheus-api-metrics';

collectDefaultMetrics();

const buildInfo = getBuildInfo();
const buildConfig = getBuildConfig();

// Add build info as labels
register.setDefaultLabels({
  app: buildConfig.appName,
  version: buildInfo.version,
  commit: buildInfo.commit,
  environment: buildConfig.environment
});
```

## Feature Flags

### **Runtime Feature Toggle**
```typescript
// src/lib/feature-flags.ts
import { getBuildConfig } from './build-system';

export function isFeatureEnabled(feature: string): boolean {
  const config = getBuildConfig();
  return config.features[feature] === true;
}

// Usage
if (isFeatureEnabled('analytics')) {
  // Initialize analytics
}

if (isFeatureEnabled('crashReporting')) {
  // Initialize crash reporting
}
```

### **Conditional Service Initialization**
```typescript
// src/server.ts
async function initializeServices() {
  const config = getBuildConfig();
  
  if (config.features.analytics) {
    analyticsRouter = await makeAnalyticsRouter();
    app.use("/api/analytics", analyticsRouter);
  }
  
  if (config.features.crashReporting) {
    crashDb = await openCrashDb();
    app.use("/api", makeCrashRouter(crashDb));
  }
  
  if (config.features.offlineCache) {
    offlineCacheRouter = await makeOfflineCacheRouter();
    app.use("/api/cache", offlineCacheRouter);
  }
}
```

## Security Considerations

### **No Secrets Exposed**
- ✅ Only public configuration values
- ✅ No API keys or database credentials
- ✅ No sensitive environment variables
- ✅ Sanitized build metadata only

### **Safe Configuration Values**
```typescript
// ✅ Safe to expose
{
  "appName": "RaiAI Farming Assistant",
  "features": { "weather": true },
  "region": "thailand",
  "environment": "production"
}

// ❌ Never expose
{
  "databaseUrl": "postgresql://...",
  "apiKey": "sk-...",
  "jwtSecret": "..."
}
```

## Debugging & Monitoring

### **Build Information**
```bash
# Check current build
curl -s http://localhost:3000/api/build/info | jq

# Check configuration
curl -s http://localhost:3000/api/build/config | jq

# Check specific feature
curl -s http://localhost:3000/api/build/config | jq '.features.analytics'
```

### **Logging Integration**
```typescript
// src/lib/logger.ts
import { getBuildInfo } from './build-system';

const buildInfo = getBuildInfo();

export function createLogger(service: string) {
  return {
    info: (message: string, meta?: any) => {
      console.log(`[${service}] ${message}`, {
        ...meta,
        build: buildInfo
      });
    }
  };
}
```

### **Error Reporting**
```typescript
// src/lib/error-reporting.ts
import { getBuildInfo, getBuildConfig } from './build-system';

export function reportError(error: Error, context?: any) {
  const buildInfo = getBuildInfo();
  const config = getBuildConfig();
  
  // Send to error reporting service
  errorReportingService.captureException(error, {
    extra: {
      ...context,
      build: buildInfo,
      config: config
    }
  });
}
```

## Testing

### **Unit Tests**
```typescript
import { getBuildInfo, getBuildConfig } from '../lib/build-system';

describe('Build System', () => {
  it('should return build info', () => {
    const info = getBuildInfo();
    expect(info).toHaveProperty('version');
    expect(info).toHaveProperty('commit');
    expect(info).toHaveProperty('buildTime');
    expect(info).toHaveProperty('nodeEnv');
  });

  it('should return build config', () => {
    const config = getBuildConfig();
    expect(config).toHaveProperty('appName');
    expect(config).toHaveProperty('features');
    expect(config).toHaveProperty('region');
    expect(config).toHaveProperty('environment');
  });
});
```

### **Integration Tests**
```typescript
import request from 'supertest';
import app from './server';

describe('Build API', () => {
  it('should return build info', async () => {
    const response = await request(app)
      .get('/api/build/info')
      .expect(200);
    
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('commit');
  });

  it('should return build config', async () => {
    const response = await request(app)
      .get('/api/build/config')
      .expect(200);
    
    expect(response.body).toHaveProperty('appName');
    expect(response.body).toHaveProperty('features');
  });
});
```

## Deployment Checklist

### **Pre-Deployment**
- [ ] Set `GIT_COMMIT` environment variable
- [ ] Set `BUILD_TIME` environment variable
- [ ] Verify `NODE_ENV` is correct
- [ ] Check `API_BASE_URL` is correct
- [ ] Verify feature flags are set correctly

### **Post-Deployment**
- [ ] Test `/api/build/info` endpoint
- [ ] Test `/api/build/config` endpoint
- [ ] Verify version matches expected
- [ ] Check all features are enabled as expected
- [ ] Monitor logs for any configuration issues

The build system API provides essential metadata and configuration for debugging and monitoring your RaiAI farming app deployments!
