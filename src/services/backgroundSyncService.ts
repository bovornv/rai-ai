// Background sync service for offline-first experience
import { getForecast, getForecastCached, initializeWeatherStore } from '@/weather';
import { getWeatherConfig } from '@/config/weather';
import { locationService } from './locationService';
import { type LatLon, type WeatherKeys } from '@/weather/types';

interface SyncState {
  isRunning: boolean;
  lastSync: number | null;
  failures: number;
  nextRetry: number | null;
}

interface SyncConfig {
  intervalMs: number;
  maxFailures: number;
  retryBackoffMs: number[];
  networkUnmetered: boolean;
}

class BackgroundSyncService {
  private state: SyncState = {
    isRunning: false,
    lastSync: null,
    failures: 0,
    nextRetry: null
  };

  private config: SyncConfig = {
    intervalMs: 60 * 60 * 1000, // 60 minutes
    maxFailures: 3,
    retryBackoffMs: [1000, 3000, 7000], // 1s, 3s, 7s
    networkUnmetered: true
  };

  private syncTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private isOnline = true;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.logEvent('network_online');
      this.scheduleSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.logEvent('network_offline');
      this.cancelSync();
    });

    // Visibility change (app foreground/background)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.logEvent('app_foreground');
        this.scheduleSync();
      }
    });

    // Page load
    window.addEventListener('load', () => {
      this.initialize();
    });
  }

  async initialize(): Promise<void> {
    try {
      await initializeWeatherStore();
      this.logEvent('sync_service_initialized');
      
      // Check if we need to sync immediately
      const shouldSync = this.shouldSyncNow();
      if (shouldSync && this.isOnline) {
        this.scheduleSync();
      } else {
        this.scheduleNextSync();
      }
    } catch (error) {
      console.error('Failed to initialize background sync:', error);
      this.logEvent('sync_initialization_failed', { error: error.message });
    }
  }

  private shouldSyncNow(): boolean {
    if (!this.state.lastSync) return true;
    
    const timeSinceLastSync = Date.now() - this.state.lastSync;
    const ttlMs = getWeatherConfig().TTL_MINUTES * 60 * 1000;
    
    return timeSinceLastSync > ttlMs;
  }

  private scheduleSync(): void {
    if (this.state.isRunning) return;
    
    this.cancelTimers();
    
    if (this.state.nextRetry && Date.now() < this.state.nextRetry) {
      // Schedule retry
      const delay = this.state.nextRetry - Date.now();
      this.retryTimer = setTimeout(() => this.performSync(), delay);
    } else {
      // Schedule immediate sync
      this.syncTimer = setTimeout(() => this.performSync(), 1000);
    }
  }

  private scheduleNextSync(): void {
    this.cancelTimers();
    this.syncTimer = setTimeout(() => this.performSync(), this.config.intervalMs);
  }

  private cancelSync(): void {
    this.cancelTimers();
  }

  private cancelTimers(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private async performSync(): Promise<void> {
    if (this.state.isRunning || !this.isOnline) return;

    this.state.isRunning = true;
    this.logEvent('sync_started');

    try {
      const location = await locationService.getCurrentLocation();
      if (!location) {
        throw new Error('No location available');
      }

      const latlon: LatLon = { lat: location.lat, lon: location.lon };
      const keys: WeatherKeys = {
        MS_API_KEY: getWeatherConfig().MS_API_KEY,
        OWM_API_KEY: getWeatherConfig().OWM_API_KEY
      };

      // Try to fetch fresh data
      const forecast = await getForecast(latlon, keys);
      
      // Update recent rain data
      const recentRain = { rain_mm_last3h: 0 }; // Simplified for now
      
      this.state.lastSync = Date.now();
      this.state.failures = 0;
      this.state.nextRetry = null;

      this.logEvent('sync_success', {
        source: forecast.source,
        geohash5: forecast.geohash5,
        hours: forecast.hourly.length
      });

    } catch (error) {
      this.handleSyncFailure(error);
    } finally {
      this.state.isRunning = false;
      this.scheduleNextSync();
    }
  }

  private handleSyncFailure(error: any): void {
    this.state.failures++;
    this.logEvent('sync_failure', {
      error: error.message,
      failures: this.state.failures
    });

    if (this.state.failures >= this.config.maxFailures) {
      // Circuit breaker: stop trying
      this.logEvent('sync_circuit_breaker_activated');
      this.state.nextRetry = null;
      return;
    }

    // Schedule retry with exponential backoff
    const backoffIndex = Math.min(this.state.failures - 1, this.config.retryBackoffMs.length - 1);
    const backoffMs = this.config.retryBackoffMs[backoffIndex];
    this.state.nextRetry = Date.now() + backoffMs;

    this.logEvent('sync_retry_scheduled', {
      backoffMs,
      nextRetry: new Date(this.state.nextRetry).toISOString()
    });
  }

  // Force sync (for manual refresh)
  async forceSync(): Promise<boolean> {
    if (this.state.isRunning) return false;
    
    this.cancelTimers();
    await this.performSync();
    return this.state.failures === 0;
  }

  // Get sync status
  getStatus() {
    return {
      ...this.state,
      isOnline: this.isOnline,
      nextSync: this.syncTimer ? Date.now() + this.config.intervalMs : null
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logEvent('sync_config_updated', newConfig);
  }

  // Log events for analytics
  private logEvent(event: string, data?: any): void {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    console.log('📊 Background Sync Event:', logData);
    
    // In production, send to analytics service
    // analytics.track(event, logData);
  }

  // Cleanup
  destroy(): void {
    this.cancelTimers();
    this.state.isRunning = false;
  }
}

export const backgroundSyncService = new BackgroundSyncService();
