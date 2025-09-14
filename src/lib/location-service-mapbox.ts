/**
 * Mapbox Geocoding (Thailand MVP fallback)
 * Docs: https://docs.mapbox.com/api/search/geocoding/
 *
 * ENV (optional): MAPBOX_ACCESS_TOKEN
 * Usage: call these when Google Geocoding fails/timeouts.
 */

export type LatLng = { lat: number; lon: number };

export type NormalizedAddress = {
  formatted: string;
  lat: number;
  lon: number;
  province?: string;   // region in Mapbox
  amphoe?: string;     // district in Mapbox (อำเภอ/เขต)
  tambon?: string;     // often locality/neighborhood in Mapbox
  district?: string;   // extra granularity if needed
  postal_code?: string;
  country?: string;
  raw?: any;
  source: "mapbox";
};

/** ---- Public API ---- */

export async function mapboxForwardGeocode(
  query: string,
  opts: { accessToken: string; language?: string; country?: string; limit?: number } = {
    accessToken: required("MAPBOX_ACCESS_TOKEN"),
  }
): Promise<NormalizedAddress[]> {
  const { accessToken, language = "th", country = "TH", limit = 5 } = opts;
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("language", language);
  url.searchParams.set("country", country);
  url.searchParams.set("limit", String(limit));

  const data = await httpJson(url.toString());
  ensureFeatureArray(data);
  return (data.features ?? []).map((f: any) => normalizeFeature(f));
}

export async function mapboxReverseGeocode(
  coords: LatLng,
  opts: { accessToken: string; language?: string; country?: string } = {
    accessToken: required("MAPBOX_ACCESS_TOKEN"),
  }
): Promise<NormalizedAddress[]> {
  const { accessToken, language = "th", country = "TH" } = opts;
  // Mapbox expects lon,lat
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lon},${coords.lat}.json`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("language", language);
  url.searchParams.set("country", country);

  const data = await httpJson(url.toString());
  ensureFeatureArray(data);
  return (data.features ?? []).map((f: any) => normalizeFeature(f));
}

/** ---- Helpers ---- */

// Mapbox "context" items carry admin hierarchy with place_type/id prefixes:
// - region      → province (e.g., กรุงเทพมหานคร)
// - district    → amphoe/เขต
// - place       → city/town (บางพื้นที่ในไทยจะอยู่ใน place/locality)
// - locality    → ตำบล/แขวง (tambon often lives here)
// - neighborhood→ smaller area; use as fallback for tambon/district
function normalizeFeature(f: any): NormalizedAddress {
  const [lon, lat] = f.center ?? [undefined, undefined];
  const ctx: any[] = f.context ?? [];
  const types: string[] = f.place_type ?? []; // e.g., ["address","place"]

  const first = (t: string) => {
    if (types.includes(t) && f.text) return f.text; // sometimes the feature itself is the region/place
    return ctx.find((c) => (c.id || "").startsWith(`${t}.`))?.text;
  };

  const province  = first("region");
  const amphoe    = first("district") || first("place");      // Bangkok "เขต" may appear as district/place
  const tambon    = first("locality") || first("neighborhood");
  const country   = first("country") || "Thailand";
  const postcode  = ctx.find((c) => (c.id || "").startsWith("postcode."))?.text;

  return {
    formatted: f.place_name ?? "",
    lat: Number(lat),
    lon: Number(lon),
    province,
    amphoe,
    tambon,
    district: first("neighborhood") || first("locality"),
    postal_code: postcode,
    country,
    raw: f,
    source: "mapbox",
  };
}

function ensureFeatureArray(data: any) {
  if (!data || !Array.isArray(data.features)) {
    const msg = data?.message || "Invalid Mapbox response";
    throw new Error(`MapboxGeocoding: ${msg}`);
  }
}

async function httpJson(url: string, retries = 1): Promise<any> {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 180)}`);
    }
    return await res.json();
  } catch (e) {
    if (retries > 0) return httpJson(url, retries - 1);
    throw e;
  }
}

function required(name: string): never {
  throw new Error(`Missing ${name} – pass opts.accessToken or set env`);
}
