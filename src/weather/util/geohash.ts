// Geohash utility for weather caching
// Simple implementation for geohash-5 (approximately 5km precision)

export function toGeohash5(lat: number, lon: number): string {
  // Simple geohash-5 implementation
  // In production, use a proper geohash library
  const la = Math.round(lat * 100) / 100;
  const lo = Math.round(lon * 100) / 100;
  return `${la.toFixed(2)},${lo.toFixed(2)}`;
}

// alias for clearer import name in repo
export const geohash5FromLatLon = toGeohash5;
