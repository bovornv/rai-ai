import { useState } from 'react';
import { MapPin, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { locationService, type ThaiProvince, type ThaiAmphoe } from '@/services/locationService';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (lat: number, lon: number, source: string) => void;
}

const LocationPermissionModal = ({ isOpen, onClose, onLocationSelected }: LocationPermissionModalProps) => {
  const [step, setStep] = useState<'permission' | 'manual'>('permission');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedAmphoe, setSelectedAmphoe] = useState<string>('');
  const [requesting, setRequesting] = useState(false);

  if (!isOpen) return null;

  const provinces = locationService.getProvinces();
  const amphoes = selectedProvince ? locationService.getAmphoes(selectedProvince) : [];

  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      const permission = await locationService.requestLocationPermission();
      
      if (permission.granted) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          onLocationSelected(location.lat, location.lon, 'GPS');
          onClose();
        }
      } else {
        setStep('manual');
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setStep('manual');
    } finally {
      setRequesting(false);
    }
  };

  const handleManualSelection = () => {
    if (selectedAmphoe) {
      const location = locationService.getLocationForAmphoe(selectedAmphoe);
      if (location) {
        onLocationSelected(location.lat, location.lon, 'Manual');
        onClose();
      }
    } else if (selectedProvince) {
      const location = locationService.getLocationForProvince(selectedProvince);
      if (location) {
        onLocationSelected(location.lat, location.lon, 'Manual');
        onClose();
      }
    }
  };

  const handleSkip = () => {
    // Use default location (Bangkok)
    onLocationSelected(13.7563, 100.5018, 'Default');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {step === 'permission' ? 'ขออนุญาตเข้าถึงตำแหน่ง' : 'เลือกพื้นที่'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'permission' ? (
            <>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">ทำไมเราต้องการตำแหน่งของคุณ?</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      เพื่อให้คำแนะนำการพ่นยาที่แม่นยำตามสภาพอากาศในพื้นที่ของคุณ
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">ข้อมูลของคุณปลอดภัย</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      เราใช้เฉพาะตำแหน่งโดยประมาณ ไม่ติดตามหรือเก็บข้อมูลส่วนตัว
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleRequestPermission} 
                  disabled={requesting}
                  className="flex-1"
                >
                  {requesting ? 'กำลังขออนุญาต...' : 'อนุญาต'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('manual')}
                  className="flex-1"
                >
                  เลือกเอง
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">จังหวัด</label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => {
                      setSelectedProvince(e.target.value);
                      setSelectedAmphoe('');
                    }}
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                  >
                    <option value="">เลือกจังหวัด</option>
                    {provinces.map(province => (
                      <option key={province.id} value={province.id}>
                        {province.name} ({province.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProvince && amphoes.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">อำเภอ/เขต</label>
                    <select
                      value={selectedAmphoe}
                      onChange={(e) => setSelectedAmphoe(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md text-sm"
                    >
                      <option value="">เลือกอำเภอ/เขต</option>
                      {amphoes.map(amphoe => (
                        <option key={amphoe.id} value={amphoe.id}>
                          {amphoe.name} ({amphoe.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleManualSelection}
                  disabled={!selectedProvince}
                  className="flex-1"
                >
                  ใช้ตำแหน่งนี้
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSkip}
                  className="flex-1"
                >
                  ข้าม
                </Button>
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground text-center">
            คุณสามารถเปลี่ยนตำแหน่งได้ในภายหลัง
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationPermissionModal;
