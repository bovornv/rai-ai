// Analytics service for tracking user events
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export class Analytics {
  private static events: AnalyticsEvent[] = [];
  
  static track(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      event: eventName,
      properties,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    // In production, this would send to analytics service
    console.log('[Analytics]', event);
    
    // Store in localStorage for offline capability
    try {
      const storedEvents = localStorage.getItem('rai_analytics') || '[]';
      const allEvents = JSON.parse(storedEvents);
      allEvents.push(event);
      localStorage.setItem('rai_analytics', JSON.stringify(allEvents));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }
  }
  
  // Location-specific events
  static trackLocationSheetOpened(source: 'today' | 'field') {
    this.track('location_sheet_opened', { source });
  }
  
  static trackLocationSetMethod(method: 'current' | 'search' | 'pin' | 'skip', precise: boolean) {
    this.track('location_set_method', { method, precise });
  }
  
  static trackFieldLocationSet(method: 'current' | 'search' | 'pin', precise: boolean) {
    this.track('field_location_set', { method, precise });
  }
  
  static trackScanGeohashPrecision(precision: 5 | 6 | 7) {
    this.track('scan_geohash_precision', { precision });
  }
  
  static trackMismatchBannerShown() {
    this.track('mismatch_banner_shown');
  }
  
  static trackMismatchResolved(action: 'use_field' | 'keep_current') {
    this.track('mismatch_resolved', { action });
  }
  
  static trackPermissionStateChanged(state: 'approx' | 'precise' | 'denied') {
    this.track('permission_state_changed', { state });
  }
  
  // Other core events from the requirements
  static trackSprayWindowViewed(crop: string, status: string) {
    this.track('spray_window_viewed', { crop, status });
  }
  
  static trackOutbreakAlertShared(crop: string, disease: string) {
    this.track('outbreak_alert_shared', { crop, disease });
  }
  
  static trackScanStarted(crop: string) {
    this.track('scan_started', { crop });
  }
  
  static trackScanCompleted(crop: string, latency: number) {
    this.track('scan_completed', { crop, latency });
  }
  
  static trackResultConfidenceBin(confidence: 'high' | 'medium' | 'uncertain') {
    this.track('result_confidence_bin', { confidence });
  }
  
  static trackReminderSet(type: string) {
    this.track('reminder_set', { type });
  }
  
  static trackMixCalculatorUsed() {
    this.track('mix_calculator_used');
  }
  
  static trackFieldCreated(crop: string) {
    this.track('field_created', { crop });
  }
  
  static trackFollowupScanCompleted(fieldId: string) {
    this.track('followup_scan_completed', { fieldId });
  }
  
  static trackMonthSummaryShared() {
    this.track('month_summary_shared');
  }
  
  static trackPriceAlertSet(crop: string, targetPrice: number) {
    this.track('price_alert_set', { crop, targetPrice });
  }
  
  static trackBuyerContacted(method: 'call' | 'line') {
    this.track('buyer_contacted', { method });
  }
  
  static trackHelpVideoCompleted(videoId: string, duration: number) {
    this.track('help_video_completed', { videoId, duration });
  }
  
  static trackPdpaOptInChanged(optIn: boolean) {
    this.track('pdpa_opt_in_changed', { optIn });
  }
  
  // Utility methods
  static getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
  
  static clearEvents() {
    this.events = [];
    localStorage.removeItem('rai_analytics');
  }
  
  static getStoredEvents(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem('rai_analytics') || '[]';
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
}
