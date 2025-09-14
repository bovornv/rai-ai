import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MismatchBannerProps {
  fieldName: string;
  onUseFieldLocation: () => void;
  onKeepCurrentLocation: () => void;
  onDismiss: () => void;
}

export const MismatchBanner = ({
  fieldName,
  onUseFieldLocation,
  onKeepCurrentLocation,
  onDismiss
}: MismatchBannerProps) => {
  return (
    <Alert className="mb-4 border-warning bg-warning/10">
      <MapPin className="h-4 w-4 text-warning" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm">
            ตำแหน่งไม่ตรงกับแปลง '{fieldName}' — ใช้ตำแหน่งแปลงแทนไหม?
          </p>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onUseFieldLocation}
            className="text-xs"
          >
            ใช้ตำแหน่งแปลง
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onKeepCurrentLocation}
            className="text-xs"
          >
            คงเดิม
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};