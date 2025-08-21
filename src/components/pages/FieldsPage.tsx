import { useState } from "react";
import { MapPin, Plus, TrendingUp, Eye, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CropType } from "../RaiAIApp";

interface Field {
  id: string;
  name: string;
  crop: CropType;
  status: 'improving' | 'watch' | 'healthy';
  progress: number;
  lastScan: string;
  area: string;
  costPerUnit: number;
  yield: number;
}

interface FieldsPageProps {
  selectedCrop: CropType;
  onNavigate: (view: 'today' | 'scan' | 'fields') => void;
}

const FieldsPage = ({ selectedCrop }: FieldsPageProps) => {
  const [fields] = useState<Field[]>([
    {
      id: '1',
      name: 'แปลงใหญ่ใต้',
      crop: 'rice',
      status: 'improving',
      progress: 75,
      lastScan: '2 วันที่แล้ว',
      area: '3 ไร่',
      costPerUnit: 8500,
      yield: 650
    },
    {
      id: '2', 
      name: 'แปลงเหนือ',
      crop: 'rice',
      status: 'watch',
      progress: 45,
      lastScan: '5 วันที่แล้ว',
      area: '2 ไร่',
      costPerUnit: 7800,
      yield: 580
    },
    {
      id: '3',
      name: 'สวนทุเรียนหลัง',
      crop: 'durian',
      status: 'healthy',
      progress: 90,
      lastScan: '1 สัปดาห์ที่แล้ว',
      area: '20 ต้น',
      costPerUnit: 1200,
      yield: 15
    }
  ]);

  const filteredFields = fields.filter(field => field.crop === selectedCrop);

  const statusColors = {
    improving: 'bg-healthy text-healthy-foreground',
    watch: 'bg-warning text-warning-foreground', 
    healthy: 'bg-primary text-primary-foreground'
  };

  const statusText = {
    improving: 'กำลังดีขึ้น',
    watch: 'ต้องเฝ้าระวัง',
    healthy: 'สุขภาพดี'
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {selectedCrop === 'rice' ? 'แปลงข้าว · Rice Fields' : 'สวนทุเรียน · Durian Orchards'}
        </h1>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่ม
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-primary">{filteredFields.length}</div>
            <div className="text-xs text-muted-foreground">
              {selectedCrop === 'rice' ? 'แปลง' : 'สวน'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-healthy">
              {Math.round(filteredFields.reduce((sum, f) => sum + f.progress, 0) / filteredFields.length)}%
            </div>
            <div className="text-xs text-muted-foreground">เฉลี่ย</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-accent">
              ฿{filteredFields.reduce((sum, f) => sum + f.costPerUnit, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">ต้นทุนรวม</div>
          </CardContent>
        </Card>
      </div>

      {/* Field Cards */}
      <div className="space-y-3">
        {filteredFields.map((field) => (
          <Card key={field.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">{field.name}</CardTitle>
                </div>
                <Badge className={statusColors[field.status]}>
                  {statusText[field.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ความคืบหนา</span>
                  <span>{field.progress}%</span>
                </div>
                <Progress value={field.progress} className="h-2" />
              </div>

              {/* Timeline */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  สแกนล่าสุด: {field.lastScan}
                </div>
                <div>พื้นที่: {field.area}</div>
              </div>

              {/* Cost & Yield */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">ต้นทุน</div>
                  <div className="font-semibold">฿{field.costPerUnit.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedCrop === 'rice' ? 'ต่อไร่' : 'ต่อต้น'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">ผลผลิต</div>
                  <div className="font-semibold">{field.yield}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedCrop === 'rice' ? 'กก./ไร่' : 'ผล/ต้น'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1 gap-2">
                  <Eye className="h-4 w-4" />
                  ดูรายละเอียด
                </Button>
                <Button size="sm" className="flex-1 gap-2">
                  <TrendingUp className="h-4 w-4" />
                  รายงาน
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFields.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">ยังไม่มี{selectedCrop === 'rice' ? 'แปลง' : 'สวน'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              เริ่มต้นโดยการเพิ่ม{selectedCrop === 'rice' ? 'แปลงข้าว' : 'สวนทุเรียน'}แรกของคุณ
            </p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่ม{selectedCrop === 'rice' ? 'แปลง' : 'สวน'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FieldsPage;