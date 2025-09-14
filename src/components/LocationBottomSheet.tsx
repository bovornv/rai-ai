import { useState } from 'react';
import { MapPin, Search, Map, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Analytics } from "@/lib/analytics";
import { AreaSearchService } from '@/lib/area-search';
import { LocationService } from '@/lib/location-service';

interface LocationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (area: { name: string; lat: number; lng: number; geohash: string }) => void;
  currentArea?: string;
}

export const LocationBottomSheet = ({
  isOpen,
  onClose,
  onLocationSet,
  currentArea
}: LocationBottomSheetProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUseCurrentLocation = async () => {
    try {
      const location = await LocationService.resolveCoarseOnce();
      const area = await AreaSearchService.getAreaFromCoords(location.lat, location.lng);
      
      onLocationSet({
        name: area.name,
        lat: location.lat,
        lng: location.lng,
        geohash: location.geohash
      });
      
      Analytics.trackLocationSetMethod('current', false);
      toast.success('ตั้งตำแหน่งเรียบร้อย');
      onClose();
    } catch (error) {
      Analytics.trackPermissionStateChanged('denied');
      toast.error('ไม่สามารถเข้าถึงตำแหน่งได้');
    }
  };

  const handleSearchArea = () => {
    setIsSearching(true);
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    
    const results = await AreaSearchService.search(searchQuery);
    setSearchResults(results);
  };

  const handleSelectSearchResult = (result: any) => {
    onLocationSet({
      name: result.name,
      lat: result.lat,
      lng: result.lng,
      geohash: result.geohash
    });
    
    Analytics.trackLocationSetMethod('search', false);
    toast.success('ตั้งพื้นที่เรียบร้อย');
    onClose();
  };

  const handleSkip = () => {
    Analytics.trackLocationSetMethod('skip', false);
    onClose();
    toast.info('คุณสามารถตั้งพื้นที่ได้ทุกเมื่อ');
  };

  if (isSearching) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>ค้นหาพื้นที่</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearching(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="จังหวัด, อำเภอ, หรือตำบล"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 p-3 border border-border rounded-md bg-background"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
              <Button onClick={handleSearchSubmit}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full text-left justify-start h-auto p-4"
                >
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {result.province} › {result.district}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>ตั้งพื้นที่ของคุณ</SheetTitle>
          <SheetDescription>
            แอปใช้ตำแหน่งเพื่อพยากรณ์ฝนและเตือนโรคในพื้นที่ — ไม่ติดตามตลอดเวลา
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-3 mt-6">
          <Button
            onClick={handleUseCurrentLocation}
            className="w-full flex items-center gap-3"
            size="lg"
          >
            <MapPin className="h-5 w-5" />
            ใช้ตำแหน่งปัจจุบัน
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSearchArea}
            className="w-full flex items-center gap-3"
            size="lg"
          >
            <Search className="h-5 w-5" />
            ค้นหาพื้นที่
          </Button>
          
          <Button
            variant="outline"
            onClick={() => toast.info('แผนที่จะมาใน version ถัดไป')}
            className="w-full flex items-center gap-3"
            size="lg"
          >
            <Map className="h-5 w-5" />
            ปักหมุดบนแผนที่
          </Button>
          
          <Separator className="my-4" />
          
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full"
            size="lg"
          >
            ข้ามไปก่อน
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};