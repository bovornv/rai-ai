// Result action sheet for RaiAI MVP
// Epic 2: Scan → Action - 3 steps, PPE warning, Mixing Calculator, Reminder

import React, { useState } from 'react';
import { Shield, Calculator, Bell, CheckCircle, AlertTriangle, X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { InferenceResult } from '@/lib/tflite-inference';
import ShopTicketGenerator from './ShopTicketGenerator';

interface ResultActionSheetProps {
  result: InferenceResult;
  onClose: () => void;
  onRescan: () => void;
}

interface ActionStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

const ResultActionSheet: React.FC<ResultActionSheetProps> = ({ result, onClose, onRescan }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [showShopTicket, setShowShopTicket] = useState(false);
  const [steps, setSteps] = useState<ActionStep[]>([
    {
      id: 'ppe',
      title: 'สวมอุปกรณ์ป้องกัน',
      description: 'สวมถุงมือและหน้ากากทุกครั้ง',
      icon: Shield,
      completed: false,
      required: true
    },
    {
      id: 'mixing',
      title: 'คำนวณการผสมยา',
      description: 'คำนวณปริมาณสารเคมีที่ต้องใช้',
      icon: Calculator,
      completed: false,
      required: true
    },
    {
      id: 'reminder',
      title: 'ตั้งการแจ้งเตือน',
      description: 'ตั้งการแจ้งเตือนสำหรับการฉีดพ่น',
      icon: Bell,
      completed: false,
      required: false
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'วิกฤต';
      case 'high': return 'สูง';
      case 'medium': return 'ปานกลาง';
      case 'low': return 'ต่ำ';
      default: return 'ไม่ทราบ';
    }
  };

  const handleStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <Card className="w-full max-w-md mx-4 mb-4 max-h-[80vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">ผลการสแกน</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Scan Result */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{result.diseaseThai}</h3>
              <Badge className={getSeverityColor(result.severity)}>
                {getSeverityText(result.severity)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">ความมั่นใจ:</span>
              <Progress value={result.confidence * 100} className="flex-1" />
              <span className="text-sm font-medium">{(result.confidence * 100).toFixed(0)}%</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              เวลาสแกน: {result.inferenceTime.toFixed(0)}ms
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <h4 className="font-medium">อาการที่พบ:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {result.symptoms.map((symptom, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">ขั้นตอนการดำเนินการ</h4>
              <span className="text-sm text-muted-foreground">
                {completedSteps}/{steps.length} เสร็จสิ้น
              </span>
            </div>
            
            <Progress value={progress} className="w-full" />
            
            {/* Current Step */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <currentStepData.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="font-medium">{currentStepData.title}</h5>
                    <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
                  </div>
                </div>
                
                {/* Step-specific content */}
                {currentStepData.id === 'ppe' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <span>⚠️ สวมอุปกรณ์ป้องกันทุกครั้ง</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>• ถุงมือยาง</li>
                      <li>• หน้ากากป้องกัน</li>
                      <li>• เสื้อผ้าปกคลุม</li>
                      <li>• รองเท้าบูท</li>
                    </ul>
                    <Button 
                      onClick={() => handleStepComplete('ppe')}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      ยืนยันการสวมอุปกรณ์
                    </Button>
                  </div>
                )}
                
                {currentStepData.id === 'mixing' && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      คำนวณปริมาณสารเคมีที่ต้องใช้
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>ขนาดถัง:</span>
                        <span>20 ลิตร</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ปริมาณยา:</span>
                        <span>50 มล.</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleStepComplete('mixing')}
                      className="w-full"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      เปิดเครื่องคำนวณ
                    </Button>
                  </div>
                )}
                
                {currentStepData.id === 'reminder' && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      ตั้งการแจ้งเตือนสำหรับการฉีดพ่น
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        <Bell className="h-4 w-4 mr-2" />
                        แจ้งเตือนใน 1 ชั่วโมง
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Bell className="h-4 w-4 mr-2" />
                        แจ้งเตือนใน 2 ชั่วโมง
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Bell className="h-4 w-4 mr-2" />
                        แจ้งเตือนพรุ่งนี้
                      </Button>
                    </div>
                    <Button 
                      onClick={() => handleStepComplete('reminder')}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      ตั้งการแจ้งเตือนแล้ว
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Step Navigation */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevStep}
                disabled={currentStep === 0}
              >
                ย้อนกลับ
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={currentStep === steps.length - 1}
              >
                ถัดไป
              </Button>
            </div>
          </div>

          {/* Treatment & Prevention */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <h4 className="font-medium mb-2">การรักษา:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.treatment.map((treatment, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{treatment}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">การป้องกัน:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.prevention.map((prevention, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{prevention}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t">
            <Button 
              onClick={() => setShowShopTicket(true)} 
              className="w-full"
              variant="outline"
            >
              <QrCode className="h-4 w-4 mr-2" />
              สร้างตั๋วร้านค้า
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onRescan} className="flex-1">
                สแกนใหม่
              </Button>
              <Button onClick={onClose} className="flex-1">
                เสร็จสิ้น
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Ticket Generator Modal */}
      {showShopTicket && (
        <ShopTicketGenerator
          diagnosis={{
            crop: result.crop as "rice" | "durian",
            disease: result.disease,
            severity: result.confidence > 0.8 ? 5 : result.confidence > 0.6 ? 4 : 3,
            recommendedClasses: [
              "fungicide_triazole",
              "ppe_n95",
              "ppe_gloves"
            ],
            dosageNote: result.treatment[0] || "ใช้ตามคำแนะนำบนฉลาก",
            rai: 1 // Default area, could be from user input
          }}
          onClose={() => setShowShopTicket(false)}
        />
      )}
    </div>
  );
};

export default ResultActionSheet;
