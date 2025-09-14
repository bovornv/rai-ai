// Enhanced analytics system for RaiAI MVP
// Epic 10: Analytics & metrics - Event tracking, KPI computation

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface KPIMetrics {
  openToResult: number;
  wauSprayWindow: number;
  outbreakShares: number;
  alertsSet: number;
  followUpScans: number;
  crashFreeRate: number;
  offlineSuccessRate: number;
}

class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredEvents();
    this.setupOnlineListener();
  }

  // Track event
  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        platform: 'web',
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.events.push(event);
    this.storeEvents();

    // Send immediately if online
    if (this.isOnline) {
      this.sendEvent(event);
    }

    console.log(`📊 Analytics: ${eventName}`, properties);
  }

  // Set user ID
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Send event to analytics service
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Mock analytics endpoint - replace with actual service
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  // Send all stored events when back online
  private async sendStoredEvents(): Promise<void> {
    const eventsToSend = [...this.events];
    this.events = [];

    for (const event of eventsToSend) {
      await this.sendEvent(event);
    }
  }

  // Setup online/offline listeners
  private setupOnlineListener(): void {
    window.addEventListener('online', async () => {
      this.isOnline = true;
      await this.sendStoredEvents();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Store events in localStorage
  private storeEvents(): void {
    try {
      localStorage.setItem('rai-ai-analytics', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to store analytics events:', error);
    }
  }

  // Load stored events
  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem('rai-ai-analytics');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load stored analytics events:', error);
    }
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get events for KPI computation
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Compute KPIs
  computeKPIs(): KPIMetrics {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Filter events from last week
    const weeklyEvents = this.events.filter(e => e.timestamp >= oneWeekAgo);
    const dailyEvents = this.events.filter(e => e.timestamp >= oneDayAgo);

    // Open → Result conversion
    const appOpens = weeklyEvents.filter(e => e.name === 'app_open').length;
    const resultViews = weeklyEvents.filter(e => e.name === 'result_action_viewed').length;
    const openToResult = appOpens > 0 ? (resultViews / appOpens) * 100 : 0;

    // WAU Spray Window
    const sprayWindowViews = weeklyEvents.filter(e => e.name === 'today_loaded').length;
    const wauSprayWindow = sprayWindowViews;

    // Outbreak shares
    const outbreakShares = weeklyEvents.filter(e => e.name === 'outbreak_shared').length;

    // Alerts set
    const alertsSet = weeklyEvents.filter(e => e.name === 'price_alert_set').length;

    // Follow-up scans
    const scanStarts = weeklyEvents.filter(e => e.name === 'scan_started').length;
    const followUpScans = weeklyEvents.filter(e => 
      e.name === 'scan_started' && 
      e.properties?.isFollowUp === true
    ).length;

    // Crash-free rate (mock - would need crash reporting integration)
    const crashFreeRate = 99.5; // Mock value

    // Offline success rate
    const offlineEvents = weeklyEvents.filter(e => e.properties?.offline === true);
    const offlineSuccess = offlineEvents.filter(e => e.properties?.success === true).length;
    const offlineSuccessRate = offlineEvents.length > 0 ? (offlineSuccess / offlineEvents.length) * 100 : 100;

    return {
      openToResult,
      wauSprayWindow,
      outbreakShares,
      alertsSet,
      followUpScans,
      crashFreeRate,
      offlineSuccessRate
    };
  }

  // Log weekly summary
  logWeeklySummary(): void {
    const kpis = this.computeKPIs();
    
    console.log('📊 RaiAI Analytics Summary (Weekly)');
    console.log('=====================================');
    console.log(`Open → Result: ${kpis.openToResult.toFixed(1)}%`);
    console.log(`WAU Spray Window: ${kpis.wauSprayWindow}`);
    console.log(`Outbreak Shares: ${kpis.outbreakShares}`);
    console.log(`Price Alerts Set: ${kpis.alertsSet}`);
    console.log(`Follow-up Scans: ${kpis.followUpScans}`);
    console.log(`Crash-free Rate: ${kpis.crashFreeRate}%`);
    console.log(`Offline Success: ${kpis.offlineSuccessRate.toFixed(1)}%`);
    console.log('=====================================');
  }
}

// Singleton instance
export const analytics = new AnalyticsEngine();

// Event tracking functions for specific RaiAI features
export const trackAppOpen = () => {
  analytics.track('app_open');
};

export const trackTodayLoaded = (crop: string) => {
  analytics.track('today_loaded', { crop });
};

export const trackScanStarted = (crop: string, isFollowUp = false) => {
  analytics.track('scan_started', { crop, isFollowUp });
};

export const trackScanInferred = (crop: string, confidence: number, inferenceTime: number) => {
  analytics.track('scan_inferred', { crop, confidence, inferenceTime });
};

export const trackResultActionViewed = (crop: string, disease: string, confidence: number) => {
  analytics.track('result_action_viewed', { crop, disease, confidence });
};

export const trackMixCalcUsed = (crop: string, tankSize: number) => {
  analytics.track('mix_calc_used', { crop, tankSize });
};

export const trackReminderSet = (crop: string, reminderType: string) => {
  analytics.track('reminder_set', { crop, reminderType });
};

export const trackOutbreakCardViewed = (crop: string, disease: string) => {
  analytics.track('outbreak_card_viewed', { crop, disease });
};

export const trackOutbreakShared = (crop: string, disease: string, platform: string) => {
  analytics.track('outbreak_shared', { crop, disease, platform });
};

export const trackPriceAlertSet = (crop: string, price: number) => {
  analytics.track('price_alert_set', { crop, price });
};

export const trackTicketCreated = (crop: string, disease: string) => {
  analytics.track('ticket_created', { crop, disease });
};

export const trackTicketFulfilled = (ticketId: string, shopId: string) => {
  analytics.track('ticket_fulfilled', { ticketId, shopId });
};

export const trackSprayWindowShared = (crop: string, status: string) => {
  analytics.track('spray_window_shared', { crop, status });
};

export const trackLocationSet = (method: string, accuracy: number) => {
  analytics.track('location_set', { method, accuracy });
};

export const trackLanguageChanged = (from: string, to: string) => {
  analytics.track('language_changed', { from, to });
};

export const trackOfflineAction = (action: string, success: boolean) => {
  analytics.track('offline_action', { action, success, offline: true });
};

// Initialize analytics
export const initAnalytics = (): void => {
  // Track app open
  trackAppOpen();

  // Log weekly summary
  setInterval(() => {
    analytics.logWeeklySummary();
  }, 604800000); // Every week

  // Track performance metrics
  setInterval(() => {
    const kpis = analytics.computeKPIs();
    analytics.track('kpi_computed', kpis);
  }, 3600000); // Every hour
};
