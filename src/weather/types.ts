// Unified types for weather + spray window

export type Hour = {
  timeISO: string;   // e.g., "2025-09-06T08:00:00Z" (UTC)
  rain_mm: number;   // mm/hr
  pop: number;       // probability of precip (0..1)
  wind_ms: number;   // m/s
  gust_ms?: number;  // m/s
  rh?: number;       // relative humidity %
  temp_c?: number;   // °C
};

export type Forecast = {
  source: "meteosource" | "openweather" | "ensemble";
  issuedISO: string;     // when Provider issued the data
  geohash5: string;      // cache key bucket
  hourly: Hour[];        // next 24h; app consumes first 12h
};

export type RecentRain = { rain_mm_last3h: number };

export type SprayVerdictLevel = "GOOD" | "CAUTION" | "DON'T";

export type SprayVerdict = {
  level: SprayVerdictLevel;
  reason_th: string;  // show on badge/card
  reason_en: string;  // internal/logs
  confidence?: number; // 0-1 confidence in decision
  next_safe_hour?: string; // ISO string of next safe hour
};

export type LatLon = { lat: number; lon: number };

export type WeatherConfig = {
  TTL_MIN: number;
  USE_FALLBACK: boolean;
  THROTTLE_MS: number;
  HORIZON_HOURS: number;
};

export type WeatherKeys = {
  MS_API_KEY: string;
  OWM_API_KEY: string;
};
