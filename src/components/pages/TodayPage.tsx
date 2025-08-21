import { useState, useEffect } from "react";
import { CloudRain, AlertTriangle, CheckCircle, DollarSign, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CropType } from "../RaiAIApp";
import { LocationChip } from "@/components/LocationChip";
import { LocationBottomSheet } from "@/components/LocationBottomSheet";
import { Analytics } from "@/lib/analytics";

interface TodayPageProps {
  selectedCrop: CropType;
  onCropChange: (crop: CropType) => void;
  onNavigate: (view: 'today' | 'scan' | 'fields') => void;
}

const TodayPage = ({ selectedCrop, onCropChange, onNavigate }: TodayPageProps) => {
  const [sprayStatus] = useState<'good' | 'caution' | 'stop'>('good');
  const [currentArea, setCurrentArea] = useState<string | null>('ต.เทพาลัย, นครราชสีมา');
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  
  const sprayStatusConfig = {
    good: {
      icon: CheckCircle,
      text: "ฉีดพ่นได้ · Good to Spray",
      color: "bg-spray-good text-white",
      description: "ลมสงบ, ไม่มีฝน 12 ชม."
    },
    caution: {
      icon: AlertTriangle,
      text: "ระวัง · Caution",
      color: "bg-spray-caution text-black",
      description: "ลมแรง หรือ อาจมีฝน"
    },
    stop: {
      icon: AlertTriangle,
      text: "ห้ามฉีด · Don't Spray",
      color: "bg-spray-stop text-white",
      description: "ฝนตก หรือ ลมแรงมาก"
    }
  };

  const currentSpray = sprayStatusConfig[sprayStatus];
  const SprayIcon = currentSpray.icon;

  const handleLocationSet = (area: { name: string; lat: number; lng: number; geohash: string }) => {
    setCurrentArea(area.name);
    Analytics.trackLocationSetMethod('current', false); // This would be dynamic based on method used
  };

  // Track spray window view
  useEffect(() => {
    Analytics.trackSprayWindowViewed(selectedCrop, sprayStatus);
  }, [selectedCrop, sprayStatus]);

  return (
    <div className="p-4 space-y-4">
      {/* Header with Location */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-primary">วันนี้</h1>
          <p className="text-sm text-muted-foreground">จันทร์ 21 ต.ค. 2567</p>
        </div>
        <LocationChip
          currentArea={currentArea}
          onLocationClick={() => {
            setShowLocationSheet(true);
            Analytics.trackLocationSheetOpened('today');
          }}
        />
      </div>

      {/* Crop Selection Chips */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedCrop === 'rice' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCropChange('rice')}
          className="rounded-full"
        >
          🌾 ข้าว
        </Button>
        <Button
          variant={selectedCrop === 'durian' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCropChange('durian')}
          className="rounded-full"
        >
          🌿 ทุเรียน
        </Button>
      </div>

      {/* Spray Window Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SprayIcon className="h-5 w-5" />
            ช่วงเวลาฉีดพ่น · Spray Window
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge className={`${currentSpray.color} px-3 py-1 text-sm font-medium`}>
            {currentSpray.text}
          </Badge>
          <p className="text-sm text-muted-foreground">{currentSpray.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CloudRain className="h-4 w-4" />
            อัปเดตล่าสุด: 08:30 น.
          </div>
        </CardContent>
      </Card>

      {/* Outbreak Radar */}
      <Card className="border-2 border-warning/30 bg-warning/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-warning" />
            เตือนโรคระบาด · Outbreak Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <strong className="text-warning">โรคใบจุดสีน้ำตาล</strong> กำลังระบาดในรัศมี 3 กม.
          </div>
          <p className="text-xs text-muted-foreground">
            แนะนำ: ตรวจสอบใบข้าวทุกวัน และฉีดป้องกันหากพบอาการ
          </p>
          <Button size="sm" variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            แชร์เตือนเพื่อนบ้าน
          </Button>
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">งานวันนี้ · Today's Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <div className="font-medium text-sm">ตรวจแปลงที่ 2 อีกครั้ง</div>
              <div className="text-xs text-muted-foreground">Follow-up scan</div>
            </div>
            <Button size="sm" onClick={() => onNavigate('fields')}>
              ดู
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <div className="font-medium text-sm">ใส่ปุ๋ยแปลงใหญ่</div>
              <div className="text-xs text-muted-foreground">Apply fertilizer</div>
            </div>
            <Button size="sm" variant="outline">
              ทำแล้ว
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Price Snapshot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            ราคาวันนี้ · Today's Prices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">12,500</div>
              <div className="text-xs text-muted-foreground">บาท/ตัน</div>
              <div className="text-xs text-healthy">+200 บาท</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">เป้าหมาย</div>
              <div className="text-lg font-semibold">13,000</div>
              <Button size="sm" variant="outline" className="mt-1">
                ตั้งแจ้งเตือน
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <LocationBottomSheet
        isOpen={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        onLocationSet={handleLocationSet}
        currentArea={currentArea}
      />
    </div>
  );
};

export default TodayPage;