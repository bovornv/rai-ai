import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { computeSprayBadge, getForecastCached, forecastSummary } from '@/weather';
import { getWeatherConfig } from '@/config/weather';
import { type LatLon, type SprayVerdict, type Forecast } from '@/weather/types';

const WeatherDemo = () => {
  const [sprayVerdict, setSprayVerdict] = useState<SprayVerdict | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crop, setCrop] = useState<'rice' | 'durian'>('rice');

  const config = getWeatherConfig();
  const keys = {
    MS_API_KEY: config.MS_API_KEY,
    OWM_API_KEY: config.OWM_API_KEY
  };

  const testLocation: LatLon = { lat: 13.7563, lon: 100.5018 }; // Bangkok

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🌦️ Testing weather integration...');
      
      // Test spray window decision
      const verdict = await computeSprayBadge(
        { lat: testLocation.lat, lon: testLocation.lon, crop },
        keys
      );
      setSprayVerdict(verdict);
      
      // Test forecast data
      const fc = await getForecastCached(testLocation, keys);
      setForecast(fc);
      
      console.log('✅ Weather integration test successful');
      console.log('Forecast summary:', forecastSummary(fc));
      console.log('Spray verdict:', verdict);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('❌ Weather integration test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [crop]);

  const getVerdictColor = (level: string) => {
    switch (level) {
      case 'GOOD': return 'bg-green-500';
      case 'CAUTION': return 'bg-yellow-500';
      case 'DON\'T': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getVerdictIcon = (level: string) => {
    switch (level) {
      case 'GOOD': return '✅';
      case 'CAUTION': return '⚠️';
      case 'DON\'T': return '🚫';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌦️ Weather Service Integration Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex gap-4 items-center">
            <Button 
              onClick={fetchWeatherData} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Test Weather APIs'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant={crop === 'rice' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCrop('rice')}
              >
                Rice
              </Button>
              <Button
                variant={crop === 'durian' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCrop('durian')}
              >
                Durian
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Error</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Spray Window Result */}
          {sprayVerdict && (
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-semibold mb-3">Spray Window Decision ({crop})</h3>
              <div className="flex items-center gap-3">
                <Badge className={`${getVerdictColor(sprayVerdict.level)} text-white`}>
                  {getVerdictIcon(sprayVerdict.level)} {sprayVerdict.level}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {sprayVerdict.reason_th}
                </span>
              </div>
              {sprayVerdict.confidence && (
                <p className="text-xs text-muted-foreground mt-2">
                  Confidence: {Math.round(sprayVerdict.confidence * 100)}%
                </p>
              )}
              {sprayVerdict.next_safe_hour && (
                <p className="text-xs text-muted-foreground mt-1">
                  Next safe hour: {new Date(sprayVerdict.next_safe_hour).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Forecast Data */}
          {forecast && (
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-semibold mb-3">Forecast Data</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Source:</span>
                  <span className="ml-2 font-medium">{forecast.source}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Issued:</span>
                  <span className="ml-2 font-medium">
                    {new Date(forecast.issuedISO).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hours:</span>
                  <span className="ml-2 font-medium">{forecast.hourly.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <span className="ml-2 font-medium">{forecast.geohash5}</span>
                </div>
              </div>
              
              {/* Sample hourly data */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Next 6 Hours Sample:</h4>
                <div className="space-y-2">
                  {forecast.hourly.slice(0, 6).map((hour, index) => (
                    <div key={index} className="flex justify-between text-xs bg-muted/50 rounded p-2">
                      <span>{new Date(hour.timeISO).toLocaleTimeString()}</span>
                      <div className="flex gap-4">
                        <span>🌧️ {hour.rain_mm.toFixed(1)}mm</span>
                        <span>💨 {hour.wind_ms.toFixed(1)}m/s</span>
                        <span>📊 {(hour.pop * 100).toFixed(0)}%</span>
                        <span>🌡️ {hour.temp_c?.toFixed(1)}°C</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Configuration Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Configuration</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>TTL: {config.TTL_MINUTES} min</div>
              <div>Throttle: {config.THROTTLE_MINUTES} min</div>
              <div>Fallback: {config.USE_FALLBACK ? 'Enabled' : 'Disabled'}</div>
              <div>Horizon: {config.HORIZON_HOURS} hours</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherDemo;
