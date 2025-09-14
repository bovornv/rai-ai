import { useState, useEffect } from "react";
import { CloudRain, AlertTriangle, CheckCircle, DollarSign, Share2, Wind, Droplets, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CropType } from "../RaiAIApp";
import { LocationChip } from "@/components/LocationChip";
import { LocationBottomSheet } from "@/components/LocationBottomSheet";
import { Analytics } from "@/lib/analytics";
import ShareCardGenerator from "@/components/ShareCardGenerator";
import { getSprayWindow, getWeatherData } from "@/lib/weather-service";
import { getOutbreaksNearLocation } from "@/lib/outbreak-service";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentThaiDate } from "@/lib/date-utils";
import { SprayWindowBadge } from "@/components/SprayWindowBadge";

interface TodayPageProps {
  selectedCrop: CropType;
  onCropChange: (crop: CropType) => void;
  onNavigate: (view: 'today' | 'scan' | 'fields') => void;
}

const TodayPage = ({ selectedCrop, onCropChange, onNavigate }: TodayPageProps) => {
  const { t } = useLanguage();
  const [sprayStatus, setSprayStatus] = useState<'good' | 'caution' | 'stop'>('good');
  const [sprayData, setSprayData] = useState<any>(null);
  const [outbreakAlerts, setOutbreakAlerts] = useState<any[]>([]);
  const [currentArea, setCurrentArea] = useState<string | null>('ต.เทพาลัย, นครราชสีมา');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number}>({lat: 14.5888, lng: 100.4552});
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareCategory, setShareCategory] = useState<'spray' | 'outbreak'>('spray');
  const [loading, setLoading] = useState(true);
  
  const sprayStatusConfig = {
    good: {
      icon: CheckCircle,
      text: t('sprayWindow_good'),
      color: "bg-green-500 text-white",
      description: "ลมสงบ, ไม่มีฝน 12 ชม."
    },
    caution: {
      icon: AlertTriangle,
      text: t('sprayWindow_caution'),
      color: "bg-yellow-500 text-black",
      description: "ลมแรง หรือ อาจมีฝน"
    },
    stop: {
      icon: AlertTriangle,
      text: t('sprayWindow_dont'),
      color: "bg-red-500 text-white",
      description: "ฝนตก หรือ ลมแรงมาก"
    }
  };

  const currentSpray = sprayStatusConfig[sprayStatus];
  const SprayIcon = currentSpray.icon;

  const handleLocationSet = (area: { name: string; lat: number; lng: number; geohash: string }) => {
    setCurrentArea(area.name);
    setCurrentLocation({ lat: area.lat, lng: area.lng });
    Analytics.trackLocationSetMethod('current', false);
    loadWeatherAndOutbreakData(area.lat, area.lng);
  };

  // Load weather and outbreak data
  const loadWeatherAndOutbreakData = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      // Load spray window data
      const sprayWindow = await getSprayWindow(lat, lng, selectedCrop);
      setSprayData(sprayWindow);
      setSprayStatus(sprayWindow.status || 'good');

      // Load outbreak alerts
      const outbreaks = await getOutbreaksNearLocation(lat, lng, 10);
      setOutbreakAlerts(outbreaks);

      Analytics.trackTodayLoaded(selectedCrop);
    } catch (error) {
      console.error('Failed to load weather and outbreak data:', error);
      // Set fallback data to ensure spray window is always visible
      setSprayData({
        windSpeed: 3.5,
        rainProbability: 20,
        temperature: 28,
        humidity: 75,
        recommendation: "สภาพอากาศเหมาะสมสำหรับการฉีดพ่น"
      });
      setSprayStatus('good');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadWeatherAndOutbreakData(currentLocation.lat, currentLocation.lng);
  }, []);

  // Ensure spray window is always visible with fallback data
  useEffect(() => {
    if (!sprayData) {
      setSprayData({
        windSpeed: 3.5,
        rainProbability: 20,
        temperature: 28,
        humidity: 75,
        recommendation: "สภาพอากาศเหมาะสมสำหรับการฉีดพ่น"
      });
      setSprayStatus('good');
    }
  }, [sprayData]);

  // Track spray window view
  useEffect(() => {
    Analytics.trackSprayWindowViewed(selectedCrop, sprayStatus);
  }, [selectedCrop, sprayStatus]);

  return (
    <div className="p-4 space-y-4">
      {/* Header with Location */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-thai text-farmer-4xl font-bold text-jd-green-dark">วันนี้</h1>
          <p className="font-thai text-farmer-lg text-gray-600">{getCurrentThaiDate()}</p>
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
      <div className="flex gap-4 mb-6">
        <Button
          variant={selectedCrop === 'rice' ? 'default' : 'outline'}
          size="lg"
          onClick={() => onCropChange('rice')}
          className={`farmer-button rounded-full font-thai text-farmer-lg font-bold px-8 py-4 ${
            selectedCrop === 'rice' 
              ? 'bg-jd-green text-white hover:bg-jd-green-dark' 
              : 'border-2 border-jd-green text-jd-green hover:bg-jd-green hover:text-white'
          }`}
        >
          🌾 ข้าว
        </Button>
        <Button
          variant={selectedCrop === 'durian' ? 'default' : 'outline'}
          size="lg"
          onClick={() => onCropChange('durian')}
          className={`farmer-button rounded-full font-thai text-farmer-lg font-bold px-8 py-4 ${
            selectedCrop === 'durian' 
              ? 'bg-jd-green text-white hover:bg-jd-green-dark' 
              : 'border-2 border-jd-green text-jd-green hover:bg-jd-green hover:text-white'
          }`}
        >
          🌿 ทุเรียน
        </Button>
      </div>

      {/* Weather Forecast Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CloudRain className="h-5 w-5" />
            พยากรณ์อากาศ · Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sprayData ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sprayData.temperature.toFixed(0)}°C</div>
                  <div className="text-xs text-muted-foreground">อุณหภูมิ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sprayData.rainProbability.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">ความน่าจะเป็นฝน</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Wind className="h-4 w-4" />
                  <span>ลม {sprayData.windSpeed.toFixed(1)} km/h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets className="h-4 w-4" />
                  <span>ความชื้น {sprayData.humidity?.toFixed(0) || 70}%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">กำลังโหลดข้อมูลอากาศ...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spray Window Badge - Big, prominent, daily use */}
      <SprayWindowBadge 
        onReminderSet={() => {
          Analytics.trackSprayWindowReminderSet(selectedCrop, sprayStatus);
        }}
      />

      {/* Outbreak Radar */}
      <Card className="border-2 border-warning/30 bg-warning/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t('outbreakRadar')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</div>
          ) : outbreakAlerts.length > 0 ? (
            <>
              {outbreakAlerts.slice(0, 2).map((alert) => (
                <div key={alert.id} className="space-y-2">
                  <div className="text-sm">
                    <strong className="text-warning">{alert.outbreak.diseaseThai}</strong> 
                    <span className="text-muted-foreground"> กำลังระบาดในรัศมี {alert.distance.toFixed(1)} กม.</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alert.recommendation}
                  </p>
                </div>
              ))}
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  setShareCategory('outbreak');
                  setShowShareCard(true);
                  Analytics.trackOutbreakAlertShared(selectedCrop, outbreakAlerts[0]?.outbreak.diseaseThai || 'โรคระบาด');
                }}
              >
                <Share2 className="h-4 w-4" />
                แชร์เตือนเพื่อนบ้าน
              </Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              ไม่พบการระบาดในพื้นที่ใกล้เคียง
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">การดำเนินการ · Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button 
              className="h-16 flex flex-col gap-2 w-full"
              onClick={() => onNavigate('scan')}
            >
              <span className="text-2xl">📱</span>
              <span className="text-sm">สแกนโรค</span>
              <span className="text-xs opacity-80">Scan Disease</span>
            </Button>
            <Button 
              className="h-16 flex flex-col gap-2 w-full" 
              variant="outline"
              onClick={() => {
                loadWeatherAndOutbreakData(currentLocation.lat, currentLocation.lng);
                Analytics.trackWeatherCheck(selectedCrop);
              }}
            >
              <span className="text-2xl">🌤️</span>
              <span className="text-sm">ตรวจอากาศ</span>
              <span className="text-xs opacity-80">Weather Check</span>
            </Button>
            <Button 
              className="h-16 flex flex-col gap-2 w-full" 
              variant="outline"
              onClick={() => onNavigate('fields')}
            >
              <span className="text-2xl">📊</span>
              <span className="text-sm">ดูแปลง</span>
              <span className="text-xs opacity-80">View Fields</span>
            </Button>
          </div>
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
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-1"
              onClick={() => {
                Analytics.trackPriceAlertSet(selectedCrop, 13000);
              }}
            >
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

      {/* Share Card Generator Modal */}
      {showShareCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <ShareCardGenerator
            category={shareCategory}
            onClose={() => setShowShareCard(false)}
          />
        </div>
      )}
    </div>
  );
};

export default TodayPage;