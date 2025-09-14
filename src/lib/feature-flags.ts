// Feature flags system for RaiAI MVP
// Epic 11: Feature flags - Remote config, kill switches

interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
  description?: string;
}

interface RemoteConfig {
  features: Record<string, FeatureFlag>;
  lastUpdated: number;
  version: string;
}

class FeatureFlags {
  private flags: Map<string, FeatureFlag> = new Map();
  private remoteConfig: RemoteConfig | null = null;
  private userId?: string;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.loadDefaultFlags();
    this.setupOnlineListener();
  }

  // Set user ID for user-specific flags
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Check if feature is enabled
  isEnabled(flagName: string): boolean {
    const flag = this.flags.get(flagName);
    
    if (!flag) {
      console.warn(`Feature flag '${flagName}' not found`);
      return false;
    }

    // Check if feature is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      const userHash = this.getUserHash();
      const userPercentage = userHash % 100;
      if (userPercentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions) {
      return this.evaluateConditions(flag.conditions);
    }

    return true;
  }

  // Get feature flag value
  getFlag(flagName: string): FeatureFlag | null {
    return this.flags.get(flagName) || null;
  }

  // Get all flags
  getAllFlags(): Record<string, FeatureFlag> {
    return Object.fromEntries(this.flags.entries());
  }

  // Update flags from remote config
  async updateFromRemote(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    try {
      const response = await fetch('/api/feature-flags');
      const config: RemoteConfig = await response.json();
      
      this.remoteConfig = config;
      this.flags.clear();
      
      Object.entries(config.features).forEach(([name, flag]) => {
        this.flags.set(name, flag);
      });

      this.storeConfig();
      console.log('✅ Feature flags updated from remote');
    } catch (error) {
      console.warn('Failed to update feature flags from remote:', error);
      this.loadStoredConfig();
    }
  }

  // Load default flags
  private loadDefaultFlags(): void {
    const defaultFlags: Record<string, FeatureFlag> = {
      'feature.outbreak_radar': {
        name: 'feature.outbreak_radar',
        enabled: true,
        description: 'Outbreak radar functionality'
      },
      'feature.price_alerts': {
        name: 'feature.price_alerts',
        enabled: true,
        description: 'Price alert system'
      },
      'feature.counter_mode': {
        name: 'feature.counter_mode',
        enabled: false,
        description: 'Counter mode for shops'
      },
      'pro.unlock_unlimited_alerts': {
        name: 'pro.unlock_unlimited_alerts',
        enabled: false,
        description: 'Pro feature: unlimited price alerts'
      },
      'feature.share_cards': {
        name: 'feature.share_cards',
        enabled: true,
        description: 'Share card generation'
      },
      'feature.offline_mode': {
        name: 'feature.offline_mode',
        enabled: true,
        description: 'Offline functionality'
      },
      'feature.analytics': {
        name: 'feature.analytics',
        enabled: true,
        description: 'Analytics tracking'
      },
      'kill_switch.app': {
        name: 'kill_switch.app',
        enabled: true,
        description: 'Main app kill switch'
      },
      'kill_switch.scan': {
        name: 'kill_switch.scan',
        enabled: true,
        description: 'Scan functionality kill switch'
      },
      'kill_switch.prices': {
        name: 'kill_switch.prices',
        enabled: true,
        description: 'Price data kill switch'
      }
    };

    Object.entries(defaultFlags).forEach(([name, flag]) => {
      this.flags.set(name, flag);
    });

    this.loadStoredConfig();
  }

  // Load stored config
  private loadStoredConfig(): void {
    try {
      const stored = localStorage.getItem('rai-ai-feature-flags');
      if (stored) {
        const config: RemoteConfig = JSON.parse(stored);
        this.remoteConfig = config;
        
        Object.entries(config.features).forEach(([name, flag]) => {
          this.flags.set(name, flag);
        });
      }
    } catch (error) {
      console.warn('Failed to load stored feature flags:', error);
    }
  }

  // Store config
  private storeConfig(): void {
    if (!this.remoteConfig) return;

    try {
      localStorage.setItem('rai-ai-feature-flags', JSON.stringify(this.remoteConfig));
    } catch (error) {
      console.warn('Failed to store feature flags:', error);
    }
  }

  // Setup online listener
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateFromRemote();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Get user hash for rollout percentage
  private getUserHash(): number {
    if (!this.userId) {
      return Math.floor(Math.random() * 100);
    }

    let hash = 0;
    for (let i = 0; i < this.userId.length; i++) {
      const char = this.userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Evaluate conditions
  private evaluateConditions(conditions: Record<string, any>): boolean {
    // Check user conditions
    if (conditions.userId && this.userId !== conditions.userId) {
      return false;
    }

    // Check platform conditions
    if (conditions.platform && conditions.platform !== 'web') {
      return false;
    }

    // Check language conditions
    if (conditions.language && !navigator.language.startsWith(conditions.language)) {
      return false;
    }

    // Check version conditions
    if (conditions.minVersion) {
      // Mock version check - replace with actual version logic
      const currentVersion = '1.0.0';
      if (this.compareVersions(currentVersion, conditions.minVersion) < 0) {
        return false;
      }
    }

    return true;
  }

  // Compare versions
  private compareVersions(version1: string, version2: string): number {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }

  // Get flag status for debugging
  getFlagStatus(flagName: string): {
    enabled: boolean;
    reason: string;
    rolloutPercentage?: number;
    userPercentage?: number;
  } {
    const flag = this.flags.get(flagName);
    
    if (!flag) {
      return { enabled: false, reason: 'Flag not found' };
    }

    if (!flag.enabled) {
      return { enabled: false, reason: 'Globally disabled' };
    }

    if (flag.rolloutPercentage !== undefined) {
      const userHash = this.getUserHash();
      const userPercentage = userHash % 100;
      
      if (userPercentage >= flag.rolloutPercentage) {
        return { 
          enabled: false, 
          reason: 'Rollout percentage not met',
          rolloutPercentage: flag.rolloutPercentage,
          userPercentage
        };
      }
    }

    if (flag.conditions && !this.evaluateConditions(flag.conditions)) {
      return { enabled: false, reason: 'Conditions not met' };
    }

    return { enabled: true, reason: 'Enabled' };
  }
}

// Singleton instance
export const featureFlags = new FeatureFlags();

// Convenience functions
export const isFeatureEnabled = (flagName: string): boolean => {
  return featureFlags.isEnabled(flagName);
};

export const getFeatureFlag = (flagName: string): FeatureFlag | null => {
  return featureFlags.getFlag(flagName);
};

// Specific feature checks
export const isOutbreakRadarEnabled = (): boolean => {
  return isFeatureEnabled('feature.outbreak_radar');
};

export const isPriceAlertsEnabled = (): boolean => {
  return isFeatureEnabled('feature.price_alerts');
};

export const isCounterModeEnabled = (): boolean => {
  return isFeatureEnabled('feature.counter_mode');
};

export const isProUnlimitedAlertsEnabled = (): boolean => {
  return isFeatureEnabled('pro.unlock_unlimited_alerts');
};

export const isShareCardsEnabled = (): boolean => {
  return isFeatureEnabled('feature.share_cards');
};

export const isOfflineModeEnabled = (): boolean => {
  return isFeatureEnabled('feature.offline_mode');
};

export const isAnalyticsEnabled = (): boolean => {
  return isFeatureEnabled('feature.analytics');
};

// Kill switch checks
export const isAppEnabled = (): boolean => {
  return isFeatureEnabled('kill_switch.app');
};

export const isScanEnabled = (): boolean => {
  return isFeatureEnabled('kill_switch.scan');
};

export const isPricesEnabled = (): boolean => {
  return isFeatureEnabled('kill_switch.prices');
};

// Initialize feature flags
export const initFeatureFlags = async (): Promise<void> => {
  // Update from remote config
  await featureFlags.updateFromRemote();
  
  // Periodic updates
  setInterval(() => {
    featureFlags.updateFromRemote();
  }, 300000); // Every 5 minutes
};
