/**
 * Location Service (Thailand MVP)
 * - Google Geocoding API (forward + reverse)
 * - Places Autocomplete (type-ahead)
 * - Thai-first defaults: language=th, components=country:TH
 *
 * ENV (recommended):
 *   GOOGLE_MAPS_API_KEY (server)  // keep secret; restrict to Geocoding + Places
 *
 * If you must call from client, use a server proxy or per-platform key restrictions.
 */

export type LatLng = { lat: number; lon: number };

export type NormalizedAddress = {
  formatted: string;
  lat: number;
  lon: number;
  // Thai admin components (best-effort from Google types)
  province?: string;          // administrative_area_level_1
  amphoe?: string;            // administrative_area_level_2
  tambon?: string;            // sublocality_level_1 OR administrative_area_level_3
  district?: string;          // sometimes sublocality or administrative_area_level_3
  postal_code?: string;
  country?: string;
  raw?: any;                  // original result for debugging
  source: "google";
};

export type AutocompletePrediction = {
  description: string;
  place_id: string;
  matched_substrings?: { offset: number; length: number }[];
};

/** ---- Public API ---- */

export async function geocodeAddress(
  query: string,
  opts: { apiKey: string; language?: string; region?: string } = { apiKey: required("GOOGLE_MAPS_API_KEY") }
): Promise<NormalizedAddress[]> {
  const { apiKey, language = "th", region = "TH" } = opts;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("language", language);
  url.searchParams.set("components", "country:TH");
  // region bias helps ranking; doesn't filter like components
  url.searchParams.set("region", region);
  url.searchParams.set("key", apiKey);

  const data = await httpJson(url.toString());
  ensureOK(data);

  return (data.results ?? []).map((r: any) => normalizeGeocodeResult(r));
}

export async function reverseGeocode(
  coords: LatLng,
  opts: { apiKey: string; language?: string } = { apiKey: required("GOOGLE_MAPS_API_KEY") }
): Promise<NormalizedAddress[]> {
  const { apiKey, language = "th" } = opts;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${coords.lat},${coords.lon}`);
  url.searchParams.set("language", language);
  url.searchParams.set("key", apiKey);

  const data = await httpJson(url.toString());
  ensureOK(data);

  // Attach the queried lat/lon to each normalized result (Google returns geometry anyway)
  return (data.results ?? []).map((r: any) => normalizeGeocodeResult(r));
}

/**
 * Places Autocomplete (server-side or proxied).
 * Provide a session token (UUID) per typing session to reduce cost.
 * https://developers.google.com/maps/documentation/places/web-service/autocomplete
 */
export async function placesAutocomplete(
  input: string,
  opts: {
    apiKey: string;
    sessiontoken?: string;
    language?: string;
    region?: string;
    // Optionally restrict to addresses to avoid POIs: types=(regions|address)
    types?: "address" | "regions";
  } = { apiKey: required("GOOGLE_MAPS_API_KEY") }
): Promise<AutocompletePrediction[]> {
  const { apiKey, sessiontoken, language = "th", region = "th", types = "address" } = opts;
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("language", language);
  url.searchParams.set("components", "country:TH");
  url.searchParams.set("region", region);
  url.searchParams.set("types", types);
  if (sessiontoken) url.searchParams.set("sessiontoken", sessiontoken);
  url.searchParams.set("key", apiKey);

  const data = await httpJson(url.toString());
  ensurePlacesOK(data);

  return (data.predictions ?? []).map((p: any) => ({
    description: p.description,
    place_id: p.place_id,
    matched_substrings: p.matched_substrings,
  }));
}

/** Optional: get final coords from a place_id (when user taps an autocomplete row). */
export async function geocodePlaceId(
  placeId: string,
  opts: { apiKey: string; language?: string } = { apiKey: required("GOOGLE_MAPS_API_KEY") }
): Promise<NormalizedAddress | null> {
  const { apiKey, language = "th" } = opts;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("language", language);
  url.searchParams.set("key", apiKey);

  const data = await httpJson(url.toString());
  ensureOK(data);

  const r = (data.results ?? [])[0];
  return r ? normalizeGeocodeResult(r) : null;
}

/** ---- Helpers ---- */

function normalizeGeocodeResult(r: any): NormalizedAddress {
  const geometry = r.geometry?.location ?? {};
  const comps = r.address_components ?? [];

  const byType = (t: string) => comps.find((c: any) => c.types?.includes(t))?.long_name;

  // Thai admin levels (best-effort):
  const province = byType("administrative_area_level_1");  // จังหวัด
  const amphoe = byType("administrative_area_level_2") || byType("locality"); // อำเภอ / เขต
  // Tambon is often sublocality_level_1 or admin_area_level_3 depending on area
  const tambon = byType("sublocality_level_1") || byType("administrative_area_level_3");
  const district = byType("sublocality") || byType("neighborhood"); // sometimes useful in Bangkok
  const postal_code = byType("postal_code");
  const country = byType("country");

  return {
    formatted: r.formatted_address,
    lat: Number(geometry.lat),
    lon: Number(geometry.lng),
    province,
    amphoe,
    tambon,
    district,
    postal_code,
    country,
    raw: r,
    source: "google",
  };
}

function ensureOK(data: any) {
  // Geocoding API status
  const status = data?.status;
  if (!status || (status !== "OK" && status !== "ZERO_RESULTS")) {
    const msg = data?.error_message || status || "Unknown Geocoding error";
    throw new Error(`GeocodingAPI: ${msg}`);
  }
}

function ensurePlacesOK(data: any) {
  const status = data?.status;
  if (!status || (status !== "OK" && status !== "ZERO_RESULTS")) {
    const msg = data?.error_message || status || "Unknown Places error";
    throw new Error(`PlacesAPI: ${msg}`);
  }
}

/** Tiny fetch + retry */
async function httpJson(url: string, retries = 1): Promise<any> {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0,180)}`);
    }
    return await res.json();
  } catch (e) {
    if (retries > 0) return httpJson(url, retries - 1);
    throw e;
  }
}

function required(name: string): never {
  throw new Error(`Missing ${name} – pass opts.apiKey or set env`);
}