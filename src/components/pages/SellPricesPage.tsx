import { useState } from "react";
import { TrendingUp, Bell, Phone, MessageCircle, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CropType } from "../RaiAIApp";
import { Analytics } from "@/lib/analytics";

interface Buyer {
  id: string;
  name: string;
  type: 'coop' | 'collector' | 'mill';
  phone: string;
  lineId?: string;
  distance: string;
  rating: number;
}

interface SellPricesPageProps {
  onBack: () => void;
  selectedCrop: CropType;
}

const SellPricesPage = ({ onBack, selectedCrop }: SellPricesPageProps) => {
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [priceHistory] = useState([
    { date: '20/1', price: 12300 },
    { date: '21/1', price: 12400 },
    { date: '22/1', price: 12500 },
    { date: '23/1', price: 12600 },
    { date: '24/1', price: 12500 },
  ]);

  const [buyers] = useState<Buyer[]>([
    {
      id: '1',
      name: 'สหกรณ์เกษตรกรบางปะอิน',
      type: 'coop',
      phone: '035-123-456',
      lineId: '@bangpain_coop',
      distance: '2.5 กม.',
      rating: 4.8
    },
    {
      id: '2',
      name: 'โรงสีเจริญ',
      type: 'mill',
      phone: '035-789-012',
      distance: '5.1 กม.',
      rating: 4.5
    },
    {
      id: '3',
      name: 'พ่อค้าประจำ - คุณสมชาย',
      type: 'collector',
      phone: '087-123-4567',
      lineId: 'somchai_rice',
      distance: '1.2 กม.',
      rating: 4.9
    }
  ]);

  const currentPrice = selectedCrop === 'rice' ? 12500 : 85000;
  const unit = selectedCrop === 'rice' ? 'ตัน' : 'ตัน';
  const priceChange = +200;

  const typeLabels = {
    coop: 'สหกรณ์',
    collector: 'พ่อค้า',
    mill: 'โรงสี'
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          ← กลับ
        </Button>
        <h1 className="text-xl font-bold">
          {selectedCrop === 'rice' ? 'ราคาข้าว · Rice Prices' : 'ราคาทุเรียน · Durian Prices'}
        </h1>
      </div>

      {/* Current Price */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ราคาวันนี้ · Today's Price
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              ฿{currentPrice.toLocaleString()}
            </span>
            <span className="text-muted-foreground">/{unit}</span>
            <Badge className="bg-healthy text-healthy-foreground">
              +฿{priceChange}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            อัปเดตล่าสุด: วันนี้ 09:30 น.
          </div>
        </CardContent>
      </Card>

      {/* Price Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>กราฟราคา 7 วันล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-20 gap-2">
            {priceHistory.map((item, index) => {
              const height = ((item.price - 12200) / 500) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="bg-primary rounded-t w-full transition-all"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs text-muted-foreground">{item.date}</div>
                  <div className="text-xs font-medium">{item.price.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Price Alert */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            ตั้งแจ้งเตือนราคา
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="เช่น 13000"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              type="number"
            />
            <Button
              onClick={() => {
                const price = parseFloat(targetPrice);
                if (price > 0) {
                  Analytics.trackPriceAlertSet(selectedCrop, price);
                }
              }}
            >
              ตั้งแจ้งเตือน
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            เราจะแจ้งเตือนเมื่อราคาถึงเป้าหมายที่คุณตั้งไว้
          </p>
        </CardContent>
      </Card>

      {/* Buyer Directory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            ผู้รับซื้อใกล้เคียง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {buyers.map((buyer) => (
            <div key={buyer.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{buyer.name}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {typeLabels[buyer.type]}
                  </Badge>
                  <MapPin className="h-3 w-3" />
                  {buyer.distance}
                  <span>★ {buyer.rating}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    Analytics.trackBuyerContacted('call');
                    window.location.href = `tel:${buyer.phone}`;
                  }}
                  className="gap-1"
                >
                  <Phone className="h-3 w-3" />
                  โทร
                </Button>
                {buyer.lineId && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => {
                      Analytics.trackBuyerContacted('line');
                      window.open(`https://line.me/ti/p/@${buyer.lineId}`, '_blank');
                    }}
                  >
                    <MessageCircle className="h-3 w-3" />
                    LINE
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pickup Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            เวลารับซื้อ · Pickup Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>จันทร์ - ศุกร์</span>
              <span>08:00 - 16:00 น.</span>
            </div>
            <div className="flex justify-between">
              <span>เสาร์</span>
              <span>08:00 - 12:00 น.</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>อาทิตย์</span>
              <span>หยุด</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCrop === 'durian' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>เกรดทุเรียน · Durian Grades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-1">
              <p>🥇 เกรด A: เนื้อเหลือง หนา หวาน</p>
              <p>🥈 เกรด B: เนื้อครีม รสชาติดี</p>
              <p>🥉 เกรด C: เนื้อขาว รสชาติธรรมดา</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellPricesPage;