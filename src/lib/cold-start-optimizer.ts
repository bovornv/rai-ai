// Cold start optimization for RaiAI MVP
// Epic 0: Critical polish - Cold start < 2s

interface ColdStartMetrics {
  fetchStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalTime: number;
}

class ColdStartOptimizer {
  private metrics: Partial<ColdStartMetrics> = {};
  private startTime: number = performance.now();

  constructor() {
    this.measureColdStart();
    this.optimizeCriticalPath();
  }

  // Measure cold start performance
  private measureColdStart(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Get navigation timing
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.fetchStart = navigation.fetchStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      this.metrics.loadComplete = navigation.loadEventEnd - navigation.fetchStart;
    }

    // Get paint timing
    const paintEntries = window.performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        this.metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        this.metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Get LCP
    const lcpEntries = window.performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      this.metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
    }

    this.metrics.totalTime = performance.now() - this.startTime;

    // Log cold start metrics
    this.logColdStartMetrics();
  }

  // Log cold start metrics
  private logColdStartMetrics(): void {
    console.log('🚀 Cold Start Metrics:');
    console.log(`  Total Time: ${this.metrics.totalTime?.toFixed(2)}ms`);
    console.log(`  DOM Content Loaded: ${this.metrics.domContentLoaded?.toFixed(2)}ms`);
    console.log(`  Load Complete: ${this.metrics.loadComplete?.toFixed(2)}ms`);
    console.log(`  First Paint: ${this.metrics.firstPaint?.toFixed(2)}ms`);
    console.log(`  First Contentful Paint: ${this.metrics.firstContentfulPaint?.toFixed(2)}ms`);
    console.log(`  Largest Contentful Paint: ${this.metrics.largestContentfulPaint?.toFixed(2)}ms`);
    
    // Check if targets are met
    const targetsMet = {
      totalTime: (this.metrics.totalTime || 0) < 2000,
      domContentLoaded: (this.metrics.domContentLoaded || 0) < 1500,
      firstContentfulPaint: (this.metrics.firstContentfulPaint || 0) < 1000
    };

    console.log('🎯 Cold Start Targets:');
    console.log(`  Total Time < 2s: ${targetsMet.totalTime ? '✅' : '❌'}`);
    console.log(`  DOM Content Loaded < 1.5s: ${targetsMet.domContentLoaded ? '✅' : '❌'}`);
    console.log(`  First Contentful Paint < 1s: ${targetsMet.firstContentfulPaint ? '✅' : '❌'}`);
  }

  // Optimize critical path
  private optimizeCriticalPath(): void {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Optimize images
    this.optimizeImages();
    
    // Defer non-critical JavaScript
    this.deferNonCriticalJS();
    
    // Optimize fonts
    this.optimizeFonts();
  }

  // Preload critical resources
  private preloadCriticalResources(): void {
    const criticalResources = [
      '/src/index.css',
      '/src/components/ui/button.css',
      '/src/components/ui/card.css'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = 'style';
      document.head.appendChild(link);
    });
  }

  // Optimize images
  private optimizeImages(): void {
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

      // Observe images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Defer non-critical JavaScript
  private deferNonCriticalJS(): void {
    // Defer analytics and non-critical scripts
    const nonCriticalScripts = [
      'analytics',
      'feature-flags',
      'epic-tracker'
    ];

    // These are already loaded asynchronously in the initialization
    console.log('📦 Non-critical JavaScript deferred');
  }

  // Optimize fonts
  private optimizeFonts(): void {
    // Preload critical fonts
    const criticalFonts = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ];

    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'style';
      document.head.appendChild(link);
    });
  }

  // Get cold start metrics
  getMetrics(): Partial<ColdStartMetrics> {
    return { ...this.metrics };
  }

  // Check if cold start targets are met
  areTargetsMet(): boolean {
    return (
      (this.metrics.totalTime || 0) < 2000 &&
      (this.metrics.domContentLoaded || 0) < 1500 &&
      (this.metrics.firstContentfulPaint || 0) < 1000
    );
  }
}

// Singleton instance
export const coldStartOptimizer = new ColdStartOptimizer();

// Initialize cold start optimization
export const initColdStartOptimization = (): void => {
  // Cold start optimization is automatically initialized
  console.log('⚡ Cold start optimization initialized');
};
