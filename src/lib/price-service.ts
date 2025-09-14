// Price service for RaiAI MVP
// Epic 3: Price & Buyers - Price alerts, buyer directory, notifications

interface PriceData {
  crop: 'rice' | 'durian';
  grade: string;
  price: number;
  unit: string;
  location: string;
  timestamp: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
}

interface PriceAlert {
  id: string;
  crop: 'rice' | 'durian';
  grade: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
  userId: string;
}

interface Buyer {
  id: string;
  name: string;
  phone: string;
  lineId?: string;
  location: string;
  crops: ('rice' | 'durian')[];
  grades: string[];
  pickupHours: string;
  rating: number;
  reviews: number;
  isVerified: boolean;
  lastActive: number;
}

class PriceService {
  private prices: Map<string, PriceData> = new Map();
  private alerts: Map<string, PriceAlert> = new Map();
  private buyers: Map<string, Buyer> = new Map();
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeMockData();
  }

  // Initialize mock data
  private initializeMockData(): void {
    // Mock price data
    const mockPrices: PriceData[] = [
      {
        crop: 'rice',
        grade: 'ข้าวหอมมะลิ',
        price: 12500,
        unit: 'บาท/ตัน',
        location: 'นครราชสีมา',
        timestamp: Date.now(),
        trend: 'up',
        change: 200,
        changePercent: 1.6
      },
      {
        crop: 'rice',
        grade: 'ข้าวเหนียว',
        price: 11800,
        unit: 'บาท/ตัน',
        location: 'นครราชสีมา',
        timestamp: Date.now(),
        trend: 'stable',
        change: 0,
        changePercent: 0
      },
      {
        crop: 'durian',
        grade: 'หมอนทอง',
        price: 85,
        unit: 'บาท/กก.',
        location: 'จันทบุรี',
        timestamp: Date.now(),
        trend: 'down',
        change: -5,
        changePercent: -5.6
      },
      {
        crop: 'durian',
        grade: 'ชะนี',
        price: 75,
        unit: 'บาท/กก.',
        location: 'จันทบุรี',
        timestamp: Date.now(),
        trend: 'up',
        change: 3,
        changePercent: 4.2
      }
    ];

    mockPrices.forEach(price => {
      const key = `${price.crop}_${price.grade}_${price.location}`;
      this.prices.set(key, price);
    });

    // Mock buyer data
    const mockBuyers: Buyer[] = [
      {
        id: 'buyer_001',
        name: 'ร้านค้าข้าวเทพาลัย',
        phone: '081-234-5678',
        lineId: 'rice_shop_001',
        location: 'นครราชสีมา',
        crops: ['rice'],
        grades: ['ข้าวหอมมะลิ', 'ข้าวเหนียว'],
        pickupHours: '08:00-17:00',
        rating: 4.5,
        reviews: 23,
        isVerified: true,
        lastActive: Date.now() - 2 * 60 * 60 * 1000
      },
      {
        id: 'buyer_002',
        name: 'สหกรณ์ทุเรียนจันทบุรี',
        phone: '082-345-6789',
        lineId: 'durian_coop_001',
        location: 'จันทบุรี',
        crops: ['durian'],
        grades: ['หมอนทอง', 'ชะนี'],
        pickupHours: '06:00-18:00',
        rating: 4.8,
        reviews: 45,
        isVerified: true,
        lastActive: Date.now() - 1 * 60 * 60 * 1000
      }
    ];

    mockBuyers.forEach(buyer => {
      this.buyers.set(buyer.id, buyer);
    });
  }

  // Get current prices
  async getCurrentPrices(crop?: 'rice' | 'durian'): Promise<PriceData[]> {
    const cacheKey = `prices_${crop || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Mock API call - replace with actual price API
      const prices = Array.from(this.prices.values());
      const filteredPrices = crop ? prices.filter(p => p.crop === crop) : prices;
      
      this.cache.set(cacheKey, {
        data: filteredPrices,
        timestamp: Date.now()
      });
      
      return filteredPrices;
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      throw error;
    }
  }

  // Get price history
  async getPriceHistory(crop: 'rice' | 'durian', grade: string, days: number = 30): Promise<PriceData[]> {
    const cacheKey = `price_history_${crop}_${grade}_${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Mock price history - replace with actual API
      const history: PriceData[] = [];
      const basePrice = crop === 'rice' ? 12000 : 80;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const price: PriceData = {
          crop,
          grade,
          price: basePrice + (Math.random() - 0.5) * 1000,
          unit: crop === 'rice' ? 'บาท/ตัน' : 'บาท/กก.',
          location: crop === 'rice' ? 'นครราชสีมา' : 'จันทบุรี',
          timestamp: date.getTime(),
          trend: Math.random() > 0.5 ? 'up' : 'down',
          change: (Math.random() - 0.5) * 200,
          changePercent: (Math.random() - 0.5) * 10
        };
        
        history.push(price);
      }
      
      this.cache.set(cacheKey, {
        data: history,
        timestamp: Date.now()
      });
      
      return history;
    } catch (error) {
      console.error('Failed to fetch price history:', error);
      throw error;
    }
  }

  // Create price alert
  async createPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): Promise<string> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAlert: PriceAlert = {
      ...alert,
      id,
      createdAt: Date.now()
    };
    
    this.alerts.set(id, newAlert);
    
    // Check if alert should be triggered immediately
    this.checkAlert(newAlert);
    
    return id;
  }

  // Get user's price alerts
  getUserAlerts(userId: string): PriceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
  }

  // Update price alert
  async updatePriceAlert(alertId: string, updates: Partial<PriceAlert>): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) throw new Error('Alert not found');
    
    const updatedAlert = { ...alert, ...updates };
    this.alerts.set(alertId, updatedAlert);
    
    // Recheck alert if it's active
    if (updatedAlert.isActive) {
      this.checkAlert(updatedAlert);
    }
  }

  // Delete price alert
  async deletePriceAlert(alertId: string): Promise<void> {
    this.alerts.delete(alertId);
  }

  // Check if alert should be triggered
  private checkAlert(alert: PriceAlert): void {
    const priceKey = `${alert.crop}_${alert.grade}_${alert.crop === 'rice' ? 'นครราชสีมา' : 'จันทบุรี'}`;
    const currentPrice = this.prices.get(priceKey);
    
    if (!currentPrice) return;
    
    let shouldTrigger = false;
    
    if (alert.condition === 'above' && currentPrice.price >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (alert.condition === 'below' && currentPrice.price <= alert.targetPrice) {
      shouldTrigger = true;
    }
    
    if (shouldTrigger && !alert.triggeredAt) {
      this.triggerAlert(alert, currentPrice);
    }
  }

  // Trigger price alert
  private triggerAlert(alert: PriceAlert, currentPrice: PriceData): void {
    const updatedAlert = {
      ...alert,
      triggeredAt: Date.now()
    };
    
    this.alerts.set(alert.id, updatedAlert);
    
    // Send notification (mock)
    console.log(`🚨 Price alert triggered: ${alert.crop} ${alert.grade} ${alert.condition} ${alert.targetPrice}`);
    
    // In a real app, this would send a push notification
    this.sendPriceAlertNotification(alert, currentPrice);
  }

  // Send price alert notification
  private sendPriceAlertNotification(alert: PriceAlert, currentPrice: PriceData): void {
    // Mock notification - replace with actual push notification service
    const message = `🚨 แจ้งเตือนราคา: ${alert.crop === 'rice' ? 'ข้าว' : 'ทุเรียน'} ${alert.grade} ${alert.condition === 'above' ? 'สูงกว่า' : 'ต่ำกว่า'} ${alert.targetPrice} ${currentPrice.unit}`;
    
    console.log('📱 Push notification:', message);
    
    // In a real app, this would use a service like Firebase Cloud Messaging
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('RaiAI Price Alert', {
        body: message,
        icon: '/icon-192x192.png'
      });
    }
  }

  // Get buyers
  async getBuyers(crop?: 'rice' | 'durian', location?: string): Promise<Buyer[]> {
    const cacheKey = `buyers_${crop || 'all'}_${location || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Mock API call - replace with actual buyer API
      const buyers = Array.from(this.buyers.values());
      let filteredBuyers = buyers;
      
      if (crop) {
        filteredBuyers = filteredBuyers.filter(buyer => buyer.crops.includes(crop));
      }
      
      if (location) {
        filteredBuyers = filteredBuyers.filter(buyer => buyer.location.includes(location));
      }
      
      this.cache.set(cacheKey, {
        data: filteredBuyers,
        timestamp: Date.now()
      });
      
      return filteredBuyers;
    } catch (error) {
      console.error('Failed to fetch buyers:', error);
      throw error;
    }
  }

  // Get buyer by ID
  getBuyer(buyerId: string): Buyer | null {
    return this.buyers.get(buyerId) || null;
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Get price statistics
  getPriceStats(): {
    totalPrices: number;
    ricePrices: number;
    durianPrices: number;
    averageRicePrice: number;
    averageDurianPrice: number;
    priceTrends: {
      rice: 'up' | 'down' | 'stable';
      durian: 'up' | 'down' | 'stable';
    };
  } {
    const prices = Array.from(this.prices.values());
    const ricePrices = prices.filter(p => p.crop === 'rice');
    const durianPrices = prices.filter(p => p.crop === 'durian');
    
    return {
      totalPrices: prices.length,
      ricePrices: ricePrices.length,
      durianPrices: durianPrices.length,
      averageRicePrice: ricePrices.length > 0 ? ricePrices.reduce((sum, p) => sum + p.price, 0) / ricePrices.length : 0,
      averageDurianPrice: durianPrices.length > 0 ? durianPrices.reduce((sum, p) => sum + p.price, 0) / durianPrices.length : 0,
      priceTrends: {
        rice: ricePrices.length > 0 ? ricePrices[0].trend : 'stable',
        durian: durianPrices.length > 0 ? durianPrices[0].trend : 'stable'
      }
    };
  }
}

// Singleton instance
export const priceService = new PriceService();

// Convenience functions
export const getCurrentPrices = (crop?: 'rice' | 'durian'): Promise<PriceData[]> => {
  return priceService.getCurrentPrices(crop);
};

export const getPriceHistory = (crop: 'rice' | 'durian', grade: string, days?: number): Promise<PriceData[]> => {
  return priceService.getPriceHistory(crop, grade, days);
};

export const createPriceAlert = (alert: Omit<PriceAlert, 'id' | 'createdAt'>): Promise<string> => {
  return priceService.createPriceAlert(alert);
};

export const getUserAlerts = (userId: string): PriceAlert[] => {
  return priceService.getUserAlerts(userId);
};

export const getBuyers = (crop?: 'rice' | 'durian', location?: string): Promise<Buyer[]> => {
  return priceService.getBuyers(crop, location);
};

export const getBuyer = (buyerId: string): Buyer | null => {
  return priceService.getBuyer(buyerId);
};

export const requestNotificationPermission = (): Promise<boolean> => {
  return priceService.requestNotificationPermission();
};
