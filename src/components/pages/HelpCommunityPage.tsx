import { Play, MessageCircle, MapPin, Shield, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HelpCommunityPageProps {
  onBack: () => void;
}

const HelpCommunityPage = ({ onBack }: HelpCommunityPageProps) => {
  const videos = [
    {
      id: '1',
      title: 'วิธีสแกนที่ถูกต้อง',
      titleEn: 'How to Scan Properly',
      duration: '2:15',
      thumbnail: '🎥',
      downloaded: true
    },
    {
      id: '2', 
      title: 'การใส่อุปกรณ์ป้องกัน',
      titleEn: 'PPE Guidelines',
      duration: '1:45',
      thumbnail: '🛡️',
      downloaded: false
    },
    {
      id: '3',
      title: 'การผสมยาฉีดพ่น',
      titleEn: 'Mixing Spray Solutions',
      duration: '3:20',
      thumbnail: '🧪',
      downloaded: true
    },
    {
      id: '4',
      title: 'เคล็ดลับเก็บเกี่ยว',
      titleEn: 'Harvest Tips',
      duration: '2:50',
      thumbnail: '🌾',
      downloaded: false
    }
  ];

  const partners = [
    {
      id: '1',
      name: 'ศูนย์ส่งเสริมเกษตรกรรมอำเภอบางปะอิน',
      distance: '3.2 กม.',
      nextTraining: '28 ม.ค. 67'
    },
    {
      id: '2',
      name: 'สหกรณ์เกษตรกรจังหวัดพระนครศรีอยุธยา', 
      distance: '8.5 กม.',
      nextTraining: '15 ก.พ. 67'
    }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          ← กลับ
        </Button>
        <h1 className="text-xl font-bold">ช่วยเหลือ/ชุมชน</h1>
      </div>

      {/* Quick Help */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            ขอความช่วยเหลือด่วน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            พูดคุยกับนักวิชาการเกษตร
          </p>
          <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
            <div>
              <div className="font-medium">เปิดให้บริการ</div>
              <div className="text-sm text-muted-foreground">จ-ศ 08:00-17:00 น.</div>
            </div>
            <Button className="gap-2">
              <MessageCircle className="h-4 w-4" />
              LINE: @raiAI_help
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Learning Videos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            วิดีโอแนะนำ · Tutorial Videos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="text-2xl">{video.thumbnail}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{video.title}</div>
                <div className="text-xs text-muted-foreground">{video.titleEn}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{video.duration}</Badge>
                  {video.downloaded && (
                    <Badge className="text-xs bg-healthy text-healthy-foreground">ดาวน์โหลดแล้ว</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!video.downloaded && (
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3" />
                  </Button>
                )}
                <Button size="sm">
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Partners & Training */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            หน่วยงานพันธมิตร
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {partners.map((partner) => (
            <div key={partner.id} className="p-3 border rounded-lg">
              <div className="font-medium text-sm mb-1">{partner.name}</div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>ระยะทาง: {partner.distance}</span>
                <span>อบรมครั้งต่อไป: {partner.nextTraining}</span>
              </div>
              <Button size="sm" variant="outline" className="w-full mt-2">
                ดูรายละเอียด
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transparency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ความโปร่งใส · Transparency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <Button variant="ghost" className="w-full justify-start p-2">
              วิธีการทำงานของ AI
            </Button>
            <Button variant="ghost" className="w-full justify-start p-2">
              นโยบายความเป็นส่วนตัว (PDPA)
            </Button>
            <Button variant="ghost" className="w-full justify-start p-2">
              เงื่อนไขการใช้งาน
            </Button>
            <Button variant="ghost" className="w-full justify-start p-2">
              รายงานปัญหาหรือข้อเสนอแนะ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Learn & Earn */}
      <Card className="border-2 border-accent/30 bg-accent/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-accent-foreground">🎯 เรียนรู้และรับรางวัล</CardTitle>
        </CardHeader>  
        <CardContent className="space-y-3">
          <p className="text-sm">ดูวิดีโอครบ 4 เรื่อง รับคูปองส่วนลดค่าปุ๋ย 100 บาท!</p>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-accent-foreground">3/4</div>
            <div className="text-sm text-muted-foreground">วิดีโอที่ดูแล้ว</div>
          </div>
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            ดูวิดีโอที่เหลือ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpCommunityPage;