import { Calendar, Eye, AlertTriangle, CheckCircle, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScanData {
  id: string;
  timestamp: Date;
  disease: string;
  diseaseThaiName?: string;
  confidence: number;
  severity: string;
  imageUrl?: string;
}

interface ScanHistoryProps {
  history: ScanData[];
  onBack: () => void;
}

const ScanHistory = ({ history, onBack }: ScanHistoryProps) => {
  // Add some mock history data if empty
  const mockHistory: ScanData[] = [
    {
      id: '1',
      timestamp: new Date('2024-01-20T10:30:00'),
      disease: 'Leaf Blast',
      diseaseThaiName: 'โรคไหม้',
      confidence: 0.87,
      severity: 'high',
      imageUrl: undefined
    },
    {
      id: '2',
      timestamp: new Date('2024-01-19T15:45:00'),
      disease: 'Healthy',
      diseaseThaiName: 'สุขภาพดี',
      confidence: 0.94,
      severity: 'healthy',
      imageUrl: undefined
    },
    {
      id: '3',
      timestamp: new Date('2024-01-18T09:15:00'),
      disease: 'Brown Spot',
      diseaseThaiName: 'โรคใบจุดสีน้ำตาล',
      confidence: 0.73,
      severity: 'medium',
      imageUrl: undefined
    },
    {
      id: '4',
      timestamp: new Date('2024-01-17T14:20:00'),
      disease: 'Sheath Blight',
      diseaseThaiName: 'โรคกาบใบแกว่ง',
      confidence: 0.91,
      severity: 'high',
      imageUrl: undefined
    },
    {
      id: '5',
      timestamp: new Date('2024-01-16T11:00:00'),
      disease: 'Healthy',
      diseaseThaiName: 'สุขภาพดี',
      confidence: 0.89,
      severity: 'healthy',
      imageUrl: undefined
    }
  ];

  const allHistory = history.length > 0 ? history : mockHistory;

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-healthy" />;
      case 'high': return <XCircle className="h-5 w-5 text-disease" />;
      default: return <AlertTriangle className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusColor = (severity: string) => {
    switch (severity) {
      case 'healthy': return 'healthy';
      case 'high': return 'disease';
      case 'medium': return 'warning';
      default: return 'muted';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'healthy': return 'ปกติ';
      case 'high': return 'รุนแรง';
      case 'medium': return 'ปานกลาง';
      case 'low': return 'เล็กน้อย';
      default: return 'ไม่ทราบ';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-healthy';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-disease';
  };

  // Calculate statistics
  const totalScans = allHistory.length;
  const healthyScans = allHistory.filter(scan => scan.severity === 'healthy').length;
  const diseaseScans = totalScans - healthyScans;
  const avgConfidence = allHistory.reduce((sum, scan) => sum + scan.confidence, 0) / totalScans;

  return (
    <div className="container mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>←</Button>
        <h1 className="text-2xl font-bold">ประวัติการตรวจ</h1>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="text-center">
          <CardContent className="p-4">
            <Eye className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">{totalScans}</div>
            <div className="text-xs text-muted-foreground">ครั้งทั้งหมด</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <CheckCircle className="h-6 w-6 text-healthy mx-auto mb-2" />
            <div className="text-2xl font-bold text-healthy">{healthyScans}</div>
            <div className="text-xs text-muted-foreground">ใบสุขภาพดี</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <AlertTriangle className="h-6 w-6 text-disease mx-auto mb-2" />
            <div className="text-2xl font-bold text-disease">{diseaseScans}</div>
            <div className="text-xs text-muted-foreground">พบโรค</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="healthy">สุขภาพดี</SelectItem>
                <SelectItem value="disease">พบโรค</SelectItem>
                <SelectItem value="high-confidence">ความมั่นใจสูง</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            รายการตรวจสอบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allHistory.map((scan) => (
              <div key={scan.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(scan.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">
                          {scan.diseaseThaiName || scan.disease}
                        </h4>
                        <Badge 
                          variant={scan.severity === 'healthy' ? 'default' : 'destructive'}
                          className={`bg-${getStatusColor(scan.severity)} text-${getStatusColor(scan.severity)}-foreground text-xs`}
                        >
                          {getSeverityText(scan.severity)}
                        </Badge>
                      </div>
                      
                      {scan.diseaseThaiName && (
                        <p className="text-xs text-muted-foreground mb-1">{scan.disease}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{scan.timestamp.toLocaleDateString('th-TH')}</span>
                        <span>{scan.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${getConfidenceColor(scan.confidence)}`}>
                      {Math.round(scan.confidence * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">ความมั่นใจ</div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="text-xs">
                    ดูรายละเอียด
                  </Button>
                  {scan.severity !== 'healthy' && (
                    <Button variant="outline" size="sm" className="text-xs">
                      ตรวจติดตาม
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="mt-6 bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-primary mb-2">📊 สรุป</h4>
          <div className="space-y-1 text-sm">
            <p>ความแม่นยำเฉลี่ย: <span className="font-semibold text-primary">{Math.round(avgConfidence * 100)}%</span></p>
            <p>อัตราใบสุขภาพดี: <span className="font-semibold text-healthy">{Math.round((healthyScans / totalScans) * 100)}%</span></p>
            <p>การตรวจพบโรค: <span className="font-semibold text-disease">{Math.round((diseaseScans / totalScans) * 100)}%</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="h-20"></div>
    </div>
  );
};

export default ScanHistory;