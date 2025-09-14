// Weather service for RaiAI MVP
// Epic 1: Today tab - Spray window with 12h rain/wind data
// Enhanced with comprehensive spray window decision logic

import { 
  computeSprayBadge, 
  getForecastCached, 
  getRecentRainCachedOrZero,
  type LatLon, 
  type WeatherKeys,
  type SprayVerdict,
  type Forecast
} from '@/weather';
import { getWeatherConfig } from '@/config/weather';

export type CropType = 'rice' | 'durian';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  rainProbability: number;
  rainAmount: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  timestamp: number;
}

export interface SprayWindowData {
  status: 'good' | 'caution' | 'stop';
  reason: string;
  nextGoodWindow?: Date;
  windSpeed: number;
  rainProbability: number;
  temperature: number;
  humidity: number;
  recommendation: string;
  verdict?: SprayVerdict;  // Enhanced verdict
}

class WeatherService {
  private cache: Map<string, WeatherData> = new Map();
  private sprayWindowCache: Map<string, SprayWindowData> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private config = getWeatherConfig();

  // Get weather data for location
  async getWeatherData(lat: number, lng: number): Promise<WeatherData> {
    const cacheKey = `${lat},${lng}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Mock weather API - replace with actual weather service
      const weatherData: WeatherData = {
        temperature: 28 + Math.random() * 5, // 28-33°C
        humidity: 60 + Math.random() * 20, // 60-80%
        windSpeed: Math.random() * 15, // 0-15 km/h
        windDirection: this.getRandomWindDirection(),
        rainProbability: Math.random() * 100, // 0-100%
        rainAmount: Math.random() * 5, // 0-5mm
        pressure: 1010 + Math.random() * 20, // 1010-1030 hPa
        visibility: 8 + Math.random() * 2, // 8-10 km
        uvIndex: 5 + Math.random() * 5, // 5-10
        timestamp: Date.now()
      };

      this.cache.set(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      throw error;
    }
  }

  // Get spray window recommendation with enhanced decision logic
  async getSprayWindow(lat: number, lng: number, crop: CropType = 'rice'): Promise<SprayWindowData> {
    const cacheKey = `spray_${lat},${lng}_${crop}`;
    const cached = this.sprayWindowCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Use new weather service
      const latlon: LatLon = { lat, lon: lng };
      const keys: WeatherKeys = {
        MS_API_KEY: this.config.MS_API_KEY,
        OWM_API_KEY: this.config.OWM_API_KEY
      };

      const verdict = await computeSprayBadge(
        { lat, lon: lng, crop, fallbackArea: this.config.DEFAULT_LOCATION },
        keys
      );

      // Get current weather data for display
      const forecast = await getForecastCached(latlon, keys);
      const currentHour = forecast.hourly[0];
      
      const sprayWindow = this.convertVerdictToSprayWindow(verdict, currentHour);
      
      this.sprayWindowCache.set(cacheKey, sprayWindow);
      return sprayWindow;
    } catch (error) {
      console.error('Failed to get spray window:', error);
      // Fallback to basic weather data
      const weather = await this.getWeatherData(lat, lng);
      const sprayWindow = this.calculateSprayWindow(weather);
      return sprayWindow;
    }
  }

  // Helper methods for legacy compatibility

  // Convert verdict to legacy SprayWindowData format
  private convertVerdictToSprayWindow(verdict: SprayVerdict, currentHour: any): SprayWindowData {
    const statusMap = {
      'GOOD': 'good' as const,
      'CAUTION': 'caution' as const,
      'DON\'T': 'stop' as const
    };

    return {
      status: statusMap[verdict.level],
      reason: verdict.reason_th,
      windSpeed: (currentHour?.wind_ms ?? 0) * 3.6, // Convert m/s to km/h
      rainProbability: (currentHour?.pop ?? 0) * 100, // Convert to percentage
      temperature: currentHour?.temp_c ?? 25,
      humidity: currentHour?.rh ?? 60,
      recommendation: verdict.reason_th,
      verdict: verdict
    };
  }

  // Calculate spray window based on weather conditions
  private calculateSprayWindow(weather: WeatherData): SprayWindowData {
    const { windSpeed, rainProbability, temperature, humidity } = weather;
    
    // Spray window logic
    if (rainProbability > 30) {
      return {
        status: 'stop',
        reason: 'ฝนใกล้มา',
        windSpeed,
        rainProbability,
        temperature,
        humidity,
        recommendation: 'หลีกเลี่ยงการฉีดพ่นวันนี้ เนื่องจากมีโอกาสฝนตก'
      };
    }
    
    if (windSpeed > 10) {
      return {
        status: 'stop',
        reason: 'ลมแรง',
        windSpeed,
        rainProbability,
        temperature,
        humidity,
        recommendation: 'ลมแรงเกินไป ควรเลื่อนการฉีดพ่นออกไป'
      };
    }
    
    if (windSpeed > 5 || rainProbability > 15) {
      return {
        status: 'caution',
        reason: 'ลมปานกลาง',
        windSpeed,
        rainProbability,
        temperature,
        humidity,
        recommendation: 'ระวังการฉีดพ่น ควรฉีดในช่วงเช้าหรือเย็น'
      };
    }
    
    if (temperature > 35 || humidity < 40) {
      return {
        status: 'caution',
        reason: 'อากาศร้อนหรือแห้ง',
        windSpeed,
        rainProbability,
        temperature,
        humidity,
        recommendation: 'อากาศร้อนหรือแห้ง ควรฉีดในช่วงเช้าหรือเย็น'
      };
    }
    
    return {
      status: 'good',
      reason: 'สภาพอากาศเหมาะสม',
      windSpeed,
      rainProbability,
      temperature,
      humidity,
      recommendation: 'สภาพอากาศเหมาะสมสำหรับการฉีดพ่น'
    };
  }

  // Get random wind direction
  private getRandomWindDirection(): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  // Get 12-hour forecast data using new weather service
  async get12HourForecastData(lat: number, lng: number): Promise<Forecast> {
    try {
      const latlon: LatLon = { lat, lon: lng };
      const keys: WeatherKeys = {
        MS_API_KEY: this.config.MS_API_KEY,
        OWM_API_KEY: this.config.OWM_API_KEY
      };

      const forecast = await getForecastCached(latlon, keys);
      const recent = await getRecentRainCachedOrZero(latlon);

      // Convert to legacy format for compatibility
      return {
        hours: forecast.hourly,
        recent
      };
    } catch (error) {
      console.error('Failed to fetch forecast data:', error);
      throw error;
    }
  }

  // Get 12-hour forecast (legacy format)
  async get12HourForecast(lat: number, lng: number): Promise<WeatherData[]> {
    const forecast: WeatherData[] = [];
    const baseWeather = await this.getWeatherData(lat, lng);
    
    for (let i = 0; i < 12; i++) {
      const hourWeather: WeatherData = {
        ...baseWeather,
        temperature: baseWeather.temperature + (Math.random() - 0.5) * 4,
        windSpeed: Math.max(0, baseWeather.windSpeed + (Math.random() - 0.5) * 5),
        rainProbability: Math.max(0, Math.min(100, baseWeather.rainProbability + (Math.random() - 0.5) * 20)),
        timestamp: Date.now() + (i * 60 * 60 * 1000)
      };
      forecast.push(hourWeather);
    }
    
    return forecast;
  }

  // Legacy API mappers moved to weather service

  // Get next good spray window
  async getNextGoodSprayWindow(lat: number, lng: number): Promise<Date | null> {
    const forecast = await this.get12HourForecast(lat, lng);
    
    for (const weather of forecast) {
      const sprayWindow = this.calculateSprayWindow(weather);
      if (sprayWindow.status === 'good') {
        return new Date(weather.timestamp);
      }
    }
    
    return null;
  }
}

// Singleton instance
export const weatherService = new WeatherService();

// Convenience functions
export const getSprayWindow = (lat: number, lng: number, crop: CropType = 'rice'): Promise<SprayWindowData> => {
  return weatherService.getSprayWindow(lat, lng, crop);
};

export const getWeatherData = (lat: number, lng: number): Promise<WeatherData> => {
  return weatherService.getWeatherData(lat, lng);
};

export const get12HourForecast = (lat: number, lng: number): Promise<WeatherData[]> => {
  return weatherService.get12HourForecast(lat, lng);
};

export const get12HourForecastData = (lat: number, lng: number): Promise<Forecast> => {
  return weatherService.get12HourForecastData(lat, lng);
};

// Unit tests for spray window decision logic
export const sprayWindowTests = {
  // Test case: Recent rain should return DON'T
  testRecentRain: () => {
    const forecast: Forecast = {
      hours: Array(12).fill(0).map((_, i) => ({
        time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        rain_mm: 0,
        pop: 0,
        wind_ms: 2,
        temp_c: 25,
        rh: 60
      })),
      recent: { rain_mm_last3h: 1.5 } // Recent rain
    };
    
    const service = new WeatherService();
    const verdict = (service as any).sprayWindowDecision(forecast, 'rice');
    return verdict.level === "DON'T" && verdict.reason_th.includes("ใบยังเปียก");
  },

  // Test case: High wind should return DON'T
  testHighWind: () => {
    const forecast: Forecast = {
      hours: Array(12).fill(0).map((_, i) => ({
        time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        rain_mm: 0,
        pop: 0,
        wind_ms: i < 3 ? 7.0 : 2.0, // High wind in next 3h
        temp_c: 25,
        rh: 60
      })),
      recent: { rain_mm_last3h: 0 }
    };
    
    const service = new WeatherService();
    const verdict = (service as any).sprayWindowDecision(forecast, 'rice');
    return verdict.level === "DON'T" && verdict.reason_th.includes("ลมแรง");
  },

  // Test case: Rain expected should return DON'T
  testRainExpected: () => {
    const forecast: Forecast = {
      hours: Array(12).fill(0).map((_, i) => ({
        time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        rain_mm: i < 6 ? 0.6 : 0, // Rain in next 6h
        pop: i < 6 ? 0.7 : 0.1,
        wind_ms: 2,
        temp_c: 25,
        rh: 60
      })),
      recent: { rain_mm_last3h: 0 }
    };
    
    const service = new WeatherService();
    const verdict = (service as any).sprayWindowDecision(forecast, 'rice');
    return verdict.level === "DON'T" && verdict.reason_th.includes("ฝนภายใน");
  },

  // Test case: Good conditions should return GOOD
  testGoodConditions: () => {
    const forecast: Forecast = {
      hours: Array(12).fill(0).map((_, i) => ({
        time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        rain_mm: 0,
        pop: 0.1,
        wind_ms: 2,
        temp_c: 25,
        rh: 60
      })),
      recent: { rain_mm_last3h: 0 }
    };
    
    const service = new WeatherService();
    const verdict = (service as any).sprayWindowDecision(forecast, 'rice');
    return verdict.level === "GOOD" && verdict.reason_th.includes("ฉีดพ่นได้");
  },

  // Test case: Windy conditions should return CAUTION
  testWindyConditions: () => {
    const forecast: Forecast = {
      hours: Array(12).fill(0).map((_, i) => ({
        time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        rain_mm: 0,
        pop: 0.1,
        wind_ms: i < 3 ? 5.0 : 2.0, // Windy in next 3h
        temp_c: 25,
        rh: 60
      })),
      recent: { rain_mm_last3h: 0 }
    };
    
    const service = new WeatherService();
    const verdict = (service as any).sprayWindowDecision(forecast, 'rice');
    return verdict.level === "CAUTION" && verdict.reason_th.includes("ลมเริ่มแรง");
  },

  // Run all tests
  runAll: () => {
    const tests = [
      { name: 'Recent Rain', fn: sprayWindowTests.testRecentRain },
      { name: 'High Wind', fn: sprayWindowTests.testHighWind },
      { name: 'Rain Expected', fn: sprayWindowTests.testRainExpected },
      { name: 'Good Conditions', fn: sprayWindowTests.testGoodConditions },
      { name: 'Windy Conditions', fn: sprayWindowTests.testWindyConditions }
    ];

    console.log('🧪 Running Spray Window Tests...');
    tests.forEach(test => {
      try {
        const result = test.fn();
        console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASS' : 'FAIL'}`);
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR - ${error}`);
      }
    });
  }
};
