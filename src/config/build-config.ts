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
  apiBaseUrl: process.env.API_BASE_URL || "https://raiai.app",
};
