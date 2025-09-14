import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star
} from "lucide-react";

interface PriceAlert {
  id: string;
  crop: string;
  currentPrice: number;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  lastTriggered?: string;
}

interface Buyer {
  id: string;
  name: string;
  location: string;
  phone: string;
  lineId?: string;
  rating: number;
  pickupHours: string;
  specialties: string[];
  distance: number; // in km
  lastPrice: number;
  priceTrend: 'up' | 'down' | 'stable';
}

interface PriceAlertsProps {
  cropType?: 'rice' | 'durian';
}

export function PriceAlerts({ cropType = 'rice' }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    crop: cropType,
    targetPrice: 0,
    condition: 'above' as 'above' | 'below'
  });

  useEffect(() => {
    fetchPriceData();
  }, [cropType]);

  const fetchPriceData = async () => {
    try {
      // Mock data - replace with real API calls
      const mockAlerts: PriceAlert[] = [
        {
          id: '1',
          crop: 'rice',
          currentPrice: 15500,
          targetPrice: 16000,
          condition: 'above',
          isActive: true,
          lastTriggered: '2024-01-10'
        }
      ];

      const mockBuyers: Buyer[] = [
        {
          id: '1',
          name: 'Chiang Mai Rice Co-op',
          location: 'Chiang Mai, Thailand',
          phone: '+66 53 123 456',
          lineId: '@cmricecoop',
          rating: 4.8,
          pickupHours: 'Mon-Fri 8:00-17:00',
          specialties: ['Jasmine Rice', 'Organic Rice'],
          distance: 5.2,
          lastPrice: 15750,
          priceTrend: 'up'
        },
        {
          id: '2',
          name: 'Golden Grain Trading',
          location: 'Bangkok, Thailand',
          phone: '+66 2 987 654',
          lineId: '@goldengrain',
          rating: 4.5,
          pickupHours: 'Mon-Sat 7:00-18:00',
          specialties: ['Premium Rice', 'Export Quality'],
          distance: 12.8,
          lastPrice: 15200,
          priceTrend: 'stable'
        },
        {
          id: '3',
          name: 'Local Farm Market',
          location: 'Chiang Mai, Thailand',
          phone: '+66 53 555 123',
          rating: 4.2,
          pickupHours: 'Daily 6:00-20:00',
          specialties: ['Local Varieties', 'Fresh Harvest'],
          distance: 2.1,
          lastPrice: 14800,
          priceTrend: 'down'
        }
      ];

      setAlerts(mockAlerts);
      setBuyers(mockBuyers);
    } catch (error) {
      console.error('Failed to fetch price data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const handleAddAlert = () => {
    if (newAlert.targetPrice <= 0) {
      alert('Please enter a valid target price');
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      crop: newAlert.crop,
      currentPrice: 0, // Will be fetched from API
      targetPrice: newAlert.targetPrice,
      condition: newAlert.condition,
      isActive: true
    };

    setAlerts(prev => [...prev, alert]);
    setNewAlert({ crop: cropType, targetPrice: 0, condition: 'above' });
    setShowAddAlert(false);
    alert('Price alert created successfully!');
  };

  const handleCallBuyer = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleLineMessage = (lineId: string) => {
    window.open(`https://line.me/ti/p/${lineId}`, '_blank');
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Price Alerts</span>
            </div>
            <Button
              onClick={() => setShowAddAlert(!showAddAlert)}
              size="sm"
              variant="outline"
            >
              Add Alert
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Alert Form */}
          {showAddAlert && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-3">Create Price Alert</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Crop</label>
                  <Input
                    value={newAlert.crop}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, crop: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Target Price (฿/ton)</label>
                  <Input
                    type="number"
                    value={newAlert.targetPrice}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, targetPrice: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Condition</label>
                  <select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value as 'above' | 'below' }))}
                    className="mt-1 w-full p-2 border rounded-md"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button onClick={handleAddAlert} size="sm">
                  Create Alert
                </Button>
                <Button 
                  onClick={() => setShowAddAlert(false)} 
                  size="sm" 
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Active Alerts */}
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold">{alert.crop}</h4>
                    <Badge variant="outline">
                      {alert.condition === 'above' ? 'Above' : 'Below'} ฿{alert.targetPrice.toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Current: ฿{alert.currentPrice.toLocaleString()}/ton
                  </p>
                  {alert.lastTriggered && (
                    <p className="text-xs text-gray-500">
                      Last triggered: {alert.lastTriggered}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={alert.isActive}
                    onCheckedChange={() => handleToggleAlert(alert.id)}
                  />
                  <span className="text-sm text-gray-600">
                    {alert.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
            
            {alerts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No price alerts yet</p>
                <p className="text-sm">Create your first alert to get notified of price changes</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buyer Directory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Local Buyers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {buyers.map((buyer) => (
              <div key={buyer.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-lg">{buyer.name}</h4>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{buyer.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{buyer.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>{buyer.distance}km away</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">
                          ฿{buyer.lastPrice.toLocaleString()}/ton
                        </span>
                        <div className={`flex items-center ${getTrendColor(buyer.priceTrend)}`}>
                          {getTrendIcon(buyer.priceTrend)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{buyer.pickupHours}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {buyer.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleCallBuyer(buyer.phone)}
                    size="sm"
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  {buyer.lineId && (
                    <Button
                      onClick={() => handleLineMessage(buyer.lineId!)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      LINE
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
