// Analytics and telemetry service
import { type SprayVerdict } from '@/weather/types';
import { type LatLon } from '@/weather/types';

export interface AnalyticsEvent {
  event: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  properties: Record<string, any>;
}

export interface WeatherFetchEvent {
  source: 'meteosource' | 'openweather' | 'fallback';
  success: boolean;
  duration: number;
  geohash5: string;
  error?: string;
}

export interface SprayVerdictEvent {
  level: 'GOOD' | 'CAUTION' | 'DON\'T';
  crop: 'rice' | 'durian';
  source: 'meteosource' | 'openweather';
  thresholds: Record<string, number>;
  confidence: number;
  geohash5: string;
  locationSource: 'gps' | 'manual' | 'default';
}

export interface LocationEvent {
  source: 'gps' | 'manual' | 'default';
  granted: boolean;
  error?: string;
  province?: string;
  amphoe?: string;
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private readonly BATCH_SIZE = 50;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadUserId(): void {
    try {
      this.userId = localStorage.getItem('rai_ai_user_id') || undefined;
      if (!this.userId) {
        this.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('rai_ai_user_id', this.userId);
      }
    } catch (error) {
      console.warn('Failed to load user ID:', error);
    }
  }

  // Core tracking method
  track(event: string, properties: Record<string, any> = {}): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      properties: {
        ...properties,
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine
      }
    };

    this.events.push(analyticsEvent);

    // Prevent memory leaks
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Batch send events
    this.scheduleBatchSend();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', analyticsEvent);
    }
  }

  // Weather-specific events
  trackWeatherFetch(event: WeatherFetchEvent): void {
    this.track('weather_fetch', {
      ...event,
      success: event.success,
      duration_ms: event.duration
    });
  }

  trackWeatherFallback(from: string, to: string, geohash5: string): void {
    this.track('weather_fetch_fallback', {
      from,
      to,
      geohash5
    });
  }

  trackWeatherOfflineServed(geohash5: string, ageMinutes: number): void {
    this.track('weather_offline_served', {
      geohash5,
      age_minutes: ageMinutes
    });
  }

  // Spray window events
  trackSprayVerdict(event: SprayVerdictEvent): void {
    this.track('spray_window_verdict', {
      ...event,
      verdict_level: event.level,
      crop_type: event.crop,
      data_source: event.source,
      confidence_score: event.confidence
    });
  }

  // Location events
  trackLocationPermission(event: LocationEvent): void {
    this.track('location_permission', {
      ...event,
      permission_granted: event.granted
    });
  }

  trackLocationSelected(lat: number, lon: number, source: string, province?: string, amphoe?: string): void {
    this.track('location_selected', {
      lat,
      lon,
      source,
      province,
      amphoe
    });
  }

  // Background sync events
  trackSyncStarted(): void {
    this.track('background_sync_started');
  }

  trackSyncSuccess(source: string, geohash5: string, hours: number): void {
    this.track('background_sync_success', {
      source,
      geohash5,
      hours
    });
  }

  trackSyncFailure(error: string, failures: number): void {
    this.track('background_sync_failure', {
      error,
      failure_count: failures
    });
  }

  trackSyncCircuitBreaker(): void {
    this.track('background_sync_circuit_breaker');
  }

  // App lifecycle events
  trackAppStart(): void {
    this.track('app_start', {
      session_id: this.sessionId
    });
  }

  trackAppForeground(): void {
    this.track('app_foreground');
  }

  trackAppBackground(): void {
    this.track('app_background');
  }

  // Error tracking
  trackError(error: Error, context: string, properties: Record<string, any> = {}): void {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
      ...properties
    });
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.track('performance', {
      metric,
      value,
      unit
    });
  }

  // User interaction events
  trackUserAction(action: string, target: string, properties: Record<string, any> = {}): void {
    this.track('user_action', {
      action,
      target,
      ...properties
    });
  }

  // Batch sending
  private scheduleBatchSend(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.sendBatch();
    }, 5000); // Send every 5 seconds
  }

  private async sendBatch(): Promise<void> {
    if (this.events.length === 0) return;

    const batch = this.events.splice(0, this.BATCH_SIZE);
    this.batchTimer = null;

    try {
      await this.sendEvents(batch);
    } catch (error) {
      console.warn('Failed to send analytics batch:', error);
      // Put events back at the front of the queue
      this.events.unshift(...batch);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // In production, send to your analytics service
    // For now, we'll just log them
    console.log('📊 Sending analytics batch:', events.length, 'events');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Force send all pending events
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    await this.sendBatch();
  }

  // Get analytics summary
  getSummary() {
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      totalEvents: this.events.length,
      eventCounts,
      oldestEvent: this.events[0]?.timestamp,
      newestEvent: this.events[this.events.length - 1]?.timestamp
    };
  }

  // Clear all events (for testing)
  clear(): void {
    this.events = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

export const analyticsService = new AnalyticsService();
