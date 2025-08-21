const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export class GeohashUtil {
  static encode(lat: number, lng: number, precision: number = 12): string {
    let idx = 0;
    let bit = 0;
    let evenBit = true;
    let geohash = '';

    let latMin = -90, latMax = 90;
    let lngMin = -180, lngMax = 180;

    while (geohash.length < precision) {
      if (evenBit) {
        // longitude
        const lngMid = (lngMin + lngMax) / 2;
        if (lng >= lngMid) {
          idx = (idx << 1) + 1;
          lngMin = lngMid;
        } else {
          idx = idx << 1;
          lngMax = lngMid;
        }
      } else {
        // latitude
        const latMid = (latMin + latMax) / 2;
        if (lat >= latMid) {
          idx = (idx << 1) + 1;
          latMin = latMid;
        } else {
          idx = idx << 1;
          latMax = latMid;
        }
      }

      evenBit = !evenBit;

      if (++bit === 5) {
        geohash += BASE32[idx];
        bit = 0;
        idx = 0;
      }
    }

    return geohash;
  }

  static decode(geohash: string): { lat: number; lng: number } {
    let evenBit = true;
    let latMin = -90, latMax = 90;
    let lngMin = -180, lngMax = 180;

    for (let i = 0; i < geohash.length; i++) {
      const c = geohash[i];
      const cd = BASE32.indexOf(c);
      
      for (let j = 4; j >= 0; j--) {
        const bit = (cd >> j) & 1;
        
        if (evenBit) {
          // longitude
          const lngMid = (lngMin + lngMax) / 2;
          if (bit === 1) {
            lngMin = lngMid;
          } else {
            lngMax = lngMid;
          }
        } else {
          // latitude
          const latMid = (latMin + latMax) / 2;
          if (bit === 1) {
            latMin = latMid;
          } else {
            latMax = latMid;
          }
        }
        
        evenBit = !evenBit;
      }
    }

    return {
      lat: (latMin + latMax) / 2,
      lng: (lngMin + lngMax) / 2
    };
  }

  static distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static geohashDifference(hash1: string, hash2: string): number {
    let commonLength = 0;
    const minLength = Math.min(hash1.length, hash2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (hash1[i] === hash2[i]) {
        commonLength++;
      } else {
        break;
      }
    }
    
    return commonLength;
  }
}