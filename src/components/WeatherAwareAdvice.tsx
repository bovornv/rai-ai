import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Cloud, Wind, Droplets, Calendar, AlertTriangle } from "lucide-react";

interface WeatherForecast {
  date: string;
  rain: number;
  wind: number;
  humidity: number;
  temperature: number;
  conditions: string;
}

interface CropStage {
  stage: string;
  daysFromPlanting: number;
  nextStage: string;
  daysToNext: number;
}

interface Advice {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  weatherDependent: boolean;
  cropStage: string;
  dueDate: string;
  completed: boolean;
  weatherCondition?: string;
}

interface WeatherAwareAdviceProps {
  cropType: 'rice' | 'durian';
  fieldId: string;
}

export function WeatherAwareAdvice({ cropType, fieldId }: WeatherAwareAdviceProps) {
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [cropStage, setCropStage] = useState<CropStage | null>(null);
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeatherAwareAdvice();
  }, [cropType, fieldId]);

  const fetchWeatherAwareAdvice = async () => {
    try {
      // Mock data - replace with real API calls
      const mockForecast: WeatherForecast[] = [
        {
          date: '2024-01-15',
          rain: 0.2,
          wind: 8.5,
          humidity: 65,
          temperature: 28,
          conditions: 'Partly cloudy'
        },
        {
          date: '2024-01-16',
          rain: 2.1,
          wind: 12.3,
          humidity: 78,
          temperature: 26,
          conditions: 'Light rain'
        },
        {
          date: '2024-01-17',
          rain: 0.5,
          wind: 6.8,
          humidity: 70,
          temperature: 29,
          conditions: 'Sunny'
        }
      ];

      const mockCropStage: CropStage = {
        stage: 'Vegetative Growth',
        daysFromPlanting: 45,
        nextStage: 'Flowering',
        daysToNext: 15
      };

      const mockAdvice: Advice[] = [
        {
          id: '1',
          title: 'Apply Nitrogen Fertilizer',
          description: 'Apply 50kg/ha of urea during vegetative stage. Best done before rain.',
          priority: 'high',
          weatherDependent: true,
          cropStage: 'Vegetative Growth',
          dueDate: '2024-01-16',
          completed: false,
          weatherCondition: 'Apply before rain on Jan 16'
        },
        {
          id: '2',
          title: 'Monitor for Disease',
          description: 'Check for rice blast symptoms. High humidity increases risk.',
          priority: 'medium',
          weatherDependent: true,
          cropStage: 'Vegetative Growth',
          dueDate: '2024-01-17',
          completed: false,
          weatherCondition: 'High humidity expected - increase monitoring'
        },
        {
          id: '3',
          title: 'Irrigation Management',
          description: 'Reduce irrigation before flowering stage. Check soil moisture.',
          priority: 'low',
          weatherDependent: false,
          cropStage: 'Vegetative Growth',
          dueDate: '2024-01-20',
          completed: false
        }
      ];

      setForecast(mockForecast);
      setCropStage(mockCropStage);
      setAdvice(mockAdvice);
    } catch (error) {
      console.error('Failed to fetch weather-aware advice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getWeatherIcon = (conditions: string) => {
    if (conditions.includes('rain')) return <Droplets className="h-4 w-4 text-blue-500" />;
    if (conditions.includes('cloud')) return <Cloud className="h-4 w-4 text-gray-500" />;
    if (conditions.includes('wind')) return <Wind className="h-4 w-4 text-gray-400" />;
    return <Cloud className="h-4 w-4 text-yellow-500" />;
  };

  const handleSetReminder = (adviceId: string) => {
    // Set reminder for specific advice
    alert(`Reminder set for: ${advice.find(a => a.id === adviceId)?.title}`);
  };

  const handleCompleteAdvice = (adviceId: string) => {
    setAdvice(prev => prev.map(a => 
      a.id === adviceId ? { ...a, completed: true } : a
    ));
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
    <div className="space-y-4">
      {/* Weather Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="h-5 w-5" />
            <span>3-Day Weather Forecast</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forecast.map((day, index) => (
              <div key={index} className="text-center p-3 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {getWeatherIcon(day.conditions)}
                  <span className="ml-2 text-sm font-medium">{day.conditions}</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Rain: {day.rain}mm</div>
                  <div>Wind: {day.wind} km/h</div>
                  <div>Temp: {day.temperature}°C</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Crop Stage */}
      {cropStage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Crop Stage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{cropStage.stage}</h3>
                <p className="text-sm text-gray-600">
                  {cropStage.daysFromPlanting} days from planting
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Next: {cropStage.nextStage}</p>
                <p className="text-xs text-gray-500">
                  {cropStage.daysToNext} days to go
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather-Aware Advice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Weather-Aware Advice</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {advice.map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-lg ${
                  item.completed ? 'bg-gray-50 opacity-75' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {item.title}
                      </h4>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      {item.weatherDependent && (
                        <Badge variant="outline" className="text-blue-600">
                          Weather
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      {item.description}
                    </p>
                    
                    {item.weatherCondition && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                        <p className="text-xs text-blue-800">
                          <Cloud className="h-3 w-3 inline mr-1" />
                          {item.weatherCondition}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Due: {item.dueDate}</span>
                      <span>Stage: {item.cropStage}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => handleSetReminder(item.id)}
                      size="sm"
                      variant="outline"
                      disabled={item.completed}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      Remind
                    </Button>
                    
                    {!item.completed && (
                      <Button
                        onClick={() => handleCompleteAdvice(item.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
