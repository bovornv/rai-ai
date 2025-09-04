import { useState } from "react";
import { ArrowLeft, RotateCcw, Clock, Calculator, Phone, Share2, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CropType } from "../RaiAIApp";
import { Analytics } from "@/lib/analytics";
import ShopTicket from "../ShopTicket";

interface DiagnosisResult {
  disease: string;
  diseaseEn: string;
  confidence: 'high' | 'medium' | 'uncertain';
  severity: number;
  imageUrl: string;
  crop: CropType;
}

interface ResultActionPageProps {
  result: DiagnosisResult;
  onBack: () => void;
  onRescan: () => void;
  onCropChange: (crop: CropType) => void;
}

const ResultActionPage = ({ result, onBack, onRescan, onCropChange }: ResultActionPageProps) => {
  const [tankSize, setTankSize] = useState<string>('20');
  const [reminderSet, setReminderSet] = useState(false);
  const [showShopTicket, setShowShopTicket] = useState(false);
  const [ppeChecklist, setPpeChecklist] = useState({
    mask: false,
    gloves: false,
    coveralls: false,
    boots: false
  });

  const confidenceConfig = {
    high: {
      color: 'bg-healthy text-healthy-foreground',
      text: 'แน่ใจสูง · High Confidence',
      percentage: '95%'
    },
    medium: {
      color: 'bg-warning text-warning-foreground', 
      text: 'แน่ใจปานกลาง · Medium Confidence',
      percentage: '75%'
    },
    uncertain: {
      color: 'bg-muted text-muted-foreground',
      text: 'ไม่แน่ใจ · Uncertain',
      percentage: '45%'
    }
  };

  const currentConfidence = confidenceConfig[result.confidence];

  const getActionSteps = () => {
    if (result.confidence === 'uncertain') {
      return [
        "ตรวจสอบอาการเพิ่มเติม หรือถ่ายภาพใหม่",
        "ปรึกษานักวิชาการเกษตรก่อนใช้ยา", 
        "สังเกตการณ์เป็นประจำทุกวัน"
      ];
    }
    
    return [
      `ฉีดพ่นยา${result.crop === 'rice' ? 'โรคข้าว' : 'โรคทุเรียน'} ตามสูตรที่แนะนำ`,
      "ใส่อุปกรณ์ป้องกันให้ครบถ้วน",
      "ตรวจสอบผลการรักษาใน 7-10 วัน"
    ];
  };

  const calculateDosage = () => {
    const tank = parseFloat(tankSize) || 20;
    const dosage = tank * 25; // Example calculation
    return dosage;
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <Button variant="outline" onClick={onRescan} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          สแกนใหม่
        </Button>
      </div>

      {/* Diagnosis Result */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">ผลการวินิจฉัย · Diagnosis</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={result.crop === 'rice' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => onCropChange('rice')}
              >
                🌾 ข้าว
              </Button>
              <Button
                variant={result.crop === 'durian' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => onCropChange('durian')}
              >
                🌿 ทุเรียน
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <img 
              src={result.imageUrl} 
              alt="Scan result"
              className="w-16 h-16 rounded-lg object-cover border"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{result.disease}</h3>
              <p className="text-sm text-muted-foreground">{result.diseaseEn}</p>
              <Badge className={`${currentConfidence.color} mt-2`}>
                {currentConfidence.text} ({currentConfidence.percentage})
              </Badge>
            </div>
          </div>
          <div className="text-sm">
            <strong>ระดับความรุนแรง:</strong> {result.severity}/5
          </div>
        </CardContent>
      </Card>

      {/* Action Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            ขั้นตอนการดำเนินการ · Action Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {getActionSteps().map((step, index) => (
            <div key={index} className="flex gap-3 p-3 bg-muted rounded-lg">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="text-sm">{step}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* PPE Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            อุปกรณ์ป้องกัน · PPE Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'mask', label: 'หน้ากากป้องกัน · Face Mask' },
            { key: 'gloves', label: 'ถุงมือยาง · Rubber Gloves' },
            { key: 'coveralls', label: 'ชุดคลุมกันสาด · Coveralls' },
            { key: 'boots', label: 'รองเท้าบู๊ท · Boots' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={ppeChecklist[key as keyof typeof ppeChecklist]}
                onCheckedChange={(checked) => 
                  setPpeChecklist(prev => ({ ...prev, [key]: checked }))
                }
              />
              <label htmlFor={key} className="text-sm">{label}</label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Spray Timing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            เวลาฉีดพ่น · Spray Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-1 bg-spray-good/10 border-spray-good/30"
            >
              <span className="text-sm font-medium">วันนี้</span>
              <span className="text-xs text-muted-foreground">16:00-18:00</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-1"
            >
              <span className="text-sm font-medium">พรุ่งนี้</span>
              <span className="text-xs text-muted-foreground">06:00-08:00</span>
            </Button>
          </div>
          <Button 
            onClick={() => {
              setReminderSet(true);
              Analytics.trackReminderSet('scan_followup');
            }}
            disabled={reminderSet}
            className="w-full gap-2"
          >
            <Clock className="h-4 w-4" />
            {reminderSet ? 'ตั้งแจ้งเตือนแล้ว' : 'ตั้งแจ้งเตือน'}
          </Button>
        </CardContent>
      </Card>

      {/* Mixing Calculator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            คำนวณการผสม · Mixing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="ขนาดถัง (ลิตร)"
              value={tankSize}
              onChange={(e) => setTankSize(e.target.value)}
              type="number"
            />
            <Button 
              variant="outline"
              onClick={() => {
                Analytics.trackMixCalculatorUsed();
                // Calculation happens automatically when tankSize changes
              }}
            >
              คำนวณ
            </Button>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <strong>สำหรับถัง {tankSize} ลิตร:</strong><br />
              ยา: {calculateDosage()} มล.<br />
              น้ำ: {(parseFloat(tankSize) || 20) - (calculateDosage() / 1000)} ลิตร
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      {result.confidence === 'uncertain' && (
        <Card className="border-2 border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ต้องการความช่วยเหลือ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              เนื่องจากไม่สามารถวินิจฉัยได้อย่างแน่ชัด แนะนำให้ปรึกษาผู้เชี่ยวชาญ
            </p>
            <Button className="w-full gap-2 bg-destructive hover:bg-destructive/90">
              <Phone className="h-4 w-4" />
              โทรหาสหกรณ์/นักวิชาการ
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Share Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            แชร์ผลลัพธ์
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => setShowShopTicket(true)}
          >
            <Share2 className="h-4 w-4" />
            ใบสั่งซื้อยา · Shop Ticket
          </Button>
          <Button variant="outline" className="w-full gap-2">
            <Share2 className="h-4 w-4" />
            แชร์ไปยัง LINE
          </Button>
        </CardContent>
      </Card>
      
      {showShopTicket && (
        <ShopTicket
          diagnosis={result}
          onClose={() => setShowShopTicket(false)}
        />
      )}
    </div>
  );
};

export default ResultActionPage;