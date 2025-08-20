import { useState, useRef, useCallback } from "react";
import { Camera, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CameraCaptureProps {
  onScanComplete: (scanData: any) => void;
  onBack: () => void;
}

const CameraCapture = ({ onScanComplete, onBack }: CameraCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const diseases = [
    { name: "Leaf Blast", thai: "โรคไหม้", confidence: 0.85, severity: "high" },
    { name: "Brown Spot", thai: "โรคใบจุดสีน้ำตาล", confidence: 0.72, severity: "medium" },
    { name: "Sheath Blight", thai: "โรคกาบใบแกว่ง", confidence: 0.91, severity: "high" },
    { name: "Bacterial Leaf Blight", thai: "โรคใบไหม้แบคทีเรีย", confidence: 0.78, severity: "high" },
    { name: "Healthy", thai: "สุขภาพดี", confidence: 0.95, severity: "healthy" }
  ];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock disease detection
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    
    const scanData = {
      id: Date.now().toString(),
      timestamp: new Date(),
      disease: randomDisease.name,
      diseaseThaiName: randomDisease.thai,
      confidence: randomDisease.confidence,
      severity: randomDisease.severity,
      imageUrl: capturedImage,
      advice: getSampleAdvice(randomDisease.name, randomDisease.severity)
    };
    
    setIsAnalyzing(false);
    onScanComplete(scanData);
  };

  const getSampleAdvice = (disease: string, severity: string) => {
    if (disease === "Healthy") {
      return [
        "ใบข้าวสุขภาพดี ไม่พบโรค",
        "ควรดูแลรักษาการจัดการน้ำและปุ่ย",
        "ตรวจสอบอีกครั้งใน 1-2 สัปดาห์"
      ];
    }
    
    return [
      "พบโรคใบข้าว ควรรีบดำเนินการ",
      "ใส่ถุงมือและหน้ากากป้องกัน",
      "พ่นยาป้องกันกำจัดเชื้อรา",
      "หลีกเลี่ยงการพ่นเมื่อมีลมแรงหรือฝนตก",
      "ตรวจสอบผลการรักษาใน 3-5 วัน"
    ];
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>←</Button>
        <h1 className="text-2xl font-bold">สแกนใบข้าว / Scan Leaves</h1>
      </div>

      {/* Camera Guide */}
      {!capturedImage && (
        <Card className="mb-6 border-2 border-primary/20">
          <CardContent className="p-6 text-center">
            <Camera className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">คำแนะนำการถ่ายภาพ</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• ถ่ายใบข้าวที่มีอาการผิดปกติ</p>
              <p>• ระยะห่าง 15-30 ซม. จากใบ</p>
              <p>• ใช้แสงธรรมชาติ หลีกเลี่ยงเงา</p>
              <p>• ใบข้าวต้องชัดเจน ไม่เบลอ</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Captured Image */}
      {capturedImage && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <img 
              src={capturedImage} 
              alt="Captured leaf" 
              className="w-full h-64 object-cover rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Analysis Status */}
      {isAnalyzing && (
        <Card className="mb-6 border-2 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="font-semibold mb-2">กำลังวิเคราะห์...</h3>
            <p className="text-sm text-muted-foreground">AI กำลังตรวจสอบใบข้าวของคุณ</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {!capturedImage ? (
          <Button 
            onClick={handleCapture}
            className="w-full h-16 text-lg bg-primary hover:bg-primary-light"
            disabled={isCapturing}
          >
            <Camera className="h-6 w-6 mr-3" />
            ถ่ายภาพใบข้าว
          </Button>
        ) : (
          <div className="space-y-3">
            <Button 
              onClick={handleAnalyze}
              className="w-full h-16 text-lg bg-primary hover:bg-primary-light"
              disabled={isAnalyzing}
            >
              <CheckCircle className="h-6 w-6 mr-3" />
              {isAnalyzing ? "กำลังวิเคราะห์..." : "วิเคราะห์ภาพ"}
            </Button>
            
            <Button 
              onClick={retakePhoto}
              variant="outline"
              className="w-full h-12"
              disabled={isAnalyzing}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              ถ่ายใหม่
            </Button>
          </div>
        )}
      </div>

      {/* Tips */}
      {!capturedImage && (
        <Card className="mt-6 bg-accent/10 border-accent/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-accent-foreground mb-2">💡 เคล็ดลับ</h4>
            <ul className="text-sm space-y-1 text-accent-foreground/80">
              <li>• ถ่ายเฉพาะใบที่มีจุดหรือรอยผิดปกติ</li>
              <li>• หากไม่แน่ใจ ถ่ายหลายมุม</li>
              <li>• ใช้งานได้แม้ไม่มีอินเทอร์เน็ต</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CameraCapture;