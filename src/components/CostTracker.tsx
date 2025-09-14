import { useState } from "react";
import { Plus, DollarSign, TrendingUp, Calendar, Package, Users, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CostEntry {
  id: string;
  date: Date;
  category: string;
  categoryThai: string;
  amount: number;
  description: string;
  unit: string;
}

interface CostTrackerProps {
  onBack: () => void;
}

const CostTracker = ({ onBack }: CostTrackerProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    category: '',
    amount: '',
    description: '',
    unit: 'บาท'
  });

  // Mock cost data
  const [costEntries] = useState<CostEntry[]>([
    {
      id: '1',
      date: new Date('2024-01-15'),
      category: 'pesticide',
      categoryThai: 'ยาป้องกันศัตรูพืช',
      amount: 850,
      description: 'ยาฆ่าเชื้อรา',
      unit: 'บาท'
    },
    {
      id: '2',
      date: new Date('2024-01-10'),
      category: 'fertilizer',
      categoryThai: 'ปุ่ย',
      amount: 1200,
      description: 'ปุ่ยเคมี NPK',
      unit: 'บาท'
    },
    {
      id: '3',
      date: new Date('2024-01-08'),
      category: 'labor',
      categoryThai: 'ค่าแรงงาน',
      amount: 2000,
      description: 'ค่าจ้างพ่นยา',
      unit: 'บาท'
    },
    {
      id: '4',
      date: new Date('2024-01-05'),
      category: 'fuel',
      categoryThai: 'น้ำมันเชื้อเพลิง',
      amount: 300,
      description: 'น้ำมันเครื่องพ่นยา',
      unit: 'บาท'
    }
  ]);

  const categories = [
    { value: 'pesticide', label: 'ยาป้องกันศัตรูพืช', icon: Package },
    { value: 'fertilizer', label: 'ปุ่ย', icon: Package },
    { value: 'labor', label: 'ค่าแรงงาน', icon: Users },
    { value: 'fuel', label: 'น้ำมันเชื้อเพลิง', icon: Fuel },
    { value: 'equipment', label: 'อุปกรณ์', icon: Package },
    { value: 'other', label: 'อื่นๆ', icon: Package }
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    const IconComponent = cat?.icon || Package;
    return <IconComponent className="h-4 w-4" />;
  };

  const totalCost = costEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyAverage = totalCost / 3; // Assuming 3 months of data

  const handleAddEntry = () => {
    if (newEntry.category && newEntry.amount) {
      // In a real app, this would add to state/database
      setShowAddForm(false);
      setNewEntry({ category: '', amount: '', description: '', unit: 'บาท' });
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>←</Button>
        <h1 className="text-2xl font-bold">ติดตามต้นทุน</h1>
        <Button 
          onClick={() => setShowAddForm(true)} 
          size="sm"
          className="ml-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          เพิ่ม
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">
              {totalCost.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">บาท (รวม)</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-accent/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-accent-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold text-accent-foreground">
              {Math.round(monthlyAverage).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">บาท/เดือน</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Entry Form */}
      {showAddForm && (
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <CardTitle>เพิ่มรายการใหม่</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select 
                value={newEntry.category} 
                onValueChange={(value) => setNewEntry({...newEntry, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>จำนวนเงิน (บาท)</Label>
              <Input 
                type="number" 
                placeholder="0"
                value={newEntry.amount}
                onChange={(e) => setNewEntry({...newEntry, amount: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Input 
                placeholder="เช่น ยาฆ่าเชื้อรา, ปุ่ย NPK"
                value={newEntry.description}
                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddEntry} className="flex-1">
                บันทึก
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ประวัติรายจ่าย
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {getCategoryIcon(entry.category)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{entry.categoryThai}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.date.toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {entry.amount.toLocaleString()} ฿
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Watch Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ราคาข้าวเปลือก</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">ราคาท้องถิ่น</span>
              <span className="font-bold text-lg text-primary">12,500 ฿/ตัน</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">เปลี่ยนแปลง</span>
              <Badge className="bg-healthy text-healthy-foreground">
                +200 ฿ (+1.6%)
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              อัปเดตล่าสุด: วันนี้ 14:30
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="h-20"></div>
    </div>
  );
};

export default CostTracker;