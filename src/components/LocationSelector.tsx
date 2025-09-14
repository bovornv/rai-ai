import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { geocodeWithFallback, reverseWithFallback, type NormalizedAddress } from '@/lib/location-service-fallback';

interface LocationSelectorProps {
  onLocationSelected: (lat: number, lng: number, address: string, areaInfo?: any) => void;
  initialLocation?: { lat: number; lng: number; address: string };
  showAreaSelector?: boolean;
  className?: string;
}

const LocationSelector = ({ 
  onLocationSelected, 
  initialLocation,
  showAreaSelector = true,
  className = ""
}: LocationSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState(initialLocation?.address || '');
  const [searchResults, setSearchResults] = useState<NormalizedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Keys (in production, use environment variables)
  const API_KEYS = {
    GOOGLE_MAPS_API_KEY: "AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k",
    MAPBOX_ACCESS_TOKEN: "pk.eyJ1IjoiYm92b3JuIiwiYSI6ImNtZjl3ZWY3dzA3Ym8ycm9lbTQzcmo5ankifQ.LvMa5fl8cpeXL8Za5Vroug"
  };

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
      const results = await geocodeWithFallback(query, API_KEYS);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (result: NormalizedAddress) => {
    onLocationSelected(
      result.lat, 
      result.lon, 
      result.formatted,
      {
        province: result.province,
        amphoe: result.amphoe,
        tambon: result.tambon,
        district: result.district,
        postal_code: result.postal_code,
        country: result.country,
        source: result.source
      }
    );
    setSearchQuery(result.formatted);
    setSearchResults([]);
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'google': return 'bg-blue-500';
      case 'mapbox': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'google': return 'Google Maps';
      case 'mapbox': return 'Mapbox';
      default: return 'Unknown';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          เลือกตำแหน่งที่ตั้ง
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div>
          <Label htmlFor="location-search">ค้นหาตำแหน่ง</Label>
          <div className="relative">
            <Input
              id="location-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์ที่อยู่ เช่น กรุงเทพมหานคร, สีลม, เชียงใหม่"
              className="pr-10"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">ผลการค้นหา:</h4>
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleAddressSelect(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{result.formatted}</p>
                    <div className="flex items-center gap-2 mt-1">
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
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getSourceColor(result.source)}`} />
                    <span className="text-xs text-muted-foreground">{getSourceText(result.source)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>วิธีใช้:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>พิมพ์ที่อยู่ที่ต้องการค้นหา</li>
            <li>เลือกผลการค้นหาที่ตรงกับตำแหน่งของคุณ</li>
            <li>ระบบจะใช้ Google Maps และ Mapbox เพื่อความแม่นยำ</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationSelector;
