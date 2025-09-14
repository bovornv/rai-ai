// TFLite inference service for RaiAI MVP
// Epic 2: Scan → Action - On-device TFLite inference (<300ms p50)

interface InferenceResult {
  disease: string;
  diseaseThai: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  crop: 'rice' | 'durian';
  inferenceTime: number;
  modelVersion: string;
}

interface ModelInfo {
  name: string;
  version: string;
  size: number;
  lastUpdated: number;
  accuracy: number;
}

class TFLiteInferenceService {
  private models: Map<string, any> = new Map();
  private modelInfo: Map<string, ModelInfo> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeModels();
  }

  // Initialize models
  private async initializeModels(): Promise<void> {
    try {
      // Mock model initialization - replace with actual TFLite model loading
      const riceModel: ModelInfo = {
        name: 'rice_disease_v1',
        version: '1.0.0',
        size: 2.5 * 1024 * 1024, // 2.5MB
        lastUpdated: Date.now(),
        accuracy: 0.92
      };

      const durianModel: ModelInfo = {
        name: 'durian_disease_v1',
        version: '1.0.0',
        size: 3.2 * 1024 * 1024, // 3.2MB
        lastUpdated: Date.now(),
        accuracy: 0.89
      };

      this.modelInfo.set('rice', riceModel);
      this.modelInfo.set('durian', durianModel);

      // Mock model loading
      this.models.set('rice', { loaded: true, model: 'rice_model' });
      this.models.set('durian', { loaded: true, model: 'durian_model' });

      this.isInitialized = true;
      console.log('✅ TFLite models initialized');
    } catch (error) {
      console.error('Failed to initialize TFLite models:', error);
      throw error;
    }
  }

  // Run inference on image
  async runInference(imageData: string, crop: 'rice' | 'durian'): Promise<InferenceResult> {
    if (!this.isInitialized) {
      await this.initializeModels();
    }

    const startTime = performance.now();
    
    try {
      // Mock inference - replace with actual TFLite inference
      const result = await this.mockInference(imageData, crop);
      const inferenceTime = performance.now() - startTime;
      
      result.inferenceTime = inferenceTime;
      result.modelVersion = this.modelInfo.get(crop)?.version || '1.0.0';
      
      // Log performance metrics
      console.log(`🔍 Inference completed in ${inferenceTime.toFixed(2)}ms`);
      
      if (inferenceTime > 800) {
        console.warn(`⚠️ Inference too slow: ${inferenceTime.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      console.error('Inference failed:', error);
      throw error;
    }
  }

  // Mock inference implementation
  private async mockInference(imageData: string, crop: 'rice' | 'durian'): Promise<InferenceResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
    
    const diseases = this.getDiseasesForCrop(crop);
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = 0.7 + Math.random() * 0.25; // 70-95% confidence
    
    return {
      disease: randomDisease.name,
      diseaseThai: randomDisease.nameThai,
      confidence,
      severity: this.calculateSeverity(confidence),
      symptoms: randomDisease.symptoms,
      treatment: randomDisease.treatment,
      prevention: randomDisease.prevention,
      crop,
      inferenceTime: 0, // Will be set by caller
      modelVersion: '1.0.0'
    };
  }

  // Get diseases for crop
  private getDiseasesForCrop(crop: 'rice' | 'durian'): any[] {
    if (crop === 'rice') {
      return [
        {
          name: 'Brown Spot',
          nameThai: 'โรคใบจุดสีน้ำตาล',
          symptoms: ['จุดสีน้ำตาลบนใบ', 'ใบเหลือง', 'ใบแห้ง'],
          treatment: ['ใช้สารเคมีป้องกันเชื้อรา', 'ปรับปรุงการระบายน้ำ'],
          prevention: ['ตรวจสอบใบข้าวทุกวัน', 'ฉีดพ่นป้องกัน']
        },
        {
          name: 'Leaf Blight',
          nameThai: 'โรคใบไหม้',
          symptoms: ['ใบไหม้', 'จุดสีน้ำตาล', 'ใบแห้ง'],
          treatment: ['ใช้สารเคมีป้องกันเชื้อรา', 'ตัดแต่งใบที่ติดโรค'],
          prevention: ['หลีกเลี่ยงการเข้าแปลง', 'ฉีดพ่นป้องกัน']
        },
        {
          name: 'Healthy',
          nameThai: 'สุขภาพดี',
          symptoms: ['ใบเขียวสด', 'ไม่มีจุดผิดปกติ'],
          treatment: ['ไม่ต้องรักษา', 'ดูแลรักษาตามปกติ'],
          prevention: ['ดูแลรักษาตามปกติ', 'ตรวจสอบเป็นประจำ']
        }
      ];
    } else {
      return [
        {
          name: 'Root Rot',
          nameThai: 'โรครากเน่า',
          symptoms: ['รากเน่า', 'ใบเหลือง', 'ผลร่วง'],
          treatment: ['ใช้สารเคมีป้องกันเชื้อรา', 'ปรับปรุงการระบายน้ำ'],
          prevention: ['ตรวจสอบรากเป็นประจำ', 'ใช้ปุ๋ยอินทรีย์']
        },
        {
          name: 'Fruit Rot',
          nameThai: 'โรคผลเน่า',
          symptoms: ['ผลเน่า', 'จุดสีน้ำตาล', 'ผลร่วง'],
          treatment: ['ใช้สารเคมีป้องกันเชื้อรา', 'ตัดแต่งผลที่ติดโรค'],
          prevention: ['หลีกเลี่ยงการเข้าแปลง', 'ฉีดพ่นป้องกัน']
        },
        {
          name: 'Healthy',
          nameThai: 'สุขภาพดี',
          symptoms: ['ผลเขียวสด', 'ไม่มีจุดผิดปกติ'],
          treatment: ['ไม่ต้องรักษา', 'ดูแลรักษาตามปกติ'],
          prevention: ['ดูแลรักษาตามปกติ', 'ตรวจสอบเป็นประจำ']
        }
      ];
    }
  }

  // Calculate severity based on confidence
  private calculateSeverity(confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }

  // Get model info
  getModelInfo(crop: 'rice' | 'durian'): ModelInfo | null {
    return this.modelInfo.get(crop) || null;
  }

  // Check if model is loaded
  isModelLoaded(crop: 'rice' | 'durian'): boolean {
    return this.models.has(crop) && this.models.get(crop)?.loaded;
  }

  // Get inference statistics
  getInferenceStats(): {
    totalInferences: number;
    averageInferenceTime: number;
    p50InferenceTime: number;
    p95InferenceTime: number;
    successRate: number;
  } {
    // Mock statistics - would be calculated from actual inference data
    return {
      totalInferences: 1250,
      averageInferenceTime: 245,
      p50InferenceTime: 220,
      p95InferenceTime: 380,
      successRate: 0.98
    };
  }

  // Warm up models
  async warmUpModels(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeModels();
    }

    // Mock warm-up - would run dummy inference to warm up models
    console.log('🔥 Warming up TFLite models...');
    
    for (const crop of ['rice', 'durian'] as const) {
      if (this.isModelLoaded(crop)) {
        // Run dummy inference to warm up
        await this.runInference('dummy', crop);
      }
    }
    
    console.log('✅ TFLite models warmed up');
  }
}

// Singleton instance
export const tfliteInference = new TFLiteInferenceService();

// Convenience functions
export const runInference = (imageData: string, crop: 'rice' | 'durian'): Promise<InferenceResult> => {
  return tfliteInference.runInference(imageData, crop);
};

export const getModelInfo = (crop: 'rice' | 'durian') => {
  return tfliteInference.getModelInfo(crop);
};

export const isModelLoaded = (crop: 'rice' | 'durian'): boolean => {
  return tfliteInference.isModelLoaded(crop);
};

export const warmUpModels = (): Promise<void> => {
  return tfliteInference.warmUpModels();
};

export const getInferenceStats = () => {
  return tfliteInference.getInferenceStats();
};
