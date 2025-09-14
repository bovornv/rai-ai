import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QrCode, Calendar, User, Package, AlertTriangle } from "lucide-react";

interface TicketData {
  id: string;
  user_id: string;
  crop: string;
  diagnosis_key: string;
  severity: number;
  recommended_classes: string[];
  dosage_note?: string;
  rai?: number;
  status: string;
  created_at: string;
  expires_at: string;
}

const TicketPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchTicket(id);
    }
  }, [id]);

  const fetchTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/shop-tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      } else {
        setError("ไม่พบตั๋ว");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการโหลดตั๋ว");
    } finally {
      setLoading(false);
    }
  };

  const printTicket = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>กำลังโหลดตั๋ว...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || "ไม่พบตั๋ว"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 print:p-0">
      <div className="max-w-md mx-auto print:max-w-none">
        {/* Print Button - Hidden in print */}
        <div className="mb-4 print:hidden">
          <button
            onClick={printTicket}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            🖨️ พิมพ์ตั๋ว
          </button>
        </div>

        {/* Ticket Content - A5 size for printing */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6 print:border-0 print:rounded-none print:p-4" 
             style={{ width: "148mm", minHeight: "210mm", margin: "0 auto" }}>
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary mb-2">RaiAI</h1>
            <h2 className="text-lg font-semibold">ตั๋วร้านค้า - Shop Ticket</h2>
            <div className="text-sm text-gray-600 mt-2">
              รหัสตั๋ว: {ticket.id}
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center mb-6">
            <div className="inline-block p-4 border-2 border-gray-300 rounded-lg">
              <QrCode className="h-32 w-32 text-gray-600" />
              <p className="text-xs text-gray-500 mt-2">แสดง QR นี้ที่ร้านค้า</p>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">ผู้ใช้:</span>
                <span>{ticket.user_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-medium">พืช:</span>
                <span>{ticket.crop === "rice" ? "ข้าว" : "ทุเรียน"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">โรค:</span>
                <span>{ticket.diagnosis_key}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">ความรุนแรง:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-2 h-2 rounded-full ${
                        level <= ticket.severity ? "bg-red-500" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {ticket.rai && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">พื้นที่:</span>
                  <span>{ticket.rai} ไร่</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">หมดอายุ:</span>
                <span>{new Date(ticket.expires_at).toLocaleDateString("th-TH")}</span>
              </div>
            </div>
          </div>

          {/* Recommended Classes */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">ประเภทสินค้าที่แนะนำ:</h3>
            <div className="grid grid-cols-2 gap-2">
              {ticket.recommended_classes.map((cls, i) => (
                <div key={i} className="bg-gray-100 p-2 rounded text-sm text-center">
                  {cls}
                </div>
              ))}
            </div>
          </div>

          {/* Dosage Note */}
          {ticket.dosage_note && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">คำแนะนำการใช้:</h3>
              <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                {ticket.dosage_note}
              </p>
            </div>
          )}

          {/* Safety Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">คำเตือนความปลอดภัย</p>
                <ul className="space-y-1 text-xs">
                  <li>• สวมอุปกรณ์ป้องกันส่วนบุคคล (PPE) ทุกครั้ง</li>
                  <li>• อ่านฉลากและคำแนะนำก่อนใช้</li>
                  <li>• เก็บให้พ้นมือเด็กและสัตว์</li>
                  <li>• ปรึกษาเภสัชกรหรือผู้เชี่ยวชาญก่อนใช้</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>ตั๋วนี้ใช้สำหรับการซื้อสินค้าตามคำแนะนำเท่านั้น</p>
            <p>สร้างเมื่อ: {new Date(ticket.created_at).toLocaleString("th-TH")}</p>
            <p>RaiAI - ผู้ช่วยเกษตรกรอัจฉริยะ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPrintPage;
