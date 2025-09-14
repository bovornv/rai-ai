import { Forecast, Hour } from "../types";
import { toGeohash5 } from "../util/geohash";
import { httpGET } from "../util/http";

/**
 * Meteosource PRIMARY provider
 * Docs: https://www.meteosource.com/api
 */
export async function fetchMeteosource(
  lat: number,
  lon: number,
  apiKey: string
): Promise<Forecast> {
  const url = new URL("https://www.meteosource.com/api/v2/point");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("sections", "hourly,current");
  url.searchParams.set("language", "en");
  url.searchParams.set("units", "metric");
  url.searchParams.set("key", apiKey);

  try {
    const r = await httpGET(url.toString());
    
    // Expected shape (simplified):
    // { hourly: { data: [{ time, temperature, humidity, wind:{speed, gusts}, precip, precip_prob }, ...] } }

    const issuedISO = new Date().toISOString();
    const hourly: Hour[] = (r?.hourly?.data ?? []).slice(0, 24).map((h: any) => ({
      timeISO: h.time,
      rain_mm: Number(h.precip ?? 0),
      pop: clamp01((h.precip_prob ?? 0) / 100),
      wind_ms: toMPS(h.wind?.speed),
      gust_ms: toMPS(h.wind?.gusts),
      rh: numeric(h.humidity),
      temp_c: numeric(h.temperature ?? h.temp),
    }));

    return {
      source: "meteosource",
      issuedISO,
      geohash5: toGeohash5(lat, lon),
      hourly,
    };
  } catch (error) {
    console.error('Meteosource API error:', error);
    throw new Error(`Meteosource fetch failed: ${error}`);
  }
}

function clamp01(x: number) { 
  return Math.max(0, Math.min(1, Number(x) || 0)); 
}

function numeric(x: any) { 
  const n = Number(x); 
  return Number.isFinite(n) ? n : undefined; 
}

function toMPS(v: any) { 
  // Meteosource gives m/s already; if km/h ever appears, convert
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
