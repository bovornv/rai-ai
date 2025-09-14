// Offline-first cache system for RaiAI MVP
// Epic 0: Critical polish - Offline-first cache
// Epic 7: Data layer - Local storage

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // maximum number of items
}

class OfflineCache {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { maxAge: 3600000, maxSize: 100 }) {
    this.config = config;
    this.loadFromStorage();
  }

  // Set cache item
  set<T>(key: string, data: T, customMaxAge?: number): void {
    const now = Date.now();
    const maxAge = customMaxAge || this.config.maxAge;
    
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + maxAge
    };

    this.cache.set(key, item);
    this.cleanup();
    this.saveToStorage();
  }

  // Get cache item
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return item.data as T;
  }

  // Check if item exists and is valid
  has(key: string): boolean {
    const item = this.cache.get(key);
    return item ? Date.now() <= item.expiresAt : false;
  }

  // Delete cache item
  delete(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Cleanup expired items
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((item, key) => {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));

    // Enforce max size
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, this.cache.size - this.config.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify(Array.from(this.cache.entries()));
      localStorage.setItem('rai-ai-cache', serialized);
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const serialized = localStorage.getItem('rai-ai-cache');
      if (serialized) {
        const entries = JSON.parse(serialized);
        this.cache = new Map(entries);
        this.cleanup(); // Remove expired items on load
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }
}

// Cache instances for different data types
export const forecastCache = new OfflineCache({ maxAge: 1800000 }); // 30 minutes
export const pricesCache = new OfflineCache({ maxAge: 3600000 }); // 1 hour
export const scansCache = new OfflineCache({ maxAge: 86400000 }); // 24 hours
export const adviceCache = new OfflineCache({ maxAge: 86400000 }); // 24 hours
export const ticketsCache = new OfflineCache({ maxAge: 604800000 }); // 7 days

// Cache keys
export const CACHE_KEYS = {
  FORECAST: 'forecast',
  PRICES: 'prices',
  OUTBREAKS: 'outbreaks',
  SCAN_RESULT: 'scan_result',
  ADVICE: 'advice',
  TICKET: 'ticket',
  USER_PREFERENCES: 'user_preferences'
} as const;

// Cache utilities
export const getCachedData = <T>(cache: OfflineCache, key: string): T | null => {
  return cache.get<T>(key);
};

export const setCachedData = <T>(cache: OfflineCache, key: string, data: T, maxAge?: number): void => {
  cache.set(key, data, maxAge);
};

export const isDataFresh = (cache: OfflineCache, key: string): boolean => {
  return cache.has(key);
};

// Offline status detection
export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
};

// Retry queue for sync jobs
interface RetryJob {
  id: string;
  fn: () => Promise<any>;
  retries: number;
  maxRetries: number;
  delay: number;
  nextRetry: number;
}

class RetryQueue {
  private jobs: Map<string, RetryJob> = new Map();
  private isProcessing = false;

  addJob(id: string, fn: () => Promise<any>, maxRetries = 3, delay = 1000): void {
    const job: RetryJob = {
      id,
      fn,
      retries: 0,
      maxRetries,
      delay,
      nextRetry: Date.now() + delay
    };

    this.jobs.set(id, job);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.jobs.size > 0) {
      const now = Date.now();
      const readyJobs = Array.from(this.jobs.values())
        .filter(job => job.nextRetry <= now);

      for (const job of readyJobs) {
        try {
          await job.fn();
          this.jobs.delete(job.id);
          console.log(`✅ Retry job ${job.id} completed`);
        } catch (error) {
          job.retries++;
          if (job.retries >= job.maxRetries) {
            this.jobs.delete(job.id);
            console.error(`❌ Retry job ${job.id} failed after ${job.maxRetries} attempts:`, error);
          } else {
            job.delay *= 2; // Exponential backoff
            job.nextRetry = now + job.delay;
            console.log(`🔄 Retry job ${job.id} failed, retrying in ${job.delay}ms`);
          }
        }
      }

      // Wait before next iteration
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
  }

  getQueueSize(): number {
    return this.jobs.size;
  }
}

export const retryQueue = new RetryQueue();

// Sync jobs
export const syncForecast = async (): Promise<void> => {
  if (!isOnline()) {
    retryQueue.addJob('sync-forecast', syncForecast);
    return;
  }

  try {
    // Mock API call - replace with actual implementation
    const forecast = await fetch('/api/forecast').then(res => res.json());
    setCachedData(forecastCache, CACHE_KEYS.FORECAST, forecast);
    console.log('✅ Forecast synced');
  } catch (error) {
    console.error('❌ Forecast sync failed:', error);
    throw error;
  }
};

export const syncPrices = async (): Promise<void> => {
  if (!isOnline()) {
    retryQueue.addJob('sync-prices', syncPrices);
    return;
  }

  try {
    // Mock API call - replace with actual implementation
    const prices = await fetch('/api/prices').then(res => res.json());
    setCachedData(pricesCache, CACHE_KEYS.PRICES, prices);
    console.log('✅ Prices synced');
  } catch (error) {
    console.error('❌ Prices sync failed:', error);
    throw error;
  }
};

export const syncOutbreaks = async (): Promise<void> => {
  if (!isOnline()) {
    retryQueue.addJob('sync-outbreaks', syncOutbreaks);
    return;
  }

  try {
    // Mock API call - replace with actual implementation
    const outbreaks = await fetch('/api/outbreaks').then(res => res.json());
    setCachedData(forecastCache, CACHE_KEYS.OUTBREAKS, outbreaks);
    console.log('✅ Outbreaks synced');
  } catch (error) {
    console.error('❌ Outbreaks sync failed:', error);
    throw error;
  }
};

// Initialize offline cache
export const initOfflineCache = (): void => {
  // Start sync jobs when online
  if (isOnline()) {
    syncForecast();
    syncPrices();
    syncOutbreaks();
  }

  // Retry failed jobs when coming back online
  window.addEventListener('online', () => {
    console.log('🌐 Back online, retrying failed sync jobs');
    syncForecast();
    syncPrices();
    syncOutbreaks();
  });

  // Periodic sync when online
  setInterval(() => {
    if (isOnline()) {
      syncForecast();
      syncPrices();
      syncOutbreaks();
    }
  }, 300000); // Every 5 minutes
};
