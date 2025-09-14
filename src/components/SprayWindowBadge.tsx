import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Wind, Droplets, Cloud } from "lucide-react";

interface WeatherData {
  rain: number;
  wind: number;
  humidity: number;
  next12h: {
    rain: number;
    wind: number;
  };
}

interface SprayWindowBadgeProps {
  onReminderSet?: () => void;
}

export function SprayWindowBadge({ onReminderSet }: SprayWindowBadgeProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [sprayStatus, setSprayStatus] = useState<'good' | 'caution' | 'dont'>('good');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate weather data fetch (replace with real API)
    const fetchWeatherData = async () => {
      try {
        // Mock weather data - replace with real API call
        const mockWeather: WeatherData = {
          rain: 0.2,
          wind: 8.5,
          humidity: 65,
          next12h: {
            rain: 0.1,
            wind: 6.2
          }
        };
        
        setWeather(mockWeather);
        calculateSprayStatus(mockWeather);
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  const calculateSprayStatus = (weather: WeatherData) => {
    const { rain, wind } = weather.next12h;
    
    // Spray conditions logic
    if (rain > 2 || wind > 15) {
      setSprayStatus('dont');
    } else if (rain > 0.5 || wind > 10) {
      setSprayStatus('caution');
    } else {
      setSprayStatus('good');
    }
  };

  const getStatusConfig = () => {
    switch (sprayStatus) {
      case 'good':
        return {
          label: 'Good to Spray',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: Droplets,
          description: 'Perfect conditions for spraying'
        };
      case 'caution':
        return {
          label: 'Caution',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          icon: Wind,
          description: 'Spray with caution - check wind/rain'
        };
      case 'dont':
        return {
          label: "Don't Spray",
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          icon: Cloud,
          description: 'Avoid spraying - poor conditions'
        };
    }
  };

  const handleSetReminder = () => {
    // Set reminder for next spray window
    onReminderSet?.();
    // Show success message
    alert('Reminder set for next spray window!');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`w-full border-l-8 ${config.color} ${config.bgColor} shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${config.bgColor} border-2 ${config.color.replace('bg-', 'border-')}`}>
              <Icon className={`h-8 w-8 ${config.textColor}`} />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className={`font-thai font-bold text-farmer-2xl ${config.textColor}`}>
                  {config.label}
                </h3>
                <Badge variant="outline" className={`${config.textColor} font-thai text-farmer-sm px-3 py-1`}>
                  ต่อไป 12 ชั่วโมง
                </Badge>
              </div>
              <p className={`font-thai text-farmer-lg ${config.textColor} opacity-90`}>
                {config.description}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleSetReminder}
            variant="outline"
            size="lg"
            className={`farmer-button border-2 ${config.color.replace('bg-', 'border-')} ${config.textColor} hover:${config.bgColor}`}
          >
            <Bell className="h-5 w-5 mr-2" />
            <span className="font-thai font-medium">เตือน</span>
          </Button>
        </div>
        
        {weather && (
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 bg-white bg-opacity-50 rounded-lg p-3">
              <Droplets className="h-6 w-6 text-thai-blue" />
              <div>
                <span className="font-thai text-farmer-sm text-gray-600">ฝน</span>
                <div className="font-thai font-bold text-farmer-lg">{weather.next12h.rain}mm</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white bg-opacity-50 rounded-lg p-3">
              <Wind className="h-6 w-6 text-gray-600" />
              <div>
                <span className="font-thai text-farmer-sm text-gray-600">ลม</span>
                <div className="font-thai font-bold text-farmer-lg">{weather.next12h.wind} km/h</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
