import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Upload, Camera } from 'lucide-react';
import { type OutbreakReportInput } from '@/lib/outbreak-service';

interface OutbreakReportFormProps {
  geohash5: string;
  crop: 'rice' | 'durian';
  onReportSubmitted?: (reportId: string) => void;
}

const OutbreakReportForm = ({ geohash5, crop, onReportSubmitted }: OutbreakReportFormProps) => {
  const [formData, setFormData] = useState<Partial<OutbreakReportInput>>({
    source: 'manual',
    crop,
    geohash5,
    observed_at: new Date().toISOString(),
    device_id: `device_${Date.now()}` // Mock device ID
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diseaseLabels = {
    rice: [
      { value: 'rice_brown_spot', label: 'ใบจุดน้ำตาล (Brown Spot)' },
      { value: 'rice_blast', label: 'โรคไหม้ (Blast)' },
      { value: 'bacterial_leaf_blight', label: 'โรคใบไหม้แบคทีเรีย' },
      { value: 'rice_sheath_blight', label: 'โรคกาบใบแห้ง' },
      { value: 'rice_tungro', label: 'โรคทุ่งโร' }
    ],
    durian: [
      { value: 'durian_phytophthora', label: 'โรคไฟทอปธอร่า' },
      { value: 'durian_anthracnose', label: 'โรคแอนแทรคโนส' },
      { value: 'durian_powdery_mildew', label: 'โรคราแป้ง' },
      { value: 'durian_leaf_spot', label: 'โรคใบจุด' }
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label || !formData.source) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reportId = `obr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setSubmitted(true);
      onReportSubmitted?.(reportId);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          source: 'manual',
          crop,
          geohash5,
          observed_at: new Date().toISOString(),
          device_id: `device_${Date.now()}`
        });
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof OutbreakReportInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">ส่งรายงานสำเร็จ!</h3>
            <p className="text-green-600 text-sm">
              ขอบคุณสำหรับการรายงาน เราจะตรวจสอบและแจ้งเตือนเกษตรกรในพื้นที่
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          รายงานการระบาด
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Selection */}
          <div>
            <Label htmlFor="source">แหล่งที่มา</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => handleInputChange('source', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกแหล่งที่มา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">รายงานด้วยตนเอง</SelectItem>
                <SelectItem value="scan">จากการสแกน</SelectItem>
                <SelectItem value="partner">จากสหกรณ์/ร้านค้า</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Disease Selection */}
          <div>
            <Label htmlFor="label">โรค/แมลงศัตรูพืช</Label>
            <Select
              value={formData.label}
              onValueChange={(value) => handleInputChange('label', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกโรค/แมลงศัตรูพืช" />
              </SelectTrigger>
              <SelectContent>
                {diseaseLabels[crop].map((disease) => (
                  <SelectItem key={disease.value} value={disease.value}>
                    {disease.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confidence (for scan reports) */}
          {formData.source === 'scan' && (
            <div>
              <Label htmlFor="confidence">ความมั่นใจ (%)</Label>
              <Input
                id="confidence"
                type="number"
                min="0"
                max="100"
                value={formData.confidence ? formData.confidence * 100 : ''}
                onChange={(e) => handleInputChange('confidence', parseFloat(e.target.value) / 100)}
                placeholder="85"
              />
            </div>
          )}

          {/* Evidence Upload */}
          <div>
            <Label>หลักฐาน (ไม่บังคับ)</Label>
            <div className="flex gap-2 mt-2">
              <Button type="button" variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                ถ่ายรูป
              </Button>
              <Button type="button" variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                อัปโหลด
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              รูปภาพจะช่วยให้การวินิจฉัยแม่นยำขึ้น
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">หมายเหตุเพิ่มเติม</Label>
            <Textarea
              id="notes"
              placeholder="อธิบายอาการที่พบ หรือข้อมูลเพิ่มเติม..."
              rows={3}
            />
          </div>

          {/* Contact Info (for partners) */}
          {formData.source === 'partner' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="co_op_id">รหัสสหกรณ์</Label>
                <Input
                  id="co_op_id"
                  value={formData.contact?.co_op_id || ''}
                  onChange={(e) => handleInputChange('contact', {
                    ...formData.contact,
                    co_op_id: e.target.value
                  })}
                  placeholder="COOP001"
                />
              </div>
              <div>
                <Label htmlFor="shop_id">รหัสร้านค้า</Label>
                <Input
                  id="shop_id"
                  value={formData.contact?.shop_id || ''}
                  onChange={(e) => handleInputChange('contact', {
                    ...formData.contact,
                    shop_id: e.target.value
                  })}
                  placeholder="SHOP001"
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || !formData.label}
            className="w-full"
          >
            {submitting ? 'กำลังส่งรายงาน...' : 'ส่งรายงาน'}
          </Button>
        </form>

        {/* Privacy Notice */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>ข้อมูลส่วนตัว:</strong> เราไม่เก็บข้อมูลส่วนตัวของคุณ 
            ใช้เฉพาะตำแหน่งโดยประมาณและข้อมูลการระบาดเพื่อช่วยเกษตรกรในพื้นที่
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OutbreakReportForm;
