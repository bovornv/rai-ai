import { Forecast, LatLon, RecentRain, WeatherConfig, WeatherKeys } from "./types";
import { fetchMeteosource } from "./providers/meteosource";
import { fetchOpenWeather } from "./providers/openweather";
import { toGeohash5 } from "./util/geohash";
import { isOffline } from "./util/time";
import { memoryStore } from "./storage/memoryStore";
import { persistentStore } from "./storage/persistentStore";
import { analyticsService } from "../services/analyticsService";

/** CONFIG (wire via Remote Config / env) */
export const WeatherCfg: WeatherConfig = {
  TTL_MIN: 60,
  USE_FALLBACK: true,
  THROTTLE_MS: 30 * 60 * 1000, // 30 minutes
  HORIZON_HOURS: 12,
};

type Store = {
  getFresh(geohash5: string, ttlMin: number): Promise<Forecast | null>;
  put(f: Forecast): Promise<void>;
  getRecentRain(geohash5: string): Promise<RecentRain | null>;
  putRecentRain(geohash5: string, r: RecentRain): Promise<void>;
};

// Use persistent store by default, fallback to memory store
export let store: Store = persistentStore;

// Initialize persistent store
let storeInitialized = false;
export async function initializeWeatherStore(): Promise<void> {
  if (!storeInitialized) {
    try {
      await persistentStore.init();
      store = persistentStore;
      console.log('✅ Persistent weather store initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize persistent store, using memory store:', error);
      store = memoryStore;
    }
    storeInitialized = true;
  }
}

/** Simple in-process throttle to avoid hammering providers */
const throttles = new Map<string, number>(); // geohash5 -> lastFetchMs

export async function getForecast(latlon: LatLon, keys: WeatherKeys): Promise<Forecast> {
  const { lat, lon } = latlon;
  const gh = toGeohash5(lat, lon);

  // throttle check
  const last = throttles.get(gh) ?? 0;
  const now = Date.now();
  if (now - last < WeatherCfg.THROTTLE_MS) {
    const cached = await store.getFresh(gh, WeatherCfg.TTL_MIN);
    if (cached) return cached;
  }

  const startTime = Date.now();
  
  // Try primary: Meteosource
  try {
    console.log('🌦️ Fetching from Meteosource...');
    const ms = await fetchMeteosource(lat, lon, keys.MS_API_KEY);
    if (ms.hourly.length >= WeatherCfg.HORIZON_HOURS) {
      throttles.set(gh, now);
      await store.put(ms);
      console.log('✅ Meteosource data cached');
      
      // Track success
      analyticsService.trackWeatherFetch({
        source: 'meteosource',
        success: true,
        duration: Date.now() - startTime,
        geohash5: gh
      });
      
      return ms;
    }
    throw new Error("meteosource insufficient hours");
  } catch (e) {
    console.warn('⚠️ Meteosource failed, trying OpenWeather fallback...', e);
    
    // Track Meteosource failure
    analyticsService.trackWeatherFetch({
      source: 'meteosource',
      success: false,
      duration: Date.now() - startTime,
      geohash5: gh,
      error: e.message
    });
    
    if (!WeatherCfg.USE_FALLBACK) throw e;
    
    // Fallback: OpenWeather
    try {
      const owm = await fetchOpenWeather(lat, lon, keys.OWM_API_KEY);
      throttles.set(gh, now);
      await store.put(owm);
      console.log('✅ OpenWeather data cached');
      
      // Track fallback success
      analyticsService.trackWeatherFallback('meteosource', 'openweather', gh);
      analyticsService.trackWeatherFetch({
        source: 'openweather',
        success: true,
        duration: Date.now() - startTime,
        geohash5: gh
      });
      
      return owm;
    } catch (fallbackError) {
      console.error('❌ Both weather providers failed:', fallbackError);
      
      // Track fallback failure
      analyticsService.trackWeatherFetch({
        source: 'openweather',
        success: false,
        duration: Date.now() - startTime,
        geohash5: gh,
        error: fallbackError.message
      });
      
      throw new Error(`Weather fetch failed: Meteosource (${e}), OpenWeather (${fallbackError})`);
    }
  }
}

export async function getForecastCached(latlon: LatLon, keys: WeatherKeys): Promise<Forecast> {
  const { lat, lon } = latlon;
  const gh = toGeohash5(lat, lon);
  
  // Check cache first
  const cached = await store.getFresh(gh, WeatherCfg.TTL_MIN);
  if (cached) {
    console.log('📦 Using cached weather data');
    return cached;
  }

  // If offline, try to get any cached data
  if (isOffline()) {
    const stale = await store.getFresh(gh, 24 * 60); // 24 hours for offline
    if (stale) {
      console.log('📱 Offline: using stale weather data');
      return stale;
    }
    throw new Error('No cached weather data available offline');
  }

  // Fetch fresh data
  const live = await getForecast(latlon, keys);
  return live;
}

export async function getRecentRainCachedOrZero(latlon: LatLon): Promise<RecentRain> {
  const gh = toGeohash5(latlon.lat, latlon.lon);
  const rr = await store.getRecentRain(gh);
  return rr ?? { rain_mm_last3h: 0 };
}

/** Convenience helper for analytics/debug */
export function forecastSummary(f: Forecast) {
  const first = f.hourly[0];
  const last = f.hourly[Math.min(f.hourly.length - 1, 11)];
  return {
    source: f.source,
    issued: f.issuedISO,
    span: `${first?.timeISO} → ${last?.timeISO}`,
    sample: { rain_mm: first?.rain_mm, wind_ms: first?.wind_ms, pop: first?.pop },
    cachedAt: new Date().toISOString(),
  };
}

// Analytics events
export function logWeatherEvent(event: string, data: any) {
  console.log(`📊 Weather Event: ${event}`, data);
}

// Set custom store (for testing or different storage backends)
export function setWeatherStore(newStore: Store) {
  store = newStore;
}
