// Crash reporting system for RaiAI MVP
// Epic 0: Critical polish - Crash-free > 99%

interface CrashReport {
  id: string;
  timestamp: number;
  error: Error;
  stack: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  breadcrumbs: Breadcrumb[];
  context: Record<string, any>;
}

interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: any;
}

class CrashReporter {
  private breadcrumbs: Breadcrumb[] = [];
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
    this.setupUnhandledRejectionHandler();
  }

  // Set user ID
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Add breadcrumb
  addBreadcrumb(category: string, message: string, level: Breadcrumb['level'] = 'info', data?: any): void {
    const breadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      category,
      message,
      level,
      data
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  // Capture exception
  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const report: CrashReport = {
      id: this.generateReportId(),
      timestamp: Date.now(),
      error,
      stack: error.stack || '',
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.userId,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      context: context || {}
    };

    this.sendReport(report);
    console.error('🚨 Crash reported:', error);
  }

  // Capture message
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.addBreadcrumb('message', message, level, context);
    
    if (level === 'error') {
      const error = new Error(message);
      this.captureException(error, context);
    }
  }

  // Setup error handlers
  private setupErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureException(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error'
      });
    });

    // Resource error handler
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.captureMessage(`Resource error: ${event.target}`, 'error', {
          type: 'resource_error',
          target: event.target
        });
      }
    }, true);
  }

  // Setup unhandled rejection handler
  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(new Error(event.reason), {
        type: 'unhandled_promise_rejection',
        reason: event.reason
      });
    });
  }

  // Send crash report
  private async sendReport(report: CrashReport): Promise<void> {
    try {
      // Mock crash reporting endpoint - replace with actual service (Sentry, Crashlytics, etc.)
      await fetch('/api/crash-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      // Store locally if sending fails
      this.storeReportLocally(report);
      console.warn('Failed to send crash report:', error);
    }
  }

  // Store report locally
  private storeReportLocally(report: CrashReport): void {
    try {
      const stored = localStorage.getItem('rai-ai-crash-reports') || '[]';
      const reports = JSON.parse(stored);
      reports.push(report);
      
      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.splice(0, reports.length - 10);
      }
      
      localStorage.setItem('rai-ai-crash-reports', JSON.stringify(reports));
    } catch (error) {
      console.warn('Failed to store crash report locally:', error);
    }
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate report ID
  private generateReportId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get crash-free rate
  getCrashFreeRate(): number {
    // Mock implementation - would calculate from actual crash data
    return 99.2; // 99.2% crash-free rate
  }

  // Enable/disable crash reporting
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Get recent crashes
  getRecentCrashes(): CrashReport[] {
    try {
      const stored = localStorage.getItem('rai-ai-crash-reports');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }
}

// Singleton instance
export const crashReporter = new CrashReporter();

// Convenience functions
export const captureException = (error: Error, context?: Record<string, any>): void => {
  crashReporter.captureException(error, context);
};

export const captureMessage = (message: string, level?: 'info' | 'warning' | 'error', context?: Record<string, any>): void => {
  crashReporter.captureMessage(message, level, context);
};

export const addBreadcrumb = (category: string, message: string, level?: Breadcrumb['level'], data?: any): void => {
  crashReporter.addBreadcrumb(category, message, level, data);
};

// Initialize crash reporting
export const initCrashReporting = (): void => {
  // Add initial breadcrumb
  addBreadcrumb('app', 'RaiAI app started', 'info');
  
  // Track app lifecycle
  addBreadcrumb('app', 'App initialized', 'info');
  
  console.log('🛡️ Crash reporting initialized');
};
