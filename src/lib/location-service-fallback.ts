/**
 * Location Service Fallback Wrapper
 * Google Maps primary → Mapbox fallback
 */

import { geocodeAddress as googleGeocode, reverseGeocode as googleReverse, NormalizedAddress as GAddr } from "./location-service";
import { mapboxForwardGeocode, mapboxReverseGeocode, NormalizedAddress as MAddr } from "./location-service-mapbox";

export type NormalizedAddress = GAddr | MAddr;

export async function geocodeWithFallback(
  q: string, 
  keys: { GOOGLE_MAPS_API_KEY: string; MAPBOX_ACCESS_TOKEN: string }
): Promise<NormalizedAddress[]> {
  try {
    return await googleGeocode(q, { apiKey: keys.GOOGLE_MAPS_API_KEY, language: "th", region: "TH" });
  } catch (error) {
    console.warn("Google geocoding failed, trying Mapbox:", error);
    return await mapboxForwardGeocode(q, { accessToken: keys.MAPBOX_ACCESS_TOKEN, language: "th", country: "TH" });
  }
}

export async function reverseWithFallback(
  lat: number, 
  lon: number, 
  keys: { GOOGLE_MAPS_API_KEY: string; MAPBOX_ACCESS_TOKEN: string }
): Promise<NormalizedAddress[]> {
  try {
    return await googleReverse({ lat, lon }, { apiKey: keys.GOOGLE_MAPS_API_KEY, language: "th" });
  } catch (error) {
    console.warn("Google reverse geocoding failed, trying Mapbox:", error);
    return await mapboxReverseGeocode({ lat, lon }, { accessToken: keys.MAPBOX_ACCESS_TOKEN, language: "th", country: "TH" });
  }
}
