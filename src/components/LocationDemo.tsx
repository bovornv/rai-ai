import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import LocationSelector from './LocationSelector';
import { geocodeWithFallback, reverseWithFallback } from '@/lib/location-service-fallback';

interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  areaInfo?: any;
}

const LocationDemo = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLocationSelected = (lat: number, lng: number, address: string, areaInfo?: any) => {
    const newLocation: LocationInfo = { lat, lng, address, areaInfo };
    setCurrentLocation(newLocation);
    setLocationHistory(prev => [newLocation, ...prev.slice(0, 4)]); // Keep last 5
  };

  // API Keys (in production, use environment variables)
  const API_KEYS = {
    GOOGLE_MAPS_API_KEY: "AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k",
    MAPBOX_ACCESS_TOKEN: "pk.eyJ1IjoiYm92b3JuIiwiYSI6ImNtZjl3ZWY3dzA3Ym8ycm9lbTQzcmo5ankifQ.LvMa5fl8cpeXL8Za5Vroug"
  };

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use real reverse geocoding
      try {
        const results = await reverseWithFallback(latitude, longitude, API_KEYS);
        if (results.length > 0) {
          const result = results[0];
          handleLocationSelected(latitude, longitude, result.formatted, {
            source: result.source,
            accuracy: position.coords.accuracy,
            province: result.province,
            amphoe: result.amphoe,
            tambon: result.tambon
          });
        } else {
          // Fallback if no results
          const fallbackAddress = `ตำแหน่งปัจจุบัน (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          handleLocationSelected(latitude, longitude, fallbackAddress, {
            source: 'gps',
            accuracy: position.coords.accuracy
          });
        }
      } catch (geocodingError) {
        console.warn('Reverse geocoding failed:', geocodingError);
        // Fallback if geocoding fails
        const fallbackAddress = `ตำแหน่งปัจจุบัน (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        handleLocationSelected(latitude, longitude, fallbackAddress, {
          source: 'gps',
          accuracy: position.coords.accuracy
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      alert(`ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setCurrentLocation(null);
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'google': return 'bg-blue-500';
      case 'mapbox': return 'bg-green-500';
      case 'opencage': return 'bg-orange-500';
      case 'boundaries': return 'bg-purple-500';
      case 'gps': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceText = (source?: string) => {
    switch (source) {
      case 'google': return 'Google Maps';
      case 'mapbox': return 'Mapbox';
      case 'opencage': return 'OpenCage';
      case 'boundaries': return 'Thailand Boundaries';
      case 'gps': return 'GPS';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Location Service Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Location Display */}
          {currentLocation && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">ตำแหน่งปัจจุบัน</h3>
              <div className="space-y-2">
                <p className="font-medium">{currentLocation.address}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </Badge>
                  {currentLocation.areaInfo?.source && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getSourceColor(currentLocation.areaInfo.source)}`} />
                      {getSourceText(currentLocation.areaInfo.source)}
                    </Badge>
                  )}
                </div>
                {currentLocation.areaInfo && (
                  <div className="text-sm text-muted-foreground">
                    {currentLocation.areaInfo.province_code && (
                      <span>จังหวัด: {currentLocation.areaInfo.province_code} </span>
                    )}
                    {currentLocation.areaInfo.amphoe_code && (
                      <span>อำเภอ: {currentLocation.areaInfo.amphoe_code} </span>
                    )}
                    {currentLocation.areaInfo.tambon_code && (
                      <span>ตำบล: {currentLocation.areaInfo.tambon_code}</span>
                    )}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearLocation}
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  ล้างตำแหน่ง
                </Button>
              </div>
            </div>
          )}

          {/* Location Selection */}
          <LocationSelector
            onLocationSelected={handleLocationSelected}
            initialLocation={currentLocation || undefined}
          />

          {/* GPS Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGetCurrentLocation}
              disabled={loading}
              variant="outline"
              className="w-full max-w-xs"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {loading ? 'กำลังค้นหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบัน (GPS)'}
            </Button>
          </div>

          {/* Location History */}
          {locationHistory.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">ประวัติตำแหน่งล่าสุด</h3>
              <div className="space-y-2">
                {locationHistory.map((location, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setCurrentLocation(location)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{location.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                          </Badge>
                          {location.areaInfo?.source && (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${getSourceColor(location.areaInfo.source)}`} />
                              {getSourceText(location.areaInfo.source)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {currentLocation?.lat === location.lat && currentLocation?.lng === location.lng && (
                        <Badge variant="default" className="text-xs">ปัจจุบัน</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">ข้อมูล API</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Primary:</strong> Google Maps Geocoding API</p>
              <p><strong>Fallback:</strong> Mapbox Geocoding API</p>
              <p><strong>Language:</strong> Thai (th) with English fallback</p>
              <p><strong>Features:</strong> Forward & reverse geocoding, Places autocomplete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationDemo;
