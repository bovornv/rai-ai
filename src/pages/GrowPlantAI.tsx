import { useState } from "react";
import { Camera, CloudRain, DollarSign, History, Settings, Leaf, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import CameraCapture from "@/components/CameraCapture";
import ScanResult from "@/components/ScanResult";
import WeatherCard from "@/components/WeatherCard";
import CostTracker from "@/components/CostTracker";
import ScanHistory from "@/components/ScanHistory";

type View = 'home' | 'camera' | 'result' | 'costs' | 'history' | 'settings';

interface ScanData {
  id: string;
  timestamp: Date;
  disease: string;
  diseaseThaiName?: string;
  confidence: number;
  severity: string;
  imageUrl?: string;
  advice: string[];
}

const GrowPlantAI = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentScan, setCurrentScan] = useState<ScanData | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanData[]>([]);

  const handleScanComplete = (scanData: ScanData) => {
    setCurrentScan(scanData);
    setScanHistory(prev => [scanData, ...prev]);
    setCurrentView('result');
  };

  const renderView = () => {
    switch (currentView) {
      case 'camera':
        return <CameraCapture onScanComplete={handleScanComplete} onBack={() => setCurrentView('home')} />;
      case 'result':
        return currentScan ? (
          <ScanResult 
            scanData={currentScan} 
            onBack={() => setCurrentView('home')} 
            onRescan={() => setCurrentView('camera')} 
          />
        ) : null;
      case 'costs':
        return <CostTracker onBack={() => setCurrentView('home')} />;
      case 'history':
        return <ScanHistory history={scanHistory} onBack={() => setCurrentView('home')} />;
      case 'settings':
        return <SettingsView onBack={() => setCurrentView('home')} />;
      default:
        return <HomeView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {renderView()}
    </div>
  );
};

const HomeView = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">GrowPlantAI</h1>
        </div>
        <p className="text-muted-foreground">ผู้ช่วยเกษตรกรอัจฉริยะ</p>
        <p className="text-sm text-muted-foreground">AI Farming Assistant</p>
      </div>

      {/* Weather Card */}
      <WeatherCard />

      {/* Main Scan Button */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <Button 
            onClick={() => onNavigate('camera')}
            className="w-full h-20 text-xl font-semibold bg-primary hover:bg-primary-light shadow-lg"
            size="lg"
          >
            <Camera className="h-8 w-8 mr-3" />
            สแกนใบข้าว
            <span className="block text-sm font-normal mt-1">Scan Rice Leaves</span>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <CheckCircle className="h-6 w-6 text-healthy mx-auto mb-2" />
            <div className="text-2xl font-bold text-healthy">85%</div>
            <div className="text-xs text-muted-foreground">Healthy Scans</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-warning">12</div>
            <div className="text-xs text-muted-foreground">Total Scans</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <Eye className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-xs text-muted-foreground">Diseases Found</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="h-16 flex-col gap-2 border-2"
          onClick={() => onNavigate('costs')}
        >
          <DollarSign className="h-6 w-6" />
          <span className="text-sm">ต้นทุน / Costs</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-16 flex-col gap-2 border-2"
          onClick={() => onNavigate('history')}
        >
          <History className="h-6 w-6" />
          <span className="text-sm">ประวัติ / History</span>
        </Button>
      </div>

      {/* Bottom Navigation */}
      <Card className="fixed bottom-4 left-4 right-4 mx-auto max-w-md">
        <CardContent className="p-3">
          <div className="flex justify-around">
            <Button variant="ghost" size="sm" className="flex-col gap-1">
              <Leaf className="h-5 w-5" />
              <span className="text-xs">หน้าแรก</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col gap-1" onClick={() => onNavigate('costs')}>
              <DollarSign className="h-5 w-5" />
              <span className="text-xs">ต้นทุน</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col gap-1" onClick={() => onNavigate('history')}>
              <History className="h-5 w-5" />
              <span className="text-xs">ประวัติ</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col gap-1" onClick={() => onNavigate('settings')}>
              <Settings className="h-5 w-5" />
              <span className="text-xs">ตั้งค่า</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="h-20"></div>
    </div>
  );
};

const SettingsView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>←</Button>
        <h1 className="text-2xl font-bold">ตั้งค่า / Settings</h1>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>การแชร์ข้อมูล / Data Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ช่วยพัฒนา AI โดยการแชร์ภาพแบบไม่ระบุตัวตน
            </p>
            <Badge variant="secondary">เปิดใช้งาน / Enabled</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลส่วนตัว / Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full mb-2">
              ส่งออกข้อมูล / Export Data
            </Button>
            <Button variant="outline" className="w-full">
              ลบบัญชี / Delete Account
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เกี่ยวกับ / About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              GrowPlantAI v1.0.0<br />
              สำหรับเกษตรกรข้าวไทย<br />
              For Thai Rice Farmers
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GrowPlantAI;