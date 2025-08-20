import { AlertTriangle, CheckCircle, XCircle, Clock, Droplets, Wind, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ScanResultProps {
  scanData: {
    disease: string;
    diseaseThaiName?: string;
    confidence: number;
    severity: string;
    imageUrl?: string;
    advice: string[];
    timestamp: Date;
  };
  onBack: () => void;
  onRescan: () => void;
}

const ScanResult = ({ scanData, onBack, onRescan }: ScanResultProps) => {
  const { disease, diseaseThaiName, confidence, severity, imageUrl, advice } = scanData;
  
  const getStatusColor = (severity: string) => {
    switch (severity) {
      case 'healthy': return 'healthy';
      case 'low': return 'accent';
      case 'medium': return 'warning';
      case 'high': return 'disease';
      default: return 'muted';
    }
  };

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case 'healthy': return <CheckCircle className="h-6 w-6" />;
      case 'high': return <XCircle className="h-6 w-6" />;
      default: return <AlertTriangle className="h-6 w-6" />;
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { level: 'สูง', color: 'healthy' };
    if (confidence >= 0.6) return { level: 'ปานกลาง', color: 'warning' };
    return { level: 'ต่ำ', color: 'disease' };
  };

  const confidenceInfo = getConfidenceLevel(confidence);
  const statusColor = getStatusColor(severity);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>←</Button>
        <h1 className="text-2xl font-bold">ผลการตรวจสอบ</h1>
      </div>

      {/* Result Image */}
      {imageUrl && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <img 
              src={imageUrl} 
              alt="Scanned leaf" 
              className="w-full h-48 object-cover rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Main Result */}
      <Card className={`mb-6 border-2 border-${statusColor}/20 bg-gradient-to-br from-${statusColor}/5 to-${statusColor}/10`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`text-${statusColor}`}>
              {getStatusIcon(severity)}
            </div>
            <div className="flex-1">
              <CardTitle className={`text-${statusColor} text-xl`}>
                {diseaseThaiName || disease}
              </CardTitle>
              {diseaseThaiName && (
                <p className="text-sm text-muted-foreground mt-1">{disease}</p>
              )}
            </div>
            <Badge 
              variant={severity === 'healthy' ? 'default' : 'destructive'}
              className={`bg-${statusColor} text-${statusColor}-foreground`}
            >
              {severity === 'healthy' ? 'ปกติ' : severity === 'high' ? 'รุนแรง' : 'ปานกลาง'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">ความมั่นใจ</span>
                <span className={`text-sm font-semibold text-${confidenceInfo.color}`}>
                  {confidenceInfo.level} ({Math.round(confidence * 100)}%)
                </span>
              </div>
              <Progress value={confidence * 100} className="h-2" />
            </div>
            
            {confidence < 0.7 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-warning-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">ความมั่นใจต่ำ</span>
                </div>
                <p className="text-xs text-warning-foreground/80 mt-1">
                  ลองถ่ายภาพใหม่ให้ชัดขึ้น หรือปฏิบัติตามคำแนะนำเบื้องต้น
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weather Warning */}
      <Card className="mb-6 bg-accent/10 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="h-5 w-5 text-accent-foreground" />
            <span className="font-semibold text-accent-foreground">สภาพอากาศ</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Wind className="h-4 w-4" />
              <span>ลม: ปานกลาง</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="h-4 w-4" />
              <span>ฝน: 30% ใน 6 ชม.</span>
            </div>
          </div>
          <p className="text-xs text-accent-foreground/80 mt-2">
            ⚠️ ระวังการพ่นยาช่วงบ่าย เนื่องจากมีโอกาสฝนตก
          </p>
        </CardContent>
      </Card>

      {/* Action Steps */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ขั้นตอนการดำเนินการ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {advice.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button onClick={onRescan} className="w-full h-12 bg-primary hover:bg-primary-light">
          ถ่ายภาพใหม่
        </Button>
        
        <Button variant="outline" className="w-full h-12">
          <Clock className="h-4 w-4 mr-2" />
          ตั้งเตือนติดตามผล
        </Button>
        
        <Button variant="outline" className="w-full h-12">
          บันทึกในประวัติ
        </Button>
      </div>

      {/* Safety Notice */}
      <Card className="mt-6 bg-destructive/5 border-destructive/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-destructive mb-2">⚠️ ข้อควรระวัง</h4>
          <ul className="text-xs space-y-1 text-destructive/80">
            <li>• ใส่อุปกรณ์ป้องกันทุกครั้งก่อนใช้สารเคมี</li>
            <li>• อ่านฉลากยาให้ครบถ้วนก่อนใช้</li>
            <li>• หากไม่แน่ใจ ปรึกษาเจ้าหน้าที่เกษตรท้องถิ่น</li>
            <li>• AI อาจผิดพลาด ใช้วิจารณญาณประกอบ</li>
          </ul>
        </CardContent>
      </Card>

      <div className="h-20"></div>
    </div>
  );
};

export default ScanResult;