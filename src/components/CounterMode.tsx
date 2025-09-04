import { useState } from "react";
import { QrCode, Check, X, BarChart3, Package, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ScannedTicket {
  ticketId: string;
  disease: string;
  crop: 'rice' | 'durian';
  recommendations: string[];
  timestamp: Date;
  status: 'pending' | 'completed' | 'cancelled';
}

interface CounterModeProps {
  onClose: () => void;
}

const CounterMode = ({ onClose }: CounterModeProps) => {
  const [ticketInput, setTicketInput] = useState('');
  const [scannedTickets, setScannedTickets] = useState<ScannedTicket[]>([
    {
      ticketId: 'TKT123456',
      disease: 'โรคใบจุดสีน้ำตาล',
      crop: 'rice',
      recommendations: ['ยาฆ่าเชื้อราข้าว', 'ปุ๋ยไนโตรเจน 20-10-10'],
      timestamp: new Date(),
      status: 'completed'
    }
  ]);
  
  const [stats] = useState({
    todayScans: 12,
    weeklyScans: 84,
    commonIssues: [
      { name: 'โรคใบจุดสีน้ำตาล', count: 15 },
      { name: 'เพลี้ยอ่อน', count: 8 },
      { name: 'โรคแคงเกอร์', count: 6 }
    ]
  });

  const handleScanTicket = () => {
    if (ticketInput.trim()) {
      const newTicket: ScannedTicket = {
        ticketId: ticketInput.trim(),
        disease: 'โรคใบจุดสีน้ำตาล', // Mock data
        crop: 'rice',
        recommendations: ['ยาฆ่าเชื้อราข้าว', 'ปุ๋ยไนโตรเจน'],
        timestamp: new Date(),
        status: 'pending'
      };
      setScannedTickets([newTicket, ...scannedTickets]);
      setTicketInput('');
    }
  };

  const updateTicketStatus = (ticketId: string, status: 'completed' | 'cancelled') => {
    setScannedTickets(tickets => 
      tickets.map(t => t.ticketId === ticketId ? { ...t, status } : t)
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">เคาน์เตอร์ร้านค้าเกษตร</h1>
          <p className="text-muted-foreground">Counter Mode for Agri Shops</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          ออกจากโหมดเคาน์เตอร์
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              วันนี้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.todayScans}</div>
            <p className="text-sm text-muted-foreground">ใบสั่งซื้อ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              สัปดาห์นี้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.weeklyScans}</div>
            <p className="text-sm text-muted-foreground">เกษตรกรที่มา</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              ปัญหายอดนิยม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats.commonIssues.slice(0, 2).map((issue, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="truncate">{issue.name}</span>
                  <span className="font-medium">{issue.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan Ticket */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            สแกนใบสั่งซื้อ · Scan Shop Ticket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="สแกน QR Code หรือพิมพ์รหัส เช่น TKT123456"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScanTicket()}
            />
            <Button onClick={handleScanTicket}>
              สแกน
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            กล้องจะเปิดโดยอัตโนมัติเพื่อสแกน QR Code หรือสามารถพิมพ์รหัสด้วยตนเอง
          </p>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>ใบสั่งซื้อล่าสุด · Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scannedTickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              ยังไม่มีใบสั่งซื้อในวันนี้
            </p>
          ) : (
            scannedTickets.map((ticket) => (
              <div key={ticket.ticketId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">#{ticket.ticketId}</div>
                    <div className="text-sm text-muted-foreground">
                      {ticket.disease} · {ticket.crop === 'rice' ? 'ข้าว' : 'ทุเรียน'}
                    </div>
                  </div>
                  <Badge
                    variant={
                      ticket.status === 'completed' ? 'default' : 
                      ticket.status === 'cancelled' ? 'destructive' : 'outline'
                    }
                  >
                    {ticket.status === 'pending' && 'รอดำเนินการ'}
                    {ticket.status === 'completed' && 'เสร็จสิ้น'}
                    {ticket.status === 'cancelled' && 'ยกเลิก'}
                  </Badge>
                </div>
                
                <div className="text-sm mb-3">
                  <strong>สินค้าที่แนะนำ:</strong>
                  <ul className="mt-1 space-y-1">
                    {ticket.recommendations.map((rec, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {ticket.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateTicketStatus(ticket.ticketId, 'completed')}
                      className="gap-1"
                    >
                      <Check className="h-3 w-3" />
                      ขายแล้ว
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateTicketStatus(ticket.ticketId, 'cancelled')}
                      className="gap-1"
                    >
                      <X className="h-3 w-3" />
                      ยกเลิก
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CounterMode;