import { useState } from "react";
import { QrCode, Printer, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShopTicketGeneratorProps {
  diagnosis: {
    crop: "rice" | "durian";
    disease: string;
    severity: number;
    recommendedClasses: string[];
    dosageNote?: string;
    rai?: number;
  };
  onClose: () => void;
}

interface TicketData {
  id: string;
  status: string;
  qrPng: string;
  qrContent: string;
  printableUrl: string;
}

const ShopTicketGenerator = ({ diagnosis, onClose }: ShopTicketGeneratorProps) => {
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState<string>("");

  const generateTicket = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/shop-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user_demo", // In real app, get from auth context
          crop: diagnosis.crop,
          diagnosis_key: diagnosis.disease,
          severity: diagnosis.severity,
          recommended_classes: diagnosis.recommendedClasses,
          dosage_note: diagnosis.dosageNote,
          rai: diagnosis.rai
        })
      });

      if (response.ok) {
        const ticketData = await response.json();
        setTicket(ticketData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "เกิดข้อผิดพลาดในการสร้างตั๋ว");
      }
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setIsGenerating(false);
    }
  };

  const printTicket = () => {
    if (ticket) {
      window.open(ticket.printableUrl, "_blank");
    }
  };

  const downloadQR = () => {
    if (ticket) {
      const link = document.createElement("a");
      link.href = ticket.qrPng;
      link.download = `ticket-${ticket.id}.png`;
      link.click();
    }
  };

  const copyQRCode = () => {
    if (ticket) {
      navigator.clipboard.writeText(ticket.qrContent);
      // You could add a toast notification here
    }
  };

  if (ticket) {
    return (
      <div className="fixed inset-0 bg-background z-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                ตั๋วร้านค้าสำเร็จ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Display */}
              <div className="text-center">
                <img 
                  src={ticket.qrPng} 
                  alt="QR Code" 
                  className="mx-auto border rounded-lg"
                  style={{ maxWidth: "200px" }}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  แสดง QR นี้ที่ร้านค้า
                </p>
              </div>

              {/* Ticket Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>รหัสตั๋ว:</span>
                  <span className="font-mono">{ticket.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>สถานะ:</span>
                  <Badge variant="secondary">{ticket.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>พืช:</span>
                  <span>{diagnosis.crop === "rice" ? "ข้าว" : "ทุเรียน"}</span>
                </div>
                {diagnosis.rai && (
                  <div className="flex justify-between">
                    <span>พื้นที่:</span>
                    <span>{diagnosis.rai} ไร่</span>
                  </div>
                )}
              </div>

              {/* Recommended Classes */}
              <div>
                <p className="text-sm font-medium mb-2">ประเภทสินค้าที่แนะนำ:</p>
                <div className="flex flex-wrap gap-1">
                  {diagnosis.recommendedClasses.map((cls, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {cls}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={printTicket} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  พิมพ์
                </Button>
                <Button onClick={downloadQR} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  บันทึก QR
                </Button>
              </div>

              <Button onClick={copyQRCode} variant="outline" className="w-full">
                <QrCode className="h-4 w-4 mr-2" />
                คัดลอกรหัส QR
              </Button>

              <Button onClick={onClose} className="w-full">
                ปิด
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              สร้างตั๋วร้านค้า
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Diagnosis Summary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">โรค:</span>
                <Badge variant="destructive">{diagnosis.disease}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">ความรุนแรง:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-3 h-3 rounded-full ${
                        level <= diagnosis.severity ? "bg-red-500" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="font-medium">ประเภทสินค้าที่แนะนำ:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {diagnosis.recommendedClasses.map((cls, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {cls}
                    </Badge>
                  ))}
                </div>
              </div>

              {diagnosis.dosageNote && (
                <div>
                  <span className="font-medium">คำแนะนำ:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {diagnosis.dosageNote}
                  </p>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">คำเตือน</p>
                  <p>ตั๋วนี้ใช้สำหรับการซื้อสินค้าตามคำแนะนำเท่านั้น กรุณาปรึกษาเภสัชกรหรือผู้เชี่ยวชาญก่อนใช้</p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={generateTicket} 
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? "กำลังสร้าง..." : "สร้างตั๋ว"}
              </Button>
              <Button onClick={onClose} variant="outline">
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopTicketGenerator;
