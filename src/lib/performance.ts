// Performance monitoring for RaiAI MVP
// Epic 0: Critical polish - Performance optimization

interface PerformanceMetrics {
  coldStart: number;
  todayTabRender: number;
  scanInference: number;
  crashFreeRate: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private startTimes: Map<string, number> = new Map();

  // Track cold start time
  trackColdStart() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.coldStart = navigation.loadEventEnd - navigation.fetchStart;
        console.log(`🚀 Cold start: ${this.metrics.coldStart}ms`);
      }
    }
  }

  // Track Today tab render time
  trackTodayTabRender() {
    const startTime = performance.now();
    this.startTimes.set('todayTab', startTime);
    
    // Return a function to end the measurement
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      this.metrics.todayTabRender = renderTime;
      console.log(`📱 Today tab render: ${renderTime.toFixed(2)}ms`);
      
      // Alert if render time is too slow
      if (renderTime > 2000) {
        console.warn(`⚠️ Today tab render too slow: ${renderTime.toFixed(2)}ms`);
      }
    };
  }

  // Track scan inference time
  trackScanInference() {
    const startTime = performance.now();
    this.startTimes.set('scanInference', startTime);
    
    return () => {
      const endTime = performance.now();
      const inferenceTime = endTime - startTime;
      this.metrics.scanInference = inferenceTime;
      console.log(`🔍 Scan inference: ${inferenceTime.toFixed(2)}ms`);
      
      // Alert if inference is too slow
      if (inferenceTime > 800) {
        console.warn(`⚠️ Scan inference too slow: ${inferenceTime.toFixed(2)}ms`);
      }
    };
  }

  // Get performance summary
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Log weekly performance summary
  logWeeklySummary() {
    const metrics = this.getMetrics();
    console.log('📊 RaiAI Performance Summary (Weekly)');
    console.log('=====================================');
    
    if (metrics.coldStart) {
      console.log(`Cold Start: ${metrics.coldStart}ms ${metrics.coldStart < 2000 ? '✅' : '❌'}`);
    }
    
    if (metrics.todayTabRender) {
      console.log(`Today Tab Render: ${metrics.todayTabRender.toFixed(2)}ms ${metrics.todayTabRender < 2000 ? '✅' : '❌'}`);
    }
    
    if (metrics.scanInference) {
      console.log(`Scan Inference: ${metrics.scanInference.toFixed(2)}ms ${metrics.scanInference < 800 ? '✅' : '❌'}`);
    }
    
    console.log('=====================================');
  }
}

// Singleton instance
export const performance = new PerformanceMonitor();

// Performance optimization utilities
export const optimizeImages = () => {
  // Lazy load images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

export const preloadCriticalResources = () => {
  // Preload critical CSS and fonts
  const criticalResources = [
    '/src/index.css',
    // Add other critical resources
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = 'style';
    document.head.appendChild(link);
  });
};

// Memory management
export const cleanupMemory = () => {
  // Clear unused caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('old-')) {
          caches.delete(cacheName);
        }
      });
    });
  }
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  // Track cold start
  Performance.trackColdStart();
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Optimize images
  optimizeImages();
  
  // Cleanup memory periodically
  setInterval(cleanupMemory, 300000); // Every 5 minutes
  
  // Log weekly summary
  setInterval(() => {
    Performance.logWeeklySummary();
  }, 604800000); // Every week
};
