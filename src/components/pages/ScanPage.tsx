import { useState, useRef } from "react";
import { Camera, RotateCcw, CheckCircle, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CropType } from "../RaiAIApp";
import ResultActionPage from "./ResultActionPage";
import { MismatchBanner } from "@/components/MismatchBanner";

interface ScanPageProps {
  selectedCrop: CropType;
  onBack: () => void;
  offlineCount: number;
}

interface DiagnosisResult {
  disease: string;
  diseaseEn: string;
  confidence: 'high' | 'medium' | 'uncertain';
  severity: number;
  imageUrl: string;
  crop: CropType;
}

const ScanPage = ({ selectedCrop, onBack, offlineCount }: ScanPageProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLocationMismatch, setShowLocationMismatch] = useState(false);
  const [currentCrop, setCurrentCrop] = useState<CropType>(selectedCrop);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [currentField] = useState('ทุ่งใต้'); // Example field name
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
        // Simulate location mismatch detection
        if (Math.random() > 0.7) {
          setShowLocationMismatch(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate analysis with mock results
    setTimeout(() => {
      setIsAnalyzing(false);
      const mockResults: DiagnosisResult[] = [
        {
          disease: "โรคใบจุดสีน้ำตาล",
          diseaseEn: "Brown Spot Disease",
          confidence: 'high',
          severity: 3,
          imageUrl: capturedImage!,
          crop: currentCrop
        },
        {
          disease: "โรคเหี่ยวเน่าราก",
          diseaseEn: "Root Rot Disease", 
          confidence: 'medium',
          severity: 4,
          imageUrl: capturedImage!,
          crop: currentCrop
        },
        {
          disease: "อาการไม่ชัดเจน",
          diseaseEn: "Unclear Symptoms",
          confidence: 'uncertain',
          severity: 2,
          imageUrl: capturedImage!,
          crop: currentCrop
        }
      ];
      
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      setDiagnosisResult(randomResult);
    }, 2000);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowLocationMismatch(false);
    setDiagnosisResult(null);
  };

  const handleCropChange = (crop: CropType) => {
    setCurrentCrop(crop);
    // Re-run analysis with new crop context
    if (diagnosisResult) {
      setDiagnosisResult({
        ...diagnosisResult,
        crop: crop
      });
    }
  };

  const cropNames = {
    rice: "ข้าว",
    durian: "ทุเรียน"
  };

  // Show result page after successful analysis
  if (diagnosisResult) {
    return (
      <ResultActionPage
        result={diagnosisResult}
        onBack={() => setDiagnosisResult(null)}
        onRescan={retakePhoto}
        onCropChange={handleCropChange}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← กลับ
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">สแกน{cropNames[currentCrop]}</h1>
          <p className="text-sm text-muted-foreground">Scan {currentCrop === 'rice' ? 'Rice' : 'Durian'}</p>
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

      {/* Location Mismatch Banner */}
      {showLocationMismatch && (
        <MismatchBanner
          fieldName={currentField}
          onUseFieldLocation={() => {
            setShowLocationMismatch(false);
            // Logic to use field location
          }}
          onKeepCurrentLocation={() => {
            setShowLocationMismatch(false);
            // Logic to keep current location
          }}
          onDismiss={() => setShowLocationMismatch(false)}
        />
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
                <h3 className="font-semibold mb-2">ถ่ายภาพใบ{cropNames[currentCrop]}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {currentCrop === 'rice' 
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
            <p>✓ {currentCrop === 'rice' ? 'ใบข้าวต้องเต็มกรอบ' : 'ใบ/ผลทุเรียนชัดเจน'}</p>
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