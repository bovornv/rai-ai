import { MapPin, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationChipProps {
  currentArea: string | null;
  onLocationClick: () => void;
}

export const LocationChip = ({ 
  currentArea, 
  onLocationClick 
}: LocationChipProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onLocationClick}
      className="flex items-center gap-2 bg-card text-foreground border-border hover:bg-accent"
    >
      <MapPin className="h-4 w-4 text-primary" />
      <span className="text-sm">
        {currentArea || "ตั้งพื้นที่ของคุณ"}
      </span>
      <Edit2 className="h-3 w-3 text-muted-foreground" />
    </Button>
  );
};