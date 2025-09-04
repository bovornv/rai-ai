import { useState } from "react";
import { QrCode, Printer, Share2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CropType } from "./RaiAIApp";

interface ShopTicketProps {
  diagnosis: {
    disease: string;
    diseaseEn: string;
    confidence: 'high' | 'medium' | 'uncertain';
    severity: number;
    crop: CropType;
    imageUrl: string;
  };
  onClose: () => void;
}

const ShopTicket = ({ diagnosis, onClose }: ShopTicketProps) => {
  const [ticketId] = useState(() => `TKT${Date.now().toString().slice(-6)}`);
  
  const getRecommendations = () => {
    if (diagnosis.crop === 'rice') {
      return [
        'ยาฆ่าเชื้อราข้าว (Fungicide)',
        'ปุ๋ยไนโตรเจน 20-10-10',
        'สารเร่งการเจริญเติบโต'
      ];
    }
    return [
      'ยาฆ่าเชื้อราทุเรียน (Specialized Fungicide)', 
      'ปุ๋ยผลไม้ 15-15-15',
      'แคลเซียมบอเรต'
    ];
  };

  const recommendations = getRecommendations();
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center border-b">
          <CardTitle className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5" />
            ใบสั่งซื้อยา · Shop Ticket
          </CardTitle>
          <p className="text-sm text-muted-foreground">#{ticketId}</p>
        </CardHeader>
        
        <CardContent className="space-y-4 p-6">
          {/* Diagnosis Summary */}
          <div className="text-center space-y-2">
            <img 
              src={diagnosis.imageUrl} 
              alt="Scan result"
              className="w-16 h-16 mx-auto rounded-lg object-cover border"
            />
            <h3 className="font-semibold">{diagnosis.disease}</h3>
            <p className="text-sm text-muted-foreground">{diagnosis.diseaseEn}</p>
            <Badge variant="outline">
              {diagnosis.crop === 'rice' ? '🌾 ข้าว' : '🌿 ทุเรียน'}
            </Badge>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">สินค้าที่แนะนำ:</h4>
            <div className="space-y-1">
              {recommendations.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                  <span className="w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-muted border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-8 w-8 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">QR Code</p>
                <p className="text-xs font-mono">{ticketId}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            แสดง QR Code นี้ให้เจ้าหน้าที่ร้านค้าเกษตร<br />
            เพื่อรับคำแนะนำและสินค้าที่ถูกต้อง
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Share2 className="h-3 w-3" />
              แชร์
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-3 w-3" />
              บันทึก
            </Button>
          </div>
          
          <Button onClick={onClose} className="w-full">
            เสร็จสิ้น
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopTicket;