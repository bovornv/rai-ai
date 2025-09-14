// Scan overlay component for RaiAI MVP
// Epic 2: Scan → Action - Guided overlay for rice/durian

import React, { useState, useEffect } from 'react';
import { Camera, X, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface ScanOverlayProps {
  crop: 'rice' | 'durian';
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

interface ScanGuide {
  title: string;
  description: string;
  tips: string[];
  targetArea: string;
  distance: string;
  lighting: string;
}

const ScanOverlay: React.FC<ScanOverlayProps> = ({ crop, onCapture, onClose, isVisible }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const scanGuides: Record<'rice' | 'durian', ScanGuide> = {
    rice: {
      title: 'สแกนใบข้าว',
      description: 'วางใบข้าวในกรอบสีเขียว และให้ใบข้าวเต็มกรอบ',
      tips: [
        'เลือกใบข้าวที่มีอาการผิดปกติ',
        'วางใบข้าวให้เต็มกรอบ',
        'หลีกเลี่ยงแสงแดดโดยตรง',
        'ให้ใบข้าวชัดเจนและไม่เบลอ'
      ],
      targetArea: 'ใบข้าว',
      distance: '15-20 ซม.',
      lighting: 'แสงธรรมชาติหรือแสงไฟสว่าง'
    },
    durian: {
      title: 'สแกนทุเรียน',
      description: 'วางผลทุเรียนหรือใบทุเรียนในกรอบสีเขียว',
      tips: [
        'เลือกผลทุเรียนที่มีอาการผิดปกติ',
        'วางผลทุเรียนให้เต็มกรอบ',
        'หลีกเลี่ยงแสงแดดโดยตรง',
        'ให้ผลทุเรียนชัดเจนและไม่เบลอ'
      ],
      targetArea: 'ผลทุเรียนหรือใบทุเรียน',
      distance: '20-25 ซม.',
      lighting: 'แสงธรรมชาติหรือแสงไฟสว่าง'
    }
  };

  const currentGuide = scanGuides[crop];

  const steps = [
    {
      title: 'เตรียมพร้อม',
      description: 'ตรวจสอบแสงและตำแหน่ง',
      icon: CheckCircle
    },
    {
      title: 'วางวัตถุ',
      description: 'วาง' + currentGuide.targetArea + 'ในกรอบ',
      icon: Camera
    },
    {
      title: 'สแกน',
      description: 'กดปุ่มสแกนเมื่อพร้อม',
      icon: CheckCircle
    }
  ];

  const handleCapture = async () => {
    setIsCapturing(true);
    
    try {
      // Mock image capture - replace with actual camera implementation
      const mockImageData = `data:image/jpeg;base64,${btoa('mock-image-data')}`;
      setCapturedImage(mockImageData);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onCapture(mockImageData);
    } catch (error) {
      console.error('Failed to capture image:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCurrentStep(0);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{currentGuide.title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-primary text-primary-foreground' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <div className="text-xs text-center">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-muted-foreground">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scan Guide */}
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {currentGuide.description}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline">ระยะห่าง</Badge>
                <span>{currentGuide.distance}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">แสง</Badge>
                <span>{currentGuide.lighting}</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">เคล็ดลับการสแกน:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              {currentGuide.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Camera Preview Area */}
          <div className="relative bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
            {capturedImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 border-4 border-green-500 rounded-lg"></div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                <div className="text-sm text-muted-foreground">
                  {currentGuide.targetArea}
                </div>
                <div className="border-4 border-dashed border-gray-300 rounded-lg w-32 h-32 mx-auto"></div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {capturedImage ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleRetake}
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  ถ่ายใหม่
                </Button>
                <Button 
                  onClick={() => onCapture(capturedImage)}
                  className="flex-1 gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  ใช้ภาพนี้
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-full gap-2"
              >
                <Camera className="h-4 w-4" />
                {isCapturing ? 'กำลังสแกน...' : 'สแกน'}
              </Button>
            )}
          </div>

          {/* Step Navigation */}
          {!capturedImage && (
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                ย้อนกลับ
              </Button>
              <Button 
                size="sm"
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === steps.length - 1}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanOverlay;
