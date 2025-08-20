import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WeatherCard = () => {
  // Mock weather data
  const weatherData = {
    temperature: 32,
    humidity: 75,
    windSpeed: 12,
    rainChance: 30,
    condition: 'partly-cloudy',
    nextRain: '6 ชั่วโมง',
    sprayWindow: 'เหมาะสม',
    uvIndex: 8
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'rainy': return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'partly-cloudy': return <Cloud className="h-6 w-6 text-gray-500" />;
      default: return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getSprayStatus = (rainChance: number, windSpeed: number) => {
    if (rainChance > 50 || windSpeed > 20) {
      return { status: 'ไม่เหมาะสม', color: 'disease', icon: '🚫' };
    } else if (rainChance > 30 || windSpeed > 15) {
      return { status: 'ระวัง', color: 'warning', icon: '⚠️' };
    }
    return { status: 'เหมาะสม', color: 'healthy', icon: '✅' };
  };

  const sprayStatus = getSprayStatus(weatherData.rainChance, weatherData.windSpeed);

  return (
    <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getWeatherIcon(weatherData.condition)}
          สภาพอากาศวันนี้
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{sprayStatus.icon}</span>
              <div>
                <div className="font-semibold text-sm">การพ่นยา</div>
                <div className="text-xs text-muted-foreground">ช่วงเวลานี้</div>
              </div>
            </div>
            <Badge 
              variant={sprayStatus.color === 'healthy' ? 'default' : 'destructive'}
              className={`bg-${sprayStatus.color} text-${sprayStatus.color}-foreground`}
            >
              {sprayStatus.status}
            </Badge>
          </div>
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
            {sprayStatus.status === 'เหมาะสม' 
              ? 'เวลาที่เหมาะสมสำหรับการพ่นยา ลมไม่แรงและไม่มีฝน'
              : sprayStatus.status === 'ระวัง'
              ? 'ระวังลมแรงหรือฝน ควรรอเวลาที่เหมาะสมกว่า'
              : 'ไม่ควรพ่นยาเนื่องจากลมแรงหรือมีฝน รอจนสภาพอากาศดีขึ้น'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherCard;