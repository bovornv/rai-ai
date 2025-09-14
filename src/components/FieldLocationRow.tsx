import { MapPin, Search, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LocationService } from '@/lib/location-service';

interface FieldLocationRowProps {
  onLocationSet: (location: { lat: number; lng: number; name: string }) => void;
  currentLocation?: { lat: number; lng: number; name: string };
}

export const FieldLocationRow = ({
  onLocationSet,
  currentLocation
}: FieldLocationRowProps) => {
  const handleUseCurrent = async () => {
    try {
      const location = await LocationService.resolvePreciseOnce();
      onLocationSet({
        lat: location.lat,
        lng: location.lng,
        name: 'ตำแหน่งปัจจุบัน'
      });
      toast.success('ตั้งตำแหน่งแปลงเรียบร้อย');
    } catch (error) {
      toast.error('ไม่สามารถเข้าถึงตำแหน่งได้');
    }
  };

  const handleSearchArea = () => {
    toast.info('เปิดหน้าค้นหาพื้นที่');
    // This would open the same area search as LocationBottomSheet
  };

  const handlePinOnMap = () => {
    toast.info('แผนที่จะมาใน version ถัดไป');
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">ตำแหน่งแปลง</label>
      
      {currentLocation && (
        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
          📍 {currentLocation.name}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseCurrent}
          className="flex-1"
        >
          <MapPin className="h-4 w-4 mr-2" />
          ใช้ตำแหน่งปัจจุบัน
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearchArea}
          className="flex-1"
        >
          <Search className="h-4 w-4 mr-2" />
          ค้นหา
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handlePinOnMap}
          className="flex-1"
        >
          <Map className="h-4 w-4 mr-2" />
          ปักหมุด
        </Button>
      </div>
    </div>
  );
};