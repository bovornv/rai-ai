// In-memory storage implementation for weather data
// In production, replace with SQLite/MMKV

import { Forecast, RecentRain } from "../types";
import { ttlMinutesFresh } from "../util/time";

interface CacheEntry {
  data: Forecast;
  timestamp: number;
}

interface RecentRainEntry {
  data: RecentRain;
  timestamp: number;
}

class MemoryStore {
  private forecastCache = new Map<string, CacheEntry>();
  private recentRainCache = new Map<string, RecentRainEntry>();
  private readonly MAX_ENTRIES = 100; // Prevent memory leaks

  async getFresh(geohash5: string, ttlMin: number): Promise<Forecast | null> {
    const entry = this.forecastCache.get(geohash5);
    if (!entry) return null;

    // Check if data is still fresh
    if (!ttlMinutesFresh(entry.data.issuedISO, ttlMin)) {
      this.forecastCache.delete(geohash5);
      return null;
    }

    return entry.data;
  }

  async put(f: Forecast): Promise<void> {
    // Clean up old entries if we're at capacity
    if (this.forecastCache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.forecastCache.keys().next().value;
      this.forecastCache.delete(oldestKey);
    }

    this.forecastCache.set(f.geohash5, {
      data: f,
      timestamp: Date.now()
    });
  }

  async getRecentRain(geohash5: string): Promise<RecentRain | null> {
    const entry = this.recentRainCache.get(geohash5);
    if (!entry) return null;

    // Recent rain data is valid for 6 hours
    if (!ttlMinutesFresh(entry.data.rain_mm_last3h.toString(), 360)) {
      this.recentRainCache.delete(geohash5);
      return null;
    }

    return entry.data;
  }

  async putRecentRain(geohash5: string, r: RecentRain): Promise<void> {
    this.recentRainCache.set(geohash5, {
      data: r,
      timestamp: Date.now()
    });
  }

  // Utility methods for debugging
  getCacheStats() {
    return {
      forecastEntries: this.forecastCache.size,
      recentRainEntries: this.recentRainCache.size,
      oldestForecast: Math.min(...Array.from(this.forecastCache.values()).map(e => e.timestamp)),
      newestForecast: Math.max(...Array.from(this.forecastCache.values()).map(e => e.timestamp))
    };
  }

  clear() {
    this.forecastCache.clear();
    this.recentRainCache.clear();
  }
}

export const memoryStore = new MemoryStore();
