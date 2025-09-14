// Location service with permissions and manual fallback
import { LatLon } from '@/weather/types';
import { geocodeWithFallback, reverseWithFallback } from '@/lib/location-service-fallback';

export interface LocationPermissionState {
  granted: boolean;
  denied: boolean;
  unavailable: boolean;
  error?: string;
}

export interface LocationData {
  lat: number;
  lon: number;
  accuracy?: number;
  timestamp: number;
  source: 'gps' | 'manual' | 'default';
}

export interface ThaiProvince {
  id: string;
  name: string;
  nameEn: string;
  center: LatLon;
  amphoes: ThaiAmphoe[];
}

export interface ThaiAmphoe {
  id: string;
  name: string;
  nameEn: string;
  center: LatLon;
  provinceId: string;
}

class LocationService {
  private currentLocation: LocationData | null = null;
  private permissionState: LocationPermissionState = {
    granted: false,
    denied: false,
    unavailable: false
  };

  // Thai provinces and amphoes data
  private provinces: ThaiProvince[] = [
    {
      id: 'bangkok',
      name: 'กรุงเทพมหานคร',
      nameEn: 'Bangkok',
      center: { lat: 13.7563, lon: 100.5018 },
      amphoes: [
        { id: 'bangkok_center', name: 'เขตกลาง', nameEn: 'Central', center: { lat: 13.7563, lon: 100.5018 }, provinceId: 'bangkok' },
        { id: 'bangkok_north', name: 'เขตเหนือ', nameEn: 'North', center: { lat: 13.8767, lon: 100.5018 }, provinceId: 'bangkok' }
      ]
    },
    {
      id: 'chiang_mai',
      name: 'เชียงใหม่',
      nameEn: 'Chiang Mai',
      center: { lat: 18.7883, lon: 98.9853 },
      amphoes: [
        { id: 'chiang_mai_city', name: 'เมืองเชียงใหม่', nameEn: 'Chiang Mai City', center: { lat: 18.7883, lon: 98.9853 }, provinceId: 'chiang_mai' }
      ]
    },
    {
      id: 'phitsanulok',
      name: 'พิษณุโลก',
      nameEn: 'Phitsanulok',
      center: { lat: 16.8211, lon: 100.2659 },
      amphoes: [
        { id: 'phitsanulok_city', name: 'เมืองพิษณุโลก', nameEn: 'Phitsanulok City', center: { lat: 16.8211, lon: 100.2659 }, provinceId: 'phitsanulok' }
      ]
    },
    {
      id: 'khon_kaen',
      name: 'ขอนแก่น',
      nameEn: 'Khon Kaen',
      center: { lat: 16.4419, lon: 102.8358 },
      amphoes: [
        { id: 'khon_kaen_city', name: 'เมืองขอนแก่น', nameEn: 'Khon Kaen City', center: { lat: 16.4419, lon: 102.8358 }, provinceId: 'khon_kaen' }
      ]
    },
    {
      id: 'nakhon_ratchasima',
      name: 'นครราชสีมา',
      nameEn: 'Nakhon Ratchasima',
      center: { lat: 14.9799, lon: 102.0978 },
      amphoes: [
        { id: 'nakhon_ratchasima_city', name: 'เมืองนครราชสีมา', nameEn: 'Nakhon Ratchasima City', center: { lat: 14.9799, lon: 102.0978 }, provinceId: 'nakhon_ratchasima' }
      ]
    }
  ];

  async requestLocationPermission(): Promise<LocationPermissionState> {
    if (!navigator.geolocation) {
      this.permissionState = {
        granted: false,
        denied: false,
        unavailable: true,
        error: 'Geolocation not supported'
      };
      return this.permissionState;
    }

    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: false, // Use coarse location
        timeout: 10000, // 10 seconds
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            source: 'gps'
          };

          this.permissionState = {
            granted: true,
            denied: false,
            unavailable: false
          };

          // Store location in localStorage
          this.saveLocationToStorage(this.currentLocation);
          resolve(this.permissionState);
        },
        (error) => {
          let errorMessage = 'Unknown error';
          let denied = false;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              denied = true;
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timeout';
              break;
          }

          this.permissionState = {
            granted: false,
            denied,
            unavailable: !denied,
            error: errorMessage
          };

          resolve(this.permissionState);
        },
        options
      );
    });
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    // Try to get from memory first
    if (this.currentLocation) {
      return this.currentLocation;
    }

    // Try to load from storage
    const stored = this.loadLocationFromStorage();
    if (stored) {
      this.currentLocation = stored;
      return stored;
    }

    // Try to get fresh location if permission granted
    if (this.permissionState.granted) {
      try {
        const permission = await this.requestLocationPermission();
        if (permission.granted && this.currentLocation) {
          return this.currentLocation;
        }
      } catch (error) {
        console.warn('Failed to get current location:', error);
      }
    }

    return null;
  }

  // New method: Get location with geocoding
  async getLocationWithGeocoding(address: string): Promise<LocationData | null> {
    try {
      const API_KEYS = {
        GOOGLE_MAPS_API_KEY: "AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k",
        MAPBOX_ACCESS_TOKEN: "pk.eyJ1IjoiYm92b3JuIiwiYSI6ImNtZjl3ZWY3dzA3Ym8ycm9lbTQzcmo5ankifQ.LvMa5fl8cpeXL8Za5Vroug"
      };

      const results = await geocodeWithFallback(address, API_KEYS);

      if (results.length > 0) {
        const result = results[0];
        const locationData: LocationData = {
          lat: result.lat,
          lon: result.lon,
          timestamp: Date.now(),
          source: 'manual'
        };
        
        this.currentLocation = locationData;
        this.saveLocationToStorage(locationData);
        return locationData;
      }
    } catch (error) {
      console.warn('Geocoding failed:', error);
    }

    return null;
  }

  // New method: Get address from coordinates
  async getAddressFromCoordinates(lat: number, lon: number): Promise<string | null> {
    try {
      const API_KEYS = {
        GOOGLE_MAPS_API_KEY: "AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k",
        MAPBOX_ACCESS_TOKEN: "pk.eyJ1IjoiYm92b3JuIiwiYSI6ImNtZjl3ZWY3dzA3Ym8ycm9lbTQzcmo5ankifQ.LvMa5fl8cpeXL8Za5Vroug"
      };

      const results = await reverseWithFallback(lat, lon, API_KEYS);

      if (results.length > 0) {
        return results[0].formatted;
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }

    return null;
  }

  setManualLocation(lat: number, lon: number, source: 'manual' = 'manual'): void {
    this.currentLocation = {
      lat,
      lon,
      timestamp: Date.now(),
      source
    };
    this.saveLocationToStorage(this.currentLocation);
  }

  getProvinces(): ThaiProvince[] {
    return this.provinces;
  }

  getAmphoes(provinceId: string): ThaiAmphoe[] {
    const province = this.provinces.find(p => p.id === provinceId);
    return province?.amphoes || [];
  }

  getLocationForAmphoe(amphoeId: string): LatLon | null {
    for (const province of this.provinces) {
      const amphoe = province.amphoes.find(a => a.id === amphoeId);
      if (amphoe) {
        return amphoe.center;
      }
    }
    return null;
  }

  getLocationForProvince(provinceId: string): LatLon | null {
    const province = this.provinces.find(p => p.id === provinceId);
    return province?.center || null;
  }

  getPermissionState(): LocationPermissionState {
    return { ...this.permissionState };
  }

  private saveLocationToStorage(location: LocationData): void {
    try {
      localStorage.setItem('rai_ai_location', JSON.stringify(location));
    } catch (error) {
      console.warn('Failed to save location to storage:', error);
    }
  }

  private loadLocationFromStorage(): LocationData | null {
    try {
      const stored = localStorage.getItem('rai_ai_location');
      if (stored) {
        const location = JSON.parse(stored) as LocationData;
        // Check if location is not too old (24 hours)
        if (Date.now() - location.timestamp < 24 * 60 * 60 * 1000) {
          return location;
        }
      }
    } catch (error) {
      console.warn('Failed to load location from storage:', error);
    }
    return null;
  }

  // Reset location and permissions (for testing)
  reset(): void {
    this.currentLocation = null;
    this.permissionState = {
      granted: false,
      denied: false,
      unavailable: false
    };
    localStorage.removeItem('rai_ai_location');
  }
}

export const locationService = new LocationService();
