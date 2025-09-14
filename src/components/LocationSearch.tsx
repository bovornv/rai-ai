import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Loader2, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
import { geocodeAddress, type GeocodeResult } from '@/lib/geocoding';

// Use the GeocodeResult type from the geocoding service
type LocationResult = GeocodeResult;

interface LocationSearchProps {
  onLocationSelected?: (lat: number, lng: number, address: string) => void;
  className?: string;
}

const LocationSearch = ({ onLocationSelected, className = "" }: LocationSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Use the real geocoding service

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (query.trim().length >= 2) {
            performSearch(query);
          } else {
            setSearchResults([]);
          }
        }, 300);
      };
    })(),
    []
  );

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);

  const performSearch = async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const results = await geocodeAddress(query);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (result: LocationResult) => {
    setSelectedLocation(result);
    setSearchQuery(result.formatted);
    setSearchResults([]);
    
    if (onLocationSelected) {
      onLocationSelected(result.lat, result.lon, result.formatted);
    }
  };

  const handleGetCurrentLocation = async () => {
    setGpsLoading(true);
    setError(null);

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
      
      // Create a mock location result for GPS coordinates
      const gpsLocation: LocationResult = {
        formatted: `ตำแหน่งปัจจุบัน (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        lat: latitude,
        lon: longitude,
        source: 'mock'
      };

      setSelectedLocation(gpsLocation);
      setSearchQuery(gpsLocation.formatted);
      
      if (onLocationSelected) {
        onLocationSelected(latitude, longitude, gpsLocation.formatted);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      setError(`ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGpsLoading(false);
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'google': return 'bg-blue-500';
      case 'mapbox': return 'bg-green-500';
      case 'mock': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'google': return 'Google Maps';
      case 'mapbox': return 'Mapbox';
      case 'mock': return 'Demo Data';
      default: return 'Unknown';
    }
  };

  const getSourceDescription = (source: string) => {
    switch (source) {
      case 'google': return 'Real-time data from Google Maps API';
      case 'mapbox': return 'Real-time data from Mapbox API';
      case 'mock': return 'Sample data for testing';
      default: return 'Unknown source';
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span className="truncate">ค้นหาตำแหน่งที่ตั้ง</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            🌐 Live API
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        {/* Search Input */}
        <div className="w-full">
          <Label htmlFor="location-search" className="text-sm font-medium">ค้นหาตำแหน่ง</Label>
          <div className="relative mt-1">
            <Input
              id="location-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์ที่อยู่ เช่น กรุงเทพมหานคร, สีลม, เชียงใหม่"
              className="w-full pr-10 h-10 sm:h-11 text-sm sm:text-base"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 w-full">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm leading-relaxed break-words">{error}</span>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 w-full">
            <h4 className="font-semibold text-sm">ผลการค้นหา:</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors w-full"
                  onClick={() => handleLocationSelect(result)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base break-words">{result.formatted}</p>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
                        </Badge>
                        {result.province && (
                          <Badge variant="secondary" className="text-xs">
                            {result.province}
                          </Badge>
                        )}
                        {result.amphoe && (
                          <Badge variant="secondary" className="text-xs">
                            {result.amphoe}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${getSourceColor(result.source)}`} />
                      <span className="text-xs text-muted-foreground" title={getSourceDescription(result.source)}>
                        {getSourceText(result.source)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 w-full">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-green-700 font-medium text-sm sm:text-base">ตำแหน่งที่เลือก:</span>
            </div>
            <p className="text-green-800 mt-1 text-sm sm:text-base break-words">{selectedLocation.formatted}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
              </Badge>
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${getSourceColor(selectedLocation.source)}`} />
                {getSourceText(selectedLocation.source)}
              </Badge>
            </div>
          </div>
        )}

        {/* GPS Button */}
        <div className="flex justify-center w-full">
          <Button
            onClick={handleGetCurrentLocation}
            disabled={gpsLoading}
            variant="outline"
            className="w-full sm:w-auto sm:min-w-[200px] h-10 sm:h-11"
          >
            {gpsLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
            ) : (
              <Navigation className="h-4 w-4 mr-2 flex-shrink-0" />
            )}
            <span className="text-sm sm:text-base truncate">
              {gpsLoading ? 'กำลังค้นหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบัน (GPS)'}
            </span>
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs sm:text-sm text-muted-foreground space-y-1 w-full">
          <p><strong>วิธีใช้:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2 break-words">
            <li>พิมพ์ที่อยู่ที่ต้องการค้นหา</li>
            <li>เลือกผลการค้นหาที่ตรงกับตำแหน่งของคุณ</li>
            <li>หรือใช้ปุ่ม GPS เพื่อหาตำแหน่งปัจจุบัน</li>
            <li>ระบบใช้ Google Maps API (หลัก) และ Mapbox API (สำรอง)</li>
            <li>ข้อมูลแสดงแบบเรียลไทม์จาก API จริง</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationSearch;
