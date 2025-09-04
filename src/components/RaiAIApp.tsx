import { useState } from "react";
import { Home, Scan, MapPin, Menu, Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

// Pages
import TodayPage from "./pages/TodayPage";
import ScanPage from "./pages/ScanPage";
import FieldsPage from "./pages/FieldsPage";
import SellPricesPage from "./pages/SellPricesPage";
import HelpCommunityPage from "./pages/HelpCommunityPage";
import SettingsPage from "./pages/SettingsPage";
import CounterMode from "./CounterMode";

type MainView = 'today' | 'scan' | 'fields';
type DrawerView = 'sell' | 'help' | 'settings' | 'counter';

export type CropType = 'rice' | 'durian';

interface AppState {
  selectedCrop: CropType;
  offlineQueueCount: number;
}

const RaiAIApp = () => {
  const [currentView, setCurrentView] = useState<MainView>('today');
  const [drawerView, setDrawerView] = useState<DrawerView | null>(null);
  const [appState, setAppState] = useState<AppState>({
    selectedCrop: 'rice',
    offlineQueueCount: 0
  });

  const updateCrop = (crop: CropType) => {
    setAppState(prev => ({ ...prev, selectedCrop: crop }));
  };

  const renderMainContent = () => {
    if (drawerView) {
      switch (drawerView) {
        case 'sell':
          return <SellPricesPage onBack={() => setDrawerView(null)} selectedCrop={appState.selectedCrop} />;
        case 'help':
          return <HelpCommunityPage onBack={() => setDrawerView(null)} />;
        case 'settings':
          return <SettingsPage onBack={() => setDrawerView(null)} />;
        case 'counter':
          return <CounterMode onClose={() => setDrawerView(null)} />;
        default:
          return null;
      }
    }

    switch (currentView) {
      case 'today':
        return <TodayPage selectedCrop={appState.selectedCrop} onCropChange={updateCrop} onNavigate={setCurrentView} />;
      case 'scan':
        return <ScanPage selectedCrop={appState.selectedCrop} onBack={() => setCurrentView('today')} offlineCount={appState.offlineQueueCount} />;
      case 'fields':
        return <FieldsPage selectedCrop={appState.selectedCrop} onNavigate={setCurrentView} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with drawer */}
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          <h1 className="text-xl font-bold text-primary">RaiAI</h1>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="py-6 space-y-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lg py-6"
                onClick={() => {
                  setDrawerView('sell');
                  setCurrentView('today');
                }}
              >
                ขาย/ราคา · Sell & Prices
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lg py-6"
                onClick={() => {
                  setDrawerView('help');
                  setCurrentView('today');
                }}
              >
                ช่วยเหลือ/ชุมชน · Help & Community
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lg py-6"
                onClick={() => {
                  setDrawerView('settings');
                  setCurrentView('today');
                }}
              >
                ตั้งค่า · Settings
              </Button>
              <div className="border-t my-4"></div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lg py-6 text-accent"
                onClick={() => {
                  setDrawerView('counter');
                  setCurrentView('today');
                }}
              >
                <Store className="h-5 w-5 mr-2" />
                เคาน์เตอร์ร้านค้า · Counter Mode
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20">
        {renderMainContent()}
      </main>

      {/* Persistent FAB */}
      <Button
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90 z-50"
        onClick={() => setCurrentView('scan')}
      >
        <Scan className="h-6 w-6 text-accent-foreground" />
        {appState.offlineQueueCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-warning text-warning-foreground">
            {appState.offlineQueueCount}
          </Badge>
        )}
      </Button>

      {/* Bottom Navigation */}
      {!drawerView && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t">
          <div className="flex">
            <Button
              variant={currentView === 'today' ? 'default' : 'ghost'}
              className="flex-1 rounded-none py-4 flex-col gap-1 h-auto"
              onClick={() => setCurrentView('today')}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs">หน้าหลัก</span>
            </Button>
            <Button
              variant={currentView === 'scan' ? 'default' : 'ghost'}
              className="flex-1 rounded-none py-4 flex-col gap-1 h-auto"
              onClick={() => setCurrentView('scan')}
            >
              <Scan className="h-5 w-5" />
              <span className="text-xs">สแกน</span>
              {appState.offlineQueueCount > 0 && (
                <Badge className="absolute top-1 right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-warning">
                  {appState.offlineQueueCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={currentView === 'fields' ? 'default' : 'ghost'}
              className="flex-1 rounded-none py-4 flex-col gap-1 h-auto"
              onClick={() => setCurrentView('fields')}
            >
              <MapPin className="h-5 w-5" />
              <span className="text-xs">แปลง/สวน</span>
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default RaiAIApp;