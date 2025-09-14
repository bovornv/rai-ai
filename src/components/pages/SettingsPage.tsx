import { Globe, Download, Trash2, FileText, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const [dataSharing, setDataSharing] = useState(true);
  const [language, setLanguage] = useState<'th' | 'en'>('th');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          ← กลับ
        </Button>
        <h1 className="text-xl font-bold">ตั้งค่า · Settings</h1>
      </div>

      {/* Language */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            ภาษา · Language
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={language === 'th' ? 'default' : 'outline'}
              onClick={() => setLanguage('th')}
              className="flex-1"
            >
              ไทย
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              onClick={() => setLanguage('en')}
              className="flex-1"
            >
              English
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>การแชร์ข้อมูล · Data Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-sm">แชร์ภาพเพื่อพัฒนา AI</div>
              <div className="text-xs text-muted-foreground">
                ช่วยให้ AI แม่นยำขึ้น โดยไม่เปิดเผยข้อมูลส่วนตัว
              </div>
            </div>
            <Switch
              checked={dataSharing}
              onCheckedChange={setDataSharing}
            />
          </div>
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
            ✓ ภาพจะถูกลบข้อมูล GPS และข้อมูลส่วนตัวอื่นๆ ออกก่อนส่ง<br />
            ✓ ใช้เพื่อการวิจัยและพัฒนาเท่านั้น<br />
            ✓ คุณสามารถปิดได้ตลอดเวลา
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            ข้อมูลส่วนตัว · Personal Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              ส่งออกประวัติการสแกน (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              ส่งออกข้อมูลต้นทุน (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              ส่งออกข้อมูลผลผลิต (CSV)
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            ไฟล์จะถูกส่งไปยังอีเมลที่ลงทะเบียน
          </div>
        </CardContent>
      </Card>

      {/* Legal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ข้อกำหนดและนโยบาย
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            เงื่อนไขการใช้งาน · Terms of Service
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            นโยบายความเป็นส่วนตัว · Privacy Policy
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            จัดการบัญชี
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
            ลบบัญชี · Delete Account
          </Button>
          <div className="text-xs text-muted-foreground">
            การลบบัญชีจะทำให้ข้อมูลทั้งหมดถูกลบอย่างถาวร
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            เกี่ยวกับแอป · About App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>เวอร์ชัน</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>อัปเดตล่าสุด</span>
              <span>25 ม.ค. 2567</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
            RaiAI - ผู้ช่วยเกษตรกรอัจฉริยะ<br />
            สำหรับเกษตรกรข้าวและทุเรียนไทย<br />
            AI Farming Assistant for Thai Rice & Durian Farmers
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              Made with ❤️ for Thai Farmers
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;