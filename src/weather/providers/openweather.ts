import { Forecast, Hour } from "../types";
import { toGeohash5 } from "../util/geohash";
import { httpGET } from "../util/http";

/**
 * OpenWeather One Call 3.0 FALLBACK
 * Docs: https://openweathermap.org/api/one-call-3
 */
export async function fetchOpenWeather(
  lat: number,
  lon: number,
  apiKey: string
): Promise<Forecast> {
  const url = new URL("https://api.openweathermap.org/data/3.0/onecall");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("exclude", "minutely,daily");
  url.searchParams.set("units", "metric");
  url.searchParams.set("appid", apiKey);

  try {
    const r = await httpGET(url.toString());
    
    // Shape: { current:{dt}, hourly:[{dt,temp,humidity,wind_speed,wind_gust,pop,rain:{"1h":mm}}] }

    const issuedISO = new Date(((r?.current?.dt ?? Date.now()/1000) * 1000)).toISOString();
    const hourly: Hour[] = (r?.hourly ?? []).slice(0, 24).map((h: any) => ({
      timeISO: new Date(h.dt * 1000).toISOString(),
      rain_mm: Number(h.rain?.["1h"] ?? 0),
      pop: clamp01(h.pop ?? 0),
      wind_ms: Number(h.wind_speed ?? 0),
      gust_ms: Number(h.wind_gust ?? 0),
      rh: Number(h.humidity ?? 0),
      temp_c: Number(h.temp ?? 0),
    }));

    return {
      source: "openweather",
      issuedISO,
      geohash5: toGeohash5(lat, lon),
      hourly,
    };
  } catch (error) {
    console.error('OpenWeather API error:', error);
    throw new Error(`OpenWeather fetch failed: ${error}`);
  }
}

function clamp01(x: number) { 
  return Math.max(0, Math.min(1, Number(x) || 0)); 
}
