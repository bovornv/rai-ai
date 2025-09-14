// App initialization service - ties all services together
import { initializeWeatherStore } from '@/weather';
import { remoteConfigService } from './remoteConfigService';
import { backgroundSyncService } from './backgroundSyncService';
import { analyticsService } from './analyticsService';
import { locationService } from './locationService';

export interface InitializationStatus {
  weatherStore: boolean;
  remoteConfig: boolean;
  backgroundSync: boolean;
  analytics: boolean;
  location: boolean;
  errors: string[];
}

class AppInitializationService {
  private status: InitializationStatus = {
    weatherStore: false,
    remoteConfig: false,
    backgroundSync: false,
    analytics: false,
    location: false,
    errors: []
  };

  async initialize(): Promise<InitializationStatus> {
    console.log('🚀 Initializing RaiAI app...');
    
    try {
      // Initialize services in parallel where possible
      await Promise.allSettled([
        this.initializeWeatherStore(),
        this.initializeRemoteConfig(),
        this.initializeAnalytics(),
        this.initializeLocation()
      ]);

      // Initialize background sync after other services are ready
      await this.initializeBackgroundSync();

      console.log('✅ App initialization completed');
      this.logInitializationStatus();
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.status.errors.push(error.message);
    }

    return this.status;
  }

  private async initializeWeatherStore(): Promise<void> {
    try {
      await initializeWeatherStore();
      this.status.weatherStore = true;
      console.log('✅ Weather store initialized');
    } catch (error) {
      console.error('❌ Weather store initialization failed:', error);
      this.status.errors.push(`Weather store: ${error.message}`);
    }
  }

  private async initializeRemoteConfig(): Promise<void> {
    try {
      await remoteConfigService.initialize();
      this.status.remoteConfig = true;
      console.log('✅ Remote config initialized');
    } catch (error) {
      console.error('❌ Remote config initialization failed:', error);
      this.status.errors.push(`Remote config: ${error.message}`);
    }
  }

  private async initializeBackgroundSync(): Promise<void> {
    try {
      await backgroundSyncService.initialize();
      this.status.backgroundSync = true;
      console.log('✅ Background sync initialized');
    } catch (error) {
      console.error('❌ Background sync initialization failed:', error);
      this.status.errors.push(`Background sync: ${error.message}`);
    }
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      // Analytics service initializes itself
      this.status.analytics = true;
      analyticsService.trackAppStart();
      console.log('✅ Analytics initialized');
    } catch (error) {
      console.error('❌ Analytics initialization failed:', error);
      this.status.errors.push(`Analytics: ${error.message}`);
    }
  }

  private async initializeLocation(): Promise<void> {
    try {
      // Location service initializes itself
      this.status.location = true;
      console.log('✅ Location service initialized');
    } catch (error) {
      console.error('❌ Location service initialization failed:', error);
      this.status.errors.push(`Location: ${error.message}`);
    }
  }

  private logInitializationStatus(): void {
    const successCount = Object.values(this.status).filter(v => v === true).length - 1; // -1 for errors array
    const totalServices = 5;
    
    console.log(`📊 Initialization Status: ${successCount}/${totalServices} services ready`);
    
    if (this.status.errors.length > 0) {
      console.warn('⚠️ Initialization errors:', this.status.errors);
    }
  }

  getStatus(): InitializationStatus {
    return { ...this.status };
  }

  // Check if app is ready for use
  isReady(): boolean {
    return this.status.weatherStore && this.status.remoteConfig;
  }

  // Get initialization summary for debugging
  getSummary() {
    return {
      ...this.status,
      ready: this.isReady(),
      timestamp: new Date().toISOString()
    };
  }
}

export const appInitializationService = new AppInitializationService();
