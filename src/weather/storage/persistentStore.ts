// Persistent storage implementation using IndexedDB
// In production, replace with SQLite/MMKV for mobile apps

import { Forecast, RecentRain } from "../types";
import { ttlMinutesFresh } from "../util/time";

interface CacheEntry {
  data: Forecast;
  timestamp: number;
  geohash5: string;
  issuedISO: string;
}

interface RecentRainEntry {
  data: RecentRain;
  timestamp: number;
  geohash5: string;
}

class PersistentStore {
  private dbName = 'RaiAIWeatherCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private readonly MAX_ENTRIES_PER_GEOHASH = 3; // Keep current + last 2

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Forecast store
        if (!db.objectStoreNames.contains('forecasts')) {
          const forecastStore = db.createObjectStore('forecasts', { keyPath: 'id' });
          forecastStore.createIndex('geohash5', 'geohash5', { unique: false });
          forecastStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Recent rain store
        if (!db.objectStoreNames.contains('recentRain')) {
          const recentRainStore = db.createObjectStore('recentRain', { keyPath: 'id' });
          recentRainStore.createIndex('geohash5', 'geohash5', { unique: true });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  async getFresh(geohash5: string, ttlMin: number): Promise<Forecast | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['forecasts'], 'readonly');
      const store = transaction.objectStore('forecasts');
      const index = store.index('geohash5');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(geohash5);
        
        request.onsuccess = () => {
          const entries: CacheEntry[] = request.result;
          
          // Sort by timestamp (newest first)
          entries.sort((a, b) => b.timestamp - a.timestamp);
          
          // Find the first fresh entry
          for (const entry of entries) {
            if (ttlMinutesFresh(entry.data.issuedISO, ttlMin)) {
              resolve(entry.data);
              return;
            }
          }
          
          resolve(null);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get fresh forecast:', error);
      return null;
    }
  }

  async put(forecast: Forecast): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['forecasts'], 'readwrite');
      const store = transaction.objectStore('forecasts');
      
      const entry: CacheEntry = {
        data: forecast,
        timestamp: Date.now(),
        geohash5: forecast.geohash5,
        issuedISO: forecast.issuedISO
      };
      
      // Store with unique ID
      const id = `weather:${forecast.geohash5}:${forecast.issuedISO}`;
      await this.putWithId(store, id, entry);
      
      // Update latest pointer
      const latestId = `weather:${forecast.geohash5}:latest`;
      await this.putWithId(store, latestId, entry);
      
      // Clean up old entries for this geohash
      await this.cleanupOldEntries(geohash5);
      
    } catch (error) {
      console.error('Failed to store forecast:', error);
    }
  }

  private async putWithId(store: IDBObjectStore, id: string, entry: CacheEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.put({ ...entry, id });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async cleanupOldEntries(geohash5: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['forecasts'], 'readwrite');
      const store = transaction.objectStore('forecasts');
      const index = store.index('geohash5');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(geohash5);
        
        request.onsuccess = () => {
          const entries: CacheEntry[] = request.result;
          
          // Sort by timestamp (newest first)
          entries.sort((a, b) => b.timestamp - a.timestamp);
          
          // Keep only the newest entries
          const toDelete = entries.slice(this.MAX_ENTRIES_PER_GEOHASH);
          
          if (toDelete.length === 0) {
            resolve();
            return;
          }
          
          let deleted = 0;
          toDelete.forEach(entry => {
            const deleteRequest = store.delete(`weather:${entry.geohash5}:${entry.issuedISO}`);
            deleteRequest.onsuccess = () => {
              deleted++;
              if (deleted === toDelete.length) {
                resolve();
              }
            };
            deleteRequest.onerror = () => {
              console.warn('Failed to delete old entry:', entry);
              deleted++;
              if (deleted === toDelete.length) {
                resolve();
              }
            };
          });
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to cleanup old entries:', error);
    }
  }

  async getRecentRain(geohash5: string): Promise<RecentRain | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['recentRain'], 'readonly');
      const store = transaction.objectStore('recentRain');
      
      return new Promise((resolve, reject) => {
        const request = store.get(geohash5);
        
        request.onsuccess = () => {
          const entry: RecentRainEntry | undefined = request.result;
          if (entry && ttlMinutesFresh(entry.timestamp.toString(), 360)) { // 6 hours
            resolve(entry.data);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get recent rain:', error);
      return null;
    }
  }

  async putRecentRain(geohash5: string, rr: RecentRain): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['recentRain'], 'readwrite');
      const store = transaction.objectStore('recentRain');
      
      const entry: RecentRainEntry = {
        data: rr,
        timestamp: Date.now(),
        geohash5
      };
      
      return new Promise((resolve, reject) => {
        const request = store.put({ ...entry, id: geohash5 });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to store recent rain:', error);
    }
  }

  // Utility methods for debugging and maintenance
  async getCacheStats() {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['forecasts', 'recentRain'], 'readonly');
      
      const forecastCount = await this.getStoreCount(transaction.objectStore('forecasts'));
      const recentRainCount = await this.getStoreCount(transaction.objectStore('recentRain'));
      
      return {
        forecastEntries: forecastCount,
        recentRainEntries: recentRainCount,
        maxEntriesPerGeohash: this.MAX_ENTRIES_PER_GEOHASH
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { forecastEntries: 0, recentRainEntries: 0, maxEntriesPerGeohash: 0 };
    }
  }

  private async getStoreCount(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['forecasts', 'recentRain'], 'readwrite');
      
      await Promise.all([
        this.clearStore(transaction.objectStore('forecasts')),
        this.clearStore(transaction.objectStore('recentRain'))
      ]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  private async clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const persistentStore = new PersistentStore();
