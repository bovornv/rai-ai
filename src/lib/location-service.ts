import { GeohashUtil } from './geohash-util';

export interface LocationResult {
  lat: number;
  lng: number;
  geohash: string;
  accuracy?: number;
}

export class LocationService {
  static async resolveCoarseOnce(): Promise<LocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords;
          const geohash = GeohashUtil.encode(lat, lng, 6); // geohash6 for coarse
          
          resolve({
            lat,
            lng,
            geohash,
            accuracy
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: false, // Coarse location
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  }

  static async resolvePreciseOnce(): Promise<LocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords;
          const geohash = GeohashUtil.encode(lat, lng, 7); // geohash7 for precise
          
          resolve({
            lat,
            lng,
            geohash,
            accuracy
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true, // Precise location
          timeout: 15000,
          maximumAge: 60000 // 1 minute cache
        }
      );
    });
  }

  static getCoarseGeohash(lat: number, lng: number): string {
    return GeohashUtil.encode(lat, lng, 5); // geohash5 for privacy-safe aggregation
  }

  static getDistanceKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    return GeohashUtil.distanceKm(lat1, lng1, lat2, lng2);
  }
}