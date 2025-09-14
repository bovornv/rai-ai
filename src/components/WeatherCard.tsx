import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getSprayWindow, type SprayWindowData, type CropType } from "@/lib/weather-service";
import { getForecastCached, type Forecast } from "@/weather";
import { getWeatherConfig } from "@/config/weather";

interface WeatherCardProps {
  selectedCrop?: CropType;
  lat?: number;
  lng?: number;
}

const WeatherCard = ({ selectedCrop = 'rice', lat = 14.0, lng = 100.0 }: WeatherCardProps) => {
  const [sprayData, setSprayData] = useState<SprayWindowData | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = getWeatherConfig();
  const keys = {
    MS_API_KEY: config.MS_API_KEY,
    OWM_API_KEY: config.OWM_API_KEY
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both spray data and forecast
        const [sprayResult, forecastResult] = await Promise.all([
          getSprayWindow(lat, lng, selectedCrop),
          getForecastCached({ lat, lon: lng }, keys)
        ]);
        
        setSprayData(sprayResult);
        setForecast(forecastResult);
        
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [lat, lng, selectedCrop]);

  // Get weather data from forecast or fallback to spray data
  const currentHour = forecast?.hourly[0];
  const weatherData = {
    temperature: currentHour?.temp_c ?? sprayData?.temperature ?? 32,
    humidity: currentHour?.rh ?? sprayData?.humidity ?? 75,
    windSpeed: Math.round((currentHour?.wind_ms ?? 0) * 3.6), // Convert m/s to km/h
    rainChance: Math.round((currentHour?.pop ?? 0) * 100),
    condition: 'partly-cloudy',
    nextRain: '6 ชั่วโมง',
    uvIndex: 8,
    source: forecast?.source ?? 'unknown'
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'rainy': return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'partly-cloudy': return <Cloud className="h-6 w-6 text-gray-500" />;
      default: return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getSprayStatus = () => {
    if (!sprayData) {
      return { status: 'กำลังโหลด...', color: 'muted', icon: '⏳', reason: 'กำลังตรวจสอบสภาพอากาศ' };
    }

    const verdict = sprayData.verdict;
    if (!verdict) {
      // Fallback to basic logic
      if (weatherData.rainChance > 50 || weatherData.windSpeed > 20) {
        return { status: 'ไม่เหมาะสม', color: 'disease', icon: '🚫', reason: 'ลมแรงหรือมีฝน' };
      } else if (weatherData.rainChance > 30 || weatherData.windSpeed > 15) {
        return { status: 'ระวัง', color: 'warning', icon: '⚠️', reason: 'ลมปานกลางหรือมีโอกาสฝน' };
      }
      return { status: 'เหมาะสม', color: 'healthy', icon: '✅', reason: 'สภาพอากาศเหมาะสม' };
    }

    // Use enhanced verdict
    const statusMap = {
      'GOOD': { status: 'ฉีดพ่นได้', color: 'healthy', icon: '✅' },
      'CAUTION': { status: 'ระวัง', color: 'warning', icon: '⚠️' },
      'DON\'T': { status: 'หลีกเลี่ยง', color: 'disease', icon: '🚫' }
    };

    return {
      ...statusMap[verdict.level],
      reason: verdict.reason_th,
      confidence: verdict.confidence,
      nextSafeHour: verdict.next_safe_hour
    };
  };

  const sprayStatus = getSprayStatus();

  if (loading) {
    return (
      <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูลอากาศ...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-red-800 mb-1">ไม่สามารถโหลดข้อมูลอากาศได้</h3>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              ลองใหม่
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getWeatherIcon(weatherData.condition)}
          สภาพอากาศวันนี้
          {weatherData.source && (
            <Badge variant="outline" className="text-xs">
              {weatherData.source}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Weather Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{weatherData.temperature}°C</div>
            <div className="text-sm text-muted-foreground">อุณหภูมิ</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{weatherData.humidity}%</div>
            <div className="text-sm text-muted-foreground">ความชื้น</div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <Wind className="h-4 w-4 mx-auto text-muted-foreground" />
            <div className="text-sm font-semibold">{weatherData.windSpeed} km/h</div>
            <div className="text-xs text-muted-foreground">ลม</div>
          </div>
          <div className="space-y-1">
            <Droplets className="h-4 w-4 mx-auto text-muted-foreground" />
            <div className="text-sm font-semibold">{weatherData.rainChance}%</div>
            <div className="text-xs text-muted-foreground">โอกาสฝน</div>
          </div>
          <div className="space-y-1">
            <Sun className="h-4 w-4 mx-auto text-muted-foreground" />
            <div className="text-sm font-semibold">UV {weatherData.uvIndex}</div>
            <div className="text-xs text-muted-foreground">แสง UV</div>
          </div>
        </div>

        {/* Spray Recommendation */}
        <div className="bg-card rounded-lg p-3 border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{sprayStatus.icon}</span>
              <div>
                <div className="font-semibold text-sm">การพ่นยา</div>
                <div className="text-xs text-muted-foreground">
                  {selectedCrop === 'durian' ? 'ทุเรียน' : 'ข้าว'}
                </div>
              </div>
            </div>
            <Badge 
              variant={sprayStatus.color === 'healthy' ? 'default' : sprayStatus.color === 'warning' ? 'secondary' : 'destructive'}
              className={`${
                sprayStatus.color === 'healthy' ? 'bg-healthy text-healthy-foreground' :
                sprayStatus.color === 'warning' ? 'bg-warning text-warning-foreground' :
                'bg-disease text-disease-foreground'
              }`}
            >
              {sprayStatus.status}
            </Badge>
          </div>
          
          {/* Reason and confidence */}
          <div className="text-sm text-muted-foreground mb-2">
            {sprayStatus.reason}
          </div>
          
          {/* Confidence and next safe hour */}
          {sprayData?.verdict && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                ความมั่นใจ: {Math.round((sprayStatus.confidence || 0) * 100)}%
              </span>
              {sprayStatus.nextSafeHour && (
                <span className="text-primary">
                  ปลอดภัยครั้งถัดไป: {new Date(sprayStatus.nextSafeHour).toLocaleTimeString('th-TH', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Next Rain Forecast */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">ฝนครั้งถัดไป:</span>
          <span className="font-semibold">{weatherData.nextRain}</span>
        </div>

        {/* Tips */}
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
          <h4 className="font-semibold text-sm text-primary mb-1">💡 คำแนะนำ</h4>
          <p className="text-xs text-primary/80">
            {sprayData?.verdict ? (
              sprayData.verdict.level === 'GOOD' 
                ? 'เวลาที่เหมาะสมสำหรับการพ่นยา ตรวจสอบลมและฝนก่อนเริ่มงาน'
                : sprayData.verdict.level === 'CAUTION'
                ? 'ระวังลมแรงหรือความชื้นสูง ใช้เครื่องป้องกันและฉีดในช่วงเช้าหรือเย็น'
                : 'ไม่ควรพ่นยาในวันนี้ รอจนสภาพอากาศดีขึ้นหรือเช็คอีกครั้งใน 2 ชั่วโมง'
            ) : (
              sprayStatus.status === 'เหมาะสม' 
                ? 'เวลาที่เหมาะสมสำหรับการพ่นยา ลมไม่แรงและไม่มีฝน'
                : sprayStatus.status === 'ระวัง'
                ? 'ระวังลมแรงหรือฝน ควรรอเวลาที่เหมาะสมกว่า'
                : 'ไม่ควรพ่นยาเนื่องจากลมแรงหรือมีฝน รอจนสภาพอากาศดีขึ้น'
            )}
          </p>
          {sprayData?.verdict?.next_safe_hour && sprayData.verdict.level !== 'GOOD' && (
            <p className="text-xs text-primary/60 mt-1">
              💡 ตรวจสอบอีกครั้งใน: {new Date(sprayData.verdict.next_safe_hour).toLocaleTimeString('th-TH', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherCard;