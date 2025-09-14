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
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

const RaiAI = () => {
  console.log('RaiAI component loaded');
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
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">RaiAI</h1>
        </div>
        <p className="text-muted-foreground">{t('smartFarmer')}</p>
        <p className="text-sm text-muted-foreground">{t('aiFarmingAssistant')}</p>
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
            {t('scanRiceLeaves')}
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
            <div className="text-xs text-muted-foreground">{t('healthyScans')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-warning">12</div>
            <div className="text-xs text-muted-foreground">{t('totalScans')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <Eye className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-xs text-muted-foreground">{t('diseasesFound')}</div>
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
          <span className="text-sm">{t('costs')}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-16 flex-col gap-2 border-2"
          onClick={() => onNavigate('history')}
        >
          <History className="h-6 w-6" />
          <span className="text-sm">{t('history')}</span>
        </Button>
      </div>

      {/* Bottom Navigation */}
      <Card className="fixed bottom-4 left-4 right-4 mx-auto max-w-md">
        <CardContent className="p-3">
          <div className="flex justify-around">
            <Button variant="ghost" size="sm" className="flex-col gap-1">
              <Leaf className="h-5 w-5" />
              <span className="text-xs">{t('home')}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col gap-1" onClick={() => onNavigate('costs')}>
              <DollarSign className="h-5 w-5" />
              <span className="text-xs">{t('costs')}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col gap-1" onClick={() => onNavigate('history')}>
              <History className="h-5 w-5" />
              <span className="text-xs">{t('history')}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col gap-1" onClick={() => onNavigate('settings')}>
              <Settings className="h-5 w-5" />
              <span className="text-xs">{t('settings')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="h-20"></div>
    </div>
  );
};

const SettingsView = ({ onBack }: { onBack: () => void }) => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>←</Button>
        <h1 className="text-2xl font-bold">{t('settings')}</h1>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Language / ภาษา</CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dataSharing')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('helpDevelopAI')}
            </p>
            <Badge variant="secondary">{t('enabled')}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('privacy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full mb-2">
              {t('exportData')}
            </Button>
            <Button variant="outline" className="w-full">
              {t('deleteAccount')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('about')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('version')}<br />
              {t('forThaiRiceFarmers')}<br />
              {t('forThaiRiceFarmersEn')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RaiAI;
