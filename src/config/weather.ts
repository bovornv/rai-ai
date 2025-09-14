// Weather service configuration
export const WEATHER_CONFIG = {
  // API Keys (in production, these should come from environment variables)
  MS_API_KEY: '69z56nx86o9g7ut24iwuzq5p1ik9rek8v61ggigg',
  OWM_API_KEY: '29e794ca05b243e559caf94c5a638d02',
  
  // Feature flags
  USE_FALLBACK: true,
  ENSEMBLE_MODE: false,
  
  // Tunables
  TTL_MINUTES: 60,
  HORIZON_HOURS: 12,
  GEOHASH_PRECISION: 5,
  THROTTLE_MINUTES: 30,
  
  // Retry configuration
  RETRY_BACKOFF_MS: [1000, 3000, 7000],
  MAX_RETRIES: 3,
  
  // Default location (Bangkok, Thailand)
  DEFAULT_LOCATION: {
    lat: 13.7563,
    lon: 100.5018
  }
} as const;

// Environment-specific overrides
export function getWeatherConfig() {
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    ...WEATHER_CONFIG,
    // In development, use shorter TTL for testing
    TTL_MINUTES: isDev ? 5 : WEATHER_CONFIG.TTL_MINUTES,
    // In development, allow more frequent API calls
    THROTTLE_MINUTES: isDev ? 1 : WEATHER_CONFIG.THROTTLE_MINUTES,
  };
}
