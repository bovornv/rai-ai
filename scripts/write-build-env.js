import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Get git commit hash
let sha = "unknown";
try {
  sha = execSync("git rev-parse --short HEAD").toString().trim();
} catch (error) {
  console.warn("Could not get git commit:", error.message);
}

// Get build time
const ts = new Date().toISOString();

// Get version from package.json
let version = "0.0.0";
try {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  version = pkg.version || version;
} catch (error) {
  console.warn("Could not read package.json:", error.message);
}

// Create .env content
const envContent = `# Build metadata
GIT_COMMIT=${sha}
BUILD_TIME=${ts}
VERSION=${version}

# Runtime configuration
NODE_ENV=production
REGION=thailand
API_BASE_URL=https://api.raiai.app

# Feature flags
ANALYTICS_INGEST_KEY=dev-ingest
ANALYTICS_READ_KEY=dev-read
CRASH_INGEST_KEY=dev-crash
FEATURE_FLAGS_READ_KEY=dev-flags
`;

// Write .env file
fs.writeFileSync(".env", envContent, { flag: "w" });

// Also write .env.production for production builds
fs.writeFileSync(".env.production", envContent, { flag: "w" });

console.log("✅ Wrote .env files with build metadata:");
console.log(`   GIT_COMMIT: ${sha}`);
console.log(`   BUILD_TIME: ${ts}`);
console.log(`   VERSION: ${version}`);
