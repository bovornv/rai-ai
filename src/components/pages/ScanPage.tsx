import { useState, useRef } from "react";
import { Camera, RotateCcw, CheckCircle, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CropType } from "../RaiAIApp";

interface ScanPageProps {
  selectedCrop: CropType;
  onBack: () => void;
  offlineCount: number;
}

const ScanPage = ({ selectedCrop, onBack, offlineCount }: ScanPageProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMismatchBanner, setShowMismatchBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        setIsCapturing(false);
        // Simulate crop mismatch detection
        if (Math.random() > 0.8) {
          setShowMismatchBanner(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      // Would navigate to result in real app
    }, 2000);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowMismatchBanner(false);
  };

  const cropNames = {
    rice: "ข้าว",
    durian: "ทุเรียน"
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← กลับ
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">สแกน{cropNames[selectedCrop]}</h1>
          <p className="text-sm text-muted-foreground">Scan {selectedCrop === 'rice' ? 'Rice' : 'Durian'}</p>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Offline Queue Badge */}
      {offlineCount > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-warning" />
            <span className="text-sm">รอส่งข้อมูล {offlineCount} ภาพ</span>
            <Badge variant="secondary">{offlineCount}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Crop Mismatch Banner */}
      {showMismatchBanner && (
        <Card className="border-accent bg-accent/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm">ดูเหมือนใบ{selectedCrop === 'rice' ? 'ทุเรียน' : 'ข้าว'} เปลี่ยนเป็น '{selectedCrop === 'rice' ? 'ทุเรียน' : 'ข้าว'}' ไหม?</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowMismatchBanner(false)}>
                  Keep
                </Button>
                <Button size="sm">Change</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera/Image Area */}
      <Card className="border-2 border-dashed">
        <CardContent className="p-6">
          {!capturedImage ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">ถ่ายภาพใบ{cropNames[selectedCrop]}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedCrop === 'rice' 
                    ? "จับใบข้าวที่สงสัยใส่กรอบ ระยะ 20-30 ซม."
                    : "จับใบหรือผลทุเรียนใส่กรอบ ระยะ 30-40 ซม."
                  }
                </p>
              </div>
              <Button onClick={handleCapture} className="w-full" size="lg">
                <Camera className="h-5 w-5 mr-2" />
                เปิดกล้อง
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full rounded-lg max-h-64 object-cover"
              />
              {!isAnalyzing && (
                <div className="flex gap-2">
                  <Button onClick={retakePhoto} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    ถ่ายใหม่
                  </Button>
                  <Button onClick={handleAnalyze} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    วิเคราะห์
                  </Button>
                </div>
              )}
              {isAnalyzing && (
                <div className="text-center py-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">กำลังวิเคราะห์...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">เคล็ดลับการถ่ายภาพ · Photo Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p>✓ ใช้แสงธรรมชาติ หลีกเลี่ยงเงา</p>
            <p>✓ ถือมือให้นิ่ง ไม่เบลอ</p>
            <p>✓ {selectedCrop === 'rice' ? 'ใบข้าวต้องเต็มกรอบ' : 'ใบ/ผลทุเรียนชัดเจน'}</p>
            <p>✓ หากอาการเยอะ ถ่ายหลายจุด</p>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ScanPage;