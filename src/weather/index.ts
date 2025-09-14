// Main weather service exports
export * from './types';
export * from './weatherRepo';
export * from './sprayWindow';
export * from './providers/meteosource';
export * from './providers/openweather';
export * from './storage/memoryStore';

// Convenience function for easy integration
import { getForecastCached, getRecentRainCachedOrZero, forecastSummary } from './weatherRepo';
import { sprayWindowDecision, defaultProfileRice, defaultProfileDurian } from './sprayWindow';
import { LatLon, WeatherKeys } from './types';
import { analyticsService } from '../services/analyticsService';

// Example usage in Today tab:
export async function computeSprayBadge(
  user: { lat?: number; lon?: number; crop: "rice" | "durian"; fallbackArea?: { lat: number; lon: number } },
  keys: WeatherKeys
) {
  const latlon: LatLon = user.lat && user.lon
    ? { lat: user.lat, lon: user.lon }
    : (user.fallbackArea ?? { lat: 13.7563, lon: 100.5018 }); // Bangkok center default

  const fc = await getForecastCached(latlon, keys);
  const rr = await getRecentRainCachedOrZero(latlon);

  const profile = user.crop === "durian" ? defaultProfileDurian : defaultProfileRice;
  
  // Example uncertainty penalty if provider lacks wind or pop for >30% of horizon
  const missing = fc.hourly.slice(0, 12).filter(h => h.wind_ms == null || h.pop == null).length;
  const penalize = missing >= 4;

  const verdict = sprayWindowDecision(fc.hourly, rr, user.crop, penalize);

  // Track analytics
  analyticsService.trackSprayVerdict({
    level: verdict.level,
    crop: user.crop,
    source: fc.source,
    thresholds: profile,
    confidence: verdict.confidence || 0.8,
    geohash5: fc.geohash5,
    locationSource: user.lat && user.lon ? 'gps' : 'manual'
  });

  // For logs / analytics
  console.log("forecast", forecastSummary(fc));
  console.log("sprayVerdict", verdict);

  return verdict; // { level: "GOOD"|"CAUTION"|"DON'T", reason_th, reason_en }
}
