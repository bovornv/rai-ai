# Deployment Guide for RaiAI API

This guide covers deploying the RaiAI Farming API across multiple platforms with proper build metadata injection.

## Quick Start

### **Local Development**
```bash
# Install dependencies
npm install

# Run build script (injects GIT_COMMIT and BUILD_TIME)
npm run prebuild

# Start development server
npm run prices:server
```

### **Test Build Info**
```bash
# Check build metadata
curl "http://localhost:3000/api/build/info"

# Check runtime configuration
curl "http://localhost:3000/api/build/config"
```

## Platform-Specific Deployments

### **1. GitHub Actions (Any Host)**

The `.github/workflows/deploy.yml` file automatically:
- Sets `GIT_COMMIT` from `${{ github.sha }}`
- Sets `BUILD_TIME` from current timestamp
- Creates `.env.production` with build metadata
- Builds and packages the application

**Usage:**
```bash
# Push to main branch triggers deployment
git push origin main
```

**Manual trigger:**
```bash
# Set environment variables manually
export GIT_COMMIT=$(git rev-parse --short HEAD)
export BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
npm run build
```

### **2. Docker / Kubernetes**

**Build with metadata:**
```bash
# Build Docker image with build args
npm run docker:build

# Run locally
npm run docker:run
```

**Manual Docker build:**
```bash
docker build \
  --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) \
  --build-arg BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VERSION=$(node -p 'require("./package.json").version') \
  -t raiai-api:$(git rev-parse --short HEAD) .
```

**Cloud Run deployment:**
```bash
gcloud run deploy raiai-api \
  --image gcr.io/<PROJECT>/raiai-api:$(git rev-parse --short HEAD) \
  --set-env-vars GIT_COMMIT=$(git rev-parse --short HEAD),BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
```

### **3. Vercel**

**Automatic deployment:**
- Vercel automatically provides `VERCEL_GIT_COMMIT_SHA`
- Set `VERCEL_DEPLOYMENT_CREATED_AT` for build time
- Configuration in `vercel.json`

**Manual deployment:**
```bash
npm run deploy:vercel
```

**Environment variables in Vercel dashboard:**
- `GIT_COMMIT` = `$VERCEL_GIT_COMMIT_SHA`
- `BUILD_TIME` = `$VERCEL_DEPLOYMENT_CREATED_AT`

### **4. Render**

**Automatic deployment:**
- Render provides `RENDER_GIT_COMMIT` automatically
- Configuration in `render.yaml`

**Manual deployment:**
```bash
npm run deploy:render
```

**Environment variables:**
- `GIT_COMMIT` = `$RENDER_GIT_COMMIT`
- `BUILD_TIME` = Generated during build

### **5. Railway**

**Automatic deployment:**
- Railway provides `RAILWAY_GIT_COMMIT_SHA`
- Configuration in `railway.toml`

**Manual deployment:**
```bash
railway deploy
```

**Environment variables:**
- `GIT_COMMIT` = `$RAILWAY_GIT_COMMIT_SHA`
- `BUILD_TIME` = Set during build

### **6. Fly.io**

**Deploy with build args:**
```bash
fly deploy --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) --build-arg BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
```

**Configuration in `fly.toml`:**
- Default values set for `GIT_COMMIT` and `BUILD_TIME`
- Override during deployment

### **7. Heroku**

**Set environment variables:**
```bash
heroku config:set GIT_COMMIT=$(git rev-parse --short HEAD)
heroku config:set BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
heroku config:set NODE_ENV=production
heroku config:set REGION=thailand
```

**Deploy:**
```bash
git push heroku main
```

## Build Script Details

### **Pre-build Script** (`scripts/write-build-env.js`)

Automatically runs before `npm run build` and:
- Gets git commit hash
- Generates build timestamp
- Reads version from `package.json`
- Creates `.env` and `.env.production` files

**Generated .env content:**
```bash
# Build metadata
GIT_COMMIT=a1b2c3d
BUILD_TIME=2025-09-13T10:22:58Z
VERSION=0.1.3

# Runtime configuration
NODE_ENV=production
REGION=thailand
API_BASE_URL=https://api.raiai.app

# Feature flags
ANALYTICS_INGEST_KEY=dev-ingest
ANALYTICS_READ_KEY=dev-read
CRASH_INGEST_KEY=dev-crash
FEATURE_FLAGS_READ_KEY=dev-flags
```

## Verification

### **Check Build Info**
```bash
# Get build metadata
curl "https://your-api.com/api/build/info"

# Expected response
{
  "version": "0.1.3",
  "commit": "a1b2c3d",
  "buildTime": "2025-09-13T10:22:58Z",
  "nodeEnv": "production"
}
```

### **Check Runtime Config**
```bash
# Get runtime configuration
curl "https://your-api.com/api/build/config"

# Expected response
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

## Troubleshooting

### **Common Issues**

#### **Build Info Shows "unknown"**
- Check if `GIT_COMMIT` and `BUILD_TIME` are set in environment
- Verify build script ran successfully
- Check if `.env` file was created

#### **Docker Build Fails**
- Ensure build args are passed correctly
- Check if git is available in build context
- Verify Dockerfile syntax

#### **Environment Variables Not Set**
- Check platform-specific documentation
- Verify environment variable names
- Test with `echo $GIT_COMMIT` in build script

### **Debug Commands**

```bash
# Check git commit
git rev-parse --short HEAD

# Check build time
date -u +'%Y-%m-%dT%H:%M:%SZ'

# Check package version
node -p 'require("./package.json").version'

# Test build script
node scripts/write-build-env.js

# Check generated .env
cat .env
```

## Security Notes

### **Safe to Expose**
- ✅ Git commit hash
- ✅ Build timestamp
- ✅ Version number
- ✅ Feature flags
- ✅ Environment name

### **Never Expose**
- ❌ API keys
- ❌ Database credentials
- ❌ JWT secrets
- ❌ Private tokens

## CI/CD Best Practices

### **GitHub Actions**
- Use `fetch-depth: 0` for full git history
- Set environment variables in workflow
- Use artifacts for deployment packages

### **Docker**
- Use multi-stage builds
- Add labels for traceability
- Use non-root user
- Include health checks

### **Platform Deployments**
- Set environment variables in platform dashboard
- Use platform-specific build commands
- Enable automatic deployments
- Monitor build logs

The deployment system ensures accurate build metadata across all platforms for your RaiAI farming app!
