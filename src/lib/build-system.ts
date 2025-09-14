import { buildConfig } from "../config/build-config";
import fs from "fs";
import path from "path";

export function getBuildInfo() {
  let version = "0.0.0";
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    version = pkg.version || version;
  } catch {
    // fallback ok
  }

  return {
    version,
    commit: process.env.GIT_COMMIT || "unknown",
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || "development"
  };
}

export function getBuildConfig() {
  return {
    appName: buildConfig.appName,
    features: buildConfig.features,
    region: buildConfig.region,
    environment: buildConfig.environment,
    apiBaseUrl: buildConfig.apiBaseUrl
  };
}