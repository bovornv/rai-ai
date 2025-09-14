// Remote configuration service for customizable thresholds
import { type SprayProfile } from '@/weather/sprayWindow';

export interface RemoteConfig {
  spray: {
    rice: Partial<SprayProfile>;
    durian: Partial<SprayProfile>;
  };
  weather: {
    TTL_MINUTES: number;
    THROTTLE_MINUTES: number;
    USE_FALLBACK: boolean;
  };
  features: {
    background_sync_enabled: boolean;
    location_permission_required: boolean;
    analytics_enabled: boolean;
  };
}

export interface ConfigUpdate {
  timestamp: number;
  version: string;
  config: RemoteConfig;
}

class RemoteConfigService {
  private config: RemoteConfig | null = null;
  private lastUpdate: number = 0;
  private readonly CACHE_KEY = 'rai_ai_remote_config';
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CONFIG_URL = '/api/config'; // In production, use actual remote config endpoint

  // Default configuration
  private readonly defaultConfig: RemoteConfig = {
    spray: {
      rice: {
        WIND_OK_MS: 4.0,
        WIND_CAUTION_MS: 6.0,
        POP_HIGH: 0.6,
        POP_MED: 0.3,
        RAIN_SOON_MM: 0.5,
        RAIN_NOW_MM: 0.1,
        RECENT_WET_MM: 1.0,
        RH_WET: 90,
        DRY_BUFFER_H: 2,
        HORIZON_HOURS: 12
      },
      durian: {
        WIND_OK_MS: 3.5,
        WIND_CAUTION_MS: 5.5,
        POP_HIGH: 0.6,
        POP_MED: 0.3,
        RAIN_SOON_MM: 0.5,
        RAIN_NOW_MM: 0.1,
        RECENT_WET_MM: 1.0,
        RH_WET: 90,
        DRY_BUFFER_H: 2,
        HORIZON_HOURS: 12
      }
    },
    weather: {
      TTL_MINUTES: 60,
      THROTTLE_MINUTES: 30,
      USE_FALLBACK: true
    },
    features: {
      background_sync_enabled: true,
      location_permission_required: true,
      analytics_enabled: true
    }
  };

  async initialize(): Promise<void> {
    try {
      // Try to load from cache first
      const cached = this.loadFromCache();
      if (cached && this.isCacheValid(cached)) {
        this.config = cached.config;
        this.lastUpdate = cached.timestamp;
        console.log('✅ Remote config loaded from cache');
        return;
      }

      // Try to fetch from remote
      await this.fetchFromRemote();
    } catch (error) {
      console.warn('⚠️ Failed to load remote config, using defaults:', error);
      this.config = this.defaultConfig;
    }
  }

  private async fetchFromRemote(): Promise<void> {
    try {
      // In production, this would be a real API call
      // For now, we'll simulate a remote config fetch
      const mockConfig: ConfigUpdate = {
        timestamp: Date.now(),
        version: '1.0.0',
        config: {
          ...this.defaultConfig,
          // Example of remote overrides
          spray: {
            rice: {
              ...this.defaultConfig.spray.rice,
              WIND_OK_MS: 3.8, // Slightly more conservative
              WIND_CAUTION_MS: 5.8
            },
            durian: {
              ...this.defaultConfig.spray.durian,
              WIND_OK_MS: 3.2, // Even more conservative for durian
              WIND_CAUTION_MS: 5.2
            }
          }
        }
      };

      this.config = mockConfig.config;
      this.lastUpdate = mockConfig.timestamp;
      
      // Cache the config
      this.saveToCache(mockConfig);
      
      console.log('✅ Remote config fetched and cached');
    } catch (error) {
      throw new Error(`Failed to fetch remote config: ${error.message}`);
    }
  }

  getSprayProfile(crop: 'rice' | 'durian'): SprayProfile {
    if (!this.config) {
      return crop === 'rice' ? this.defaultConfig.spray.rice : this.defaultConfig.spray.durian;
    }

    const baseProfile = crop === 'rice' ? this.defaultConfig.spray.rice : this.defaultConfig.spray.durian;
    const remoteProfile = this.config.spray[crop];
    
    // Merge with bounds checking
    return this.mergeWithBounds(baseProfile, remoteProfile);
  }

  private mergeWithBounds(base: SprayProfile, remote: Partial<SprayProfile>): SprayProfile {
    const merged = { ...base, ...remote };
    
    // Apply bounds checking
    return {
      WIND_OK_MS: this.clamp(merged.WIND_OK_MS, 0, 20),
      WIND_CAUTION_MS: this.clamp(merged.WIND_CAUTION_MS, 0, 25),
      POP_HIGH: this.clamp(merged.POP_HIGH, 0, 1),
      POP_MED: this.clamp(merged.POP_MED, 0, 1),
      RAIN_SOON_MM: this.clamp(merged.RAIN_SOON_MM, 0, 10),
      RAIN_NOW_MM: this.clamp(merged.RAIN_NOW_MM, 0, 5),
      RECENT_WET_MM: this.clamp(merged.RECENT_WET_MM, 0, 10),
      RH_WET: this.clamp(merged.RH_WET, 0, 100),
      DRY_BUFFER_H: this.clamp(merged.DRY_BUFFER_H, 1, 6),
      HORIZON_HOURS: this.clamp(merged.HORIZON_HOURS, 6, 24)
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  getWeatherConfig() {
    if (!this.config) return this.defaultConfig.weather;
    return { ...this.defaultConfig.weather, ...this.config.weather };
  }

  getFeatureFlag(flag: keyof RemoteConfig['features']): boolean {
    if (!this.config) return this.defaultConfig.features[flag];
    return this.config.features[flag];
  }

  getConfig(): RemoteConfig | null {
    return this.config;
  }

  getLastUpdate(): number {
    return this.lastUpdate;
  }

  // Force refresh from remote
  async refresh(): Promise<void> {
    try {
      await this.fetchFromRemote();
      console.log('✅ Remote config refreshed');
    } catch (error) {
      console.warn('⚠️ Failed to refresh remote config:', error);
    }
  }

  // Cache management
  private loadFromCache(): ConfigUpdate | null {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        return JSON.parse(stored) as ConfigUpdate;
      }
    } catch (error) {
      console.warn('Failed to load config from cache:', error);
    }
    return null;
  }

  private saveToCache(config: ConfigUpdate): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save config to cache:', error);
    }
  }

  private isCacheValid(cached: ConfigUpdate): boolean {
    const age = Date.now() - cached.timestamp;
    return age < this.CACHE_TTL;
  }

  // Clear cache (for testing)
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    this.config = null;
    this.lastUpdate = 0;
  }
}

export const remoteConfigService = new RemoteConfigService();
