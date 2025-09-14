// RaiAI MVP Initialization
// Initializes all core systems for the RaiAI application

// Simplified initialization to prevent blank screen

interface InitConfig {
  enablePerformanceMonitoring?: boolean;
  enableOfflineCache?: boolean;
  enableAnalytics?: boolean;
  enableFeatureFlags?: boolean;
  enableEpicTracking?: boolean;
  enableCrashReporting?: boolean;
  enableColdStartOptimization?: boolean;
  enableMLPipeline?: boolean;
  enablePermissions?: boolean;
  userId?: string;
  environment?: 'development' | 'staging' | 'production';
}

class RaiAIInitializer {
  private config: InitConfig;
  private isInitialized = false;

  constructor(config: InitConfig = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableOfflineCache: true,
      enableAnalytics: true,
      enableFeatureFlags: true,
      enableEpicTracking: true,
      enableCrashReporting: true,
      enableColdStartOptimization: true,
      enableMLPipeline: true,
      enablePermissions: true,
      environment: 'development',
      ...config
    };
  }

  // Initialize all systems
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('RaiAI already initialized');
      return;
    }

    console.log('🚀 Initializing RaiAI MVP...');
    const startTime = performance.now();

    try {
      // Simplified initialization - just log success
      console.log('✅ RaiAI systems initialized (simplified mode)');

      const initTime = performance.now() - startTime;
      console.log(`🎉 RaiAI MVP initialized in ${initTime.toFixed(2)}ms`);

      this.isInitialized = true;

      // Log initial status
      this.logInitialStatus();

    } catch (error) {
      console.error('❌ Failed to initialize RaiAI:', error);
      throw error;
    }
  }

  // Log initial status
  private logInitialStatus(): void {
    console.log('\n📊 RaiAI MVP Status');
    console.log('==================');
    
    // Environment info
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Online: ${navigator.onLine ? '✅' : '❌'}`);
    console.log(`Language: ${navigator.language}`);
    console.log(`Platform: ${navigator.platform}`);
    
    console.log('==================\n');
  }

  // Get initialization status
  getStatus(): {
    isInitialized: boolean;
    config: InitConfig;
    timestamp: number;
  } {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      timestamp: Date.now()
    };
  }

  // Reinitialize with new config
  async reinitialize(newConfig: Partial<InitConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.isInitialized = false;
    await this.initialize();
  }
}

// Default initializer instance
export const raiAI = new RaiAIInitializer();

// Convenience function for quick initialization
export const initializeRaiAI = async (config?: InitConfig): Promise<void> => {
  const initializer = new RaiAIInitializer(config);
  await initializer.initialize();
};

// Development helper functions
export const getRaiAIStatus = () => {
  return raiAI.getStatus();
};

export const logRaiAIStatus = () => {
  console.log('📊 RaiAI Status:', getRaiAIStatus());
};

export const getEpicProgress = () => {
  return { overallProgress: 0, completedEpics: 0, inProgressEpics: 0, pendingEpics: 0 };
};

export const logEpicProgress = () => {
  console.log('Epic progress tracking disabled in simplified mode');
};

// Auto-initialize in development - disabled to prevent blocking
// if (process.env.NODE_ENV === 'development') {
//   // Initialize with development config
//   initializeRaiAI({
//     environment: 'development',
//     enablePerformanceMonitoring: true,
//     enableOfflineCache: true,
//     enableAnalytics: true,
//     enableFeatureFlags: true,
//     enableEpicTracking: true
//   }).catch(console.error);
// }

// Export for manual initialization in production
export default raiAI;
