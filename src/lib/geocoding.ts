// Simple geocoding service for Thailand
export interface GeocodeResult {
  formatted: string;
  lat: number;
  lon: number;
  province?: string;
  amphoe?: string;
  tambon?: string;
  source: 'google' | 'mapbox' | 'mock';
}

// Mock data for testing
const mockLocations: GeocodeResult[] = [
  {
    formatted: "กรุงเทพมหานคร, ประเทศไทย",
    lat: 13.7563,
    lon: 100.5018,
    province: "กรุงเทพมหานคร",
    amphoe: "เขตพระนคร",
    tambon: "ตำบลพระบรมมหาราชวัง",
    source: "mock"
  },
  {
    formatted: "เชียงใหม่, ประเทศไทย",
    lat: 18.7883,
    lon: 98.9870,
    province: "เชียงใหม่",
    amphoe: "อำเภอเมืองเชียงใหม่",
    tambon: "ตำบลศรีภูมิ",
    source: "mock"
  },
  {
    formatted: "ขอนแก่น, ประเทศไทย",
    lat: 16.4325,
    lon: 102.8200,
    province: "ขอนแก่น",
    amphoe: "อำเภอเมืองขอนแก่น",
    tambon: "ตำบลในเมือง",
    source: "mock"
  },
  {
    formatted: "ภูเก็ต, ประเทศไทย",
    lat: 7.8804,
    lon: 98.3923,
    province: "ภูเก็ต",
    amphoe: "อำเภอเมืองภูเก็ต",
    tambon: "ตำบลตลาดใหญ่",
    source: "mock"
  },
  {
    formatted: "นครราชสีมา, ประเทศไทย",
    lat: 14.9799,
    lon: 102.0978,
    province: "นครราชสีมา",
    amphoe: "อำเภอเมืองนครราชสีมา",
    tambon: "ตำบลในเมือง",
    source: "mock"
  },
  {
    formatted: "อุดรธานี, ประเทศไทย",
    lat: 17.4138,
    lon: 102.7873,
    province: "อุดรธานี",
    amphoe: "อำเภอเมืองอุดรธานี",
    tambon: "ตำบลหมากแข้ง",
    source: "mock"
  }
];

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  // API Keys (in production, these should come from environment variables)
  const API_KEYS = {
    GOOGLE_MAPS_API_KEY: "AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k",
    MAPBOX_ACCESS_TOKEN: "pk.eyJ1IjoiYm92b3JuIiwiYSI6ImNtZjl3ZWY3dzA3Ym8ycm9lbTQzcmo5ankifQ.LvMa5fl8cpeXL8Za5Vroug"
  };

  try {
    // Try Google Maps first
    const googleResults = await geocodeWithGoogle(query, API_KEYS.GOOGLE_MAPS_API_KEY);
    if (googleResults.length > 0) {
      return googleResults;
    }
  } catch (error) {
    console.warn('Google geocoding failed, trying Mapbox:', error);
  }

  try {
    // Fallback to Mapbox
    const mapboxResults = await geocodeWithMapbox(query, API_KEYS.MAPBOX_ACCESS_TOKEN);
    if (mapboxResults.length > 0) {
      return mapboxResults;
    }
  } catch (error) {
    console.warn('Mapbox geocoding failed, using mock data:', error);
  }

  // Final fallback to mock data
  return getMockResults(query);
}

function getMockResults(query: string): GeocodeResult[] {
  // Filter mock results based on query
  const filteredResults = mockLocations.filter(result => 
    result.formatted.toLowerCase().includes(query.toLowerCase()) ||
    result.province?.toLowerCase().includes(query.toLowerCase()) ||
    result.amphoe?.toLowerCase().includes(query.toLowerCase()) ||
    result.tambon?.toLowerCase().includes(query.toLowerCase())
  );

  // If no exact matches, return partial matches
  if (filteredResults.length === 0) {
    return mockLocations.filter(result => 
      result.formatted.toLowerCase().includes(query.toLowerCase().substring(0, 2)) ||
      result.province?.toLowerCase().includes(query.toLowerCase().substring(0, 2))
    );
  }

  return filteredResults;
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
  // API Keys (in production, these should come from environment variables)
  const API_KEYS = {
    GOOGLE_MAPS_API_KEY: "AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k",
    MAPBOX_ACCESS_TOKEN: "pk.eyJ1IjoiYm92b3JuIiwiYSI6ImNtZjl3ZWY3dzA3Ym8ycm9lbTQzcmo5ankifQ.LvMa5fl8cpeXL8Za5Vroug"
  };

  try {
    // Try Google Maps reverse geocoding first
    const googleResult = await reverseGeocodeWithGoogle(lat, lon, API_KEYS.GOOGLE_MAPS_API_KEY);
    if (googleResult) {
      return googleResult;
    }
  } catch (error) {
    console.warn('Google reverse geocoding failed, trying Mapbox:', error);
  }

  try {
    // Fallback to Mapbox reverse geocoding
    const mapboxResult = await reverseGeocodeWithMapbox(lat, lon, API_KEYS.MAPBOX_ACCESS_TOKEN);
    if (mapboxResult) {
      return mapboxResult;
    }
  } catch (error) {
    console.warn('Mapbox reverse geocoding failed, using mock data:', error);
  }

  // Final fallback to mock data
  return getClosestMockLocation(lat, lon);
}

function getClosestMockLocation(lat: number, lon: number): GeocodeResult | null {
  // Find the closest mock location
  let closestLocation: GeocodeResult | null = null;
  let minDistance = Infinity;

  for (const location of mockLocations) {
    const distance = Math.sqrt(
      Math.pow(location.lat - lat, 2) + Math.pow(location.lon - lon, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestLocation = location;
    }
  }

  return closestLocation;
}

// Real Google Maps reverse geocoding
export async function reverseGeocodeWithGoogle(lat: number, lon: number, apiKey: string): Promise<GeocodeResult | null> {
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lon}`);
    url.searchParams.set("language", "th");
    url.searchParams.set("components", "country:TH");
    url.searchParams.set("region", "TH");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Reverse Geocoding API error: ${data.status}`);
    }

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components = result.address_components || [];
      
      const byType = (type: string) => 
        components.find((c: any) => c.types?.includes(type))?.long_name;

      return {
        formatted: result.formatted_address,
        lat,
        lon,
        province: byType("administrative_area_level_1"),
        amphoe: byType("administrative_area_level_2") || byType("locality"),
        tambon: byType("sublocality_level_1") || byType("administrative_area_level_3"),
        source: "google" as const
      };
    }

    return null;
  } catch (error) {
    console.error("Google reverse geocoding failed:", error);
    throw error;
  }
}

// Real Mapbox reverse geocoding
export async function reverseGeocodeWithMapbox(lat: number, lon: number, accessToken: string): Promise<GeocodeResult | null> {
  try {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json`);
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("language", "th");
    url.searchParams.set("country", "TH");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      throw new Error(`Mapbox Reverse Geocoding API error: ${data.error.message}`);
    }

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const context = feature.context || [];
      
      const first = (type: string) => {
        if (feature.place_type?.includes(type) && feature.text) return feature.text;
        return context.find((c: any) => (c.id || "").startsWith(`${type}.`))?.text;
      };

      return {
        formatted: feature.place_name || "",
        lat,
        lon,
        province: first("region"),
        amphoe: first("district") || first("place"),
        tambon: first("locality") || first("neighborhood"),
        source: "mapbox" as const
      };
    }

    return null;
  } catch (error) {
    console.error("Mapbox reverse geocoding failed:", error);
    throw error;
  }
}

// Real Google Maps geocoding (when API key is available)
export async function geocodeWithGoogle(query: string, apiKey: string): Promise<GeocodeResult[]> {
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query);
    url.searchParams.set("language", "th");
    url.searchParams.set("components", "country:TH");
    url.searchParams.set("region", "TH");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Geocoding API error: ${data.status}`);
    }

    return (data.results || []).map((result: any) => {
      const location = result.geometry.location;
      const components = result.address_components || [];
      
      const byType = (type: string) => 
        components.find((c: any) => c.types?.includes(type))?.long_name;

      return {
        formatted: result.formatted_address,
        lat: location.lat,
        lon: location.lng,
        province: byType("administrative_area_level_1"),
        amphoe: byType("administrative_area_level_2") || byType("locality"),
        tambon: byType("sublocality_level_1") || byType("administrative_area_level_3"),
        source: "google" as const
      };
    });
  } catch (error) {
    console.error("Google geocoding failed:", error);
    // Fallback to mock data
    return geocodeAddress(query);
  }
}

// Real Mapbox geocoding (when access token is available)
export async function geocodeWithMapbox(query: string, accessToken: string): Promise<GeocodeResult[]> {
  try {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("language", "th");
    url.searchParams.set("country", "TH");
    url.searchParams.set("limit", "5");

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      throw new Error(`Mapbox Geocoding API error: ${data.error.message}`);
    }

    return (data.features || []).map((feature: any) => {
      const [lon, lat] = feature.center;
      const context = feature.context || [];
      
      const first = (type: string) => {
        if (feature.place_type?.includes(type) && feature.text) return feature.text;
        return context.find((c: any) => (c.id || "").startsWith(`${type}.`))?.text;
      };

      return {
        formatted: feature.place_name || "",
        lat,
        lon,
        province: first("region"),
        amphoe: first("district") || first("place"),
        tambon: first("locality") || first("neighborhood"),
        source: "mapbox" as const
      };
    });
  } catch (error) {
    console.error("Mapbox geocoding failed:", error);
    // Fallback to mock data
    return geocodeAddress(query);
  }
}
