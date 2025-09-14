import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Zap, Shield, Calculator, CheckCircle } from "lucide-react";

interface ScanResult {
  disease: string;
  confidence: number;
  severity: number;
  treatment: string;
  ppe: string[];
  dosage: {
    product: string;
    amount: number;
    unit: string;
    tankSize: number;
  };
}

interface BlazingFastScanProps {
  onScanComplete: (result: ScanResult) => void;
}

export function BlazingFastScan({ onScanComplete }: BlazingFastScanProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'scan' | 'result' | 'action'>('scan');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate TFLite inference (replace with actual TFLite model)
  const runTFLiteInference = async (imageData: ImageData): Promise<ScanResult> => {
    // Simulate processing time (<300ms)
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // Mock result - replace with actual TFLite model inference
    return {
      disease: "Rice Blast",
      confidence: 0.94,
      severity: 3,
      treatment: "Apply fungicide immediately",
      ppe: ["Gloves", "Mask", "Protective clothing", "Safety glasses"],
      dosage: {
        product: "Propiconazole 25% EC",
        amount: 2.5,
        unit: "ml/L",
        tankSize: 20
      }
    };
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access is required for scanning');
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    
    try {
      // Capture frame
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Run TFLite inference
      const result = await runTFLiteInference(imageData);
      
      setScanResult(result);
      setCurrentStep('result');
      onScanComplete(result);
      
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return 'bg-green-500';
    if (severity <= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 2) return 'Low';
    if (severity <= 3) return 'Medium';
    return 'High';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {currentStep === 'scan' && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              <span>Blazing Fast Scan</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              On-device AI • <300ms • No internet needed
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-gray-100 rounded-lg object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              <div className="absolute inset-0 border-2 border-dashed border-green-500 rounded-lg flex items-center justify-center bg-black bg-opacity-20">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Position crop in frame</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={startCamera}
                className="w-full"
                variant="outline"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
              
              <Button
                onClick={captureAndScan}
                disabled={isScanning}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Scan Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'result' && scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Scan Result</span>
              <Badge className={getSeverityColor(scanResult.severity)}>
                {getSeverityLabel(scanResult.severity)} Risk
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {scanResult.disease}
              </h3>
              <p className="text-sm text-gray-600">
                Confidence: {Math.round(scanResult.confidence * 100)}%
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800">
                {scanResult.treatment}
              </p>
            </div>
            
            <Button
              onClick={() => setCurrentStep('action')}
              className="w-full"
            >
              View Action Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'action' && scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Action Plan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PPE Requirements */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Required PPE
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {scanResult.ppe.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mixing Calculator */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                Mixing Calculator
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Product:</span>
                  <span className="text-sm font-medium">{scanResult.dosage.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Dosage:</span>
                  <span className="text-sm font-medium">
                    {scanResult.dosage.amount} {scanResult.dosage.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Tank Size:</span>
                  <span className="text-sm font-medium">{scanResult.dosage.tankSize}L</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-sm">Total Amount:</span>
                  <span className="text-sm">
                    {(scanResult.dosage.amount * scanResult.dosage.tankSize).toFixed(1)}ml
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentStep('scan')}
                variant="outline"
                className="flex-1"
              >
                Scan Again
              </Button>
              <Button
                onClick={() => alert('Action plan saved!')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Save Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
