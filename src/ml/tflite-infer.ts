// TFLite Inference Engine for Rice Disease Classification
import { ClassifyTop, ModelMeta } from "../lib/ml-pipeline";
import fs from "fs";
import path from "path";

export interface TFLiteInterpreter {
  allocateTensors(): void;
  getInputDetails(): any[];
  getOutputDetails(): any[];
  setTensor(index: number, value: any): void;
  invoke(): void;
  getTensor(index: number): any;
}

export interface TFLiteQuantizationParams {
  scale: number;
  zero_point: number;
}

export class TFLiteInferenceEngine {
  private interpreters: Map<string, TFLiteInterpreter> = new Map();
  private inputDetails: Map<string, any[]> = new Map();
  private outputDetails: Map<string, any[]> = new Map();

  // Mock TFLite interpreter for development/testing
  private createMockInterpreter(modelPath: string): TFLiteInterpreter {
    return {
      allocateTensors: () => {
        console.log(`Mock: Allocated tensors for ${modelPath}`);
      },
      getInputDetails: () => [{
        index: 0,
        name: 'input',
        shape: [1, 224, 224, 3],
        dtype: 'int8',
        quantization: { scale: 0.00392156862745098, zero_point: -128 }
      }],
      getOutputDetails: () => [{
        index: 0,
        name: 'output',
        shape: [1, 4],
        dtype: 'int8',
        quantization: { scale: 0.00392156862745098, zero_point: -128 }
      }],
      setTensor: (index: number, value: any) => {
        console.log(`Mock: Set tensor ${index} with shape ${value.shape}`);
      },
      invoke: () => {
        console.log(`Mock: Invoked inference for ${modelPath}`);
      },
      getTensor: (index: number) => {
        // Return mock predictions
        const mockLogits = new Int8Array(4);
        mockLogits[0] = 10; // rice_brown_spot
        mockLogits[1] = 5;  // rice_blast
        mockLogits[2] = 2;  // bacterial_leaf_blight
        mockLogits[3] = 15; // healthy
        return mockLogits;
      }
    };
  }

  // Load TFLite model
  async loadModel(modelPath: string): Promise<void> {
    try {
      // In a real implementation, you would use @tensorflow/tfjs-node or similar
      // For now, we'll use a mock interpreter
      const interpreter = this.createMockInterpreter(modelPath);
      
      interpreter.allocateTensors();
      const inputDetails = interpreter.getInputDetails();
      const outputDetails = interpreter.getOutputDetails();
      
      this.interpreters.set(modelPath, interpreter);
      this.inputDetails.set(modelPath, inputDetails);
      this.outputDetails.set(modelPath, outputDetails);
      
      console.log(`TFLite model loaded: ${modelPath}`);
    } catch (error) {
      console.error(`Failed to load TFLite model ${modelPath}:`, error);
      throw error;
    }
  }

  // Preprocess image for MobileNetV2
  preprocessImage(imageBuffer: Buffer, inputSize: number): Float32Array {
    // This is a simplified preprocessing - in a real implementation,
    // you would use a proper image processing library
    const imageData = new Float32Array(inputSize * inputSize * 3);
    
    // Mock preprocessing - in reality, you would:
    // 1. Decode the image (JPEG/PNG)
    // 2. Resize to inputSize x inputSize
    // 3. Normalize to [0, 1]
    // 4. Apply MobileNetV2 preprocessing
    
    for (let i = 0; i < imageData.length; i++) {
      imageData[i] = Math.random(); // Mock normalized pixel values
    }
    
    return imageData;
  }

  // Quantize input for INT8 model
  quantizeInput(
    input: Float32Array, 
    quantizationParams: TFLiteQuantizationParams
  ): Int8Array {
    const quantized = new Int8Array(input.length);
    const { scale, zero_point } = quantizationParams;
    
    for (let i = 0; i < input.length; i++) {
      quantized[i] = Math.round(input[i] / scale + zero_point);
    }
    
    return quantized;
  }

  // Dequantize output from INT8 model
  dequantizeOutput(
    output: Int8Array, 
    quantizationParams: TFLiteQuantizationParams
  ): Float32Array {
    const dequantized = new Float32Array(output.length);
    const { scale, zero_point } = quantizationParams;
    
    for (let i = 0; i < output.length; i++) {
      dequantized[i] = (output[i] - zero_point) * scale;
    }
    
    return dequantized;
  }

  // Run inference on TFLite model
  async runInference(
    modelPath: string,
    imageBuffer: Buffer,
    inputSize: number = 224
  ): Promise<Float32Array> {
    const interpreter = this.interpreters.get(modelPath);
    if (!interpreter) {
      throw new Error(`Model not loaded: ${modelPath}`);
    }

    const inputDetails = this.inputDetails.get(modelPath)!;
    const outputDetails = this.outputDetails.get(modelPath)!;

    // Preprocess image
    const preprocessedImage = this.preprocessImage(imageBuffer, inputSize);

    // Check if model is quantized
    const isQuantized = inputDetails[0].dtype === 'int8';
    
    if (isQuantized) {
      // Quantize input for INT8 model
      const quantizationParams = inputDetails[0].quantization;
      const quantizedInput = this.quantizeInput(preprocessedImage, quantizationParams);
      
      // Set input tensor
      interpreter.setTensor(inputDetails[0].index, quantizedInput);
      
      // Run inference
      interpreter.invoke();
      
      // Get output and dequantize
      const quantizedOutput = interpreter.getTensor(outputDetails[0].index);
      const outputQuantizationParams = outputDetails[0].quantization;
      return this.dequantizeOutput(quantizedOutput, outputQuantizationParams);
    } else {
      // Float16 or Float32 model
      interpreter.setTensor(inputDetails[0].index, preprocessedImage);
      interpreter.invoke();
      return interpreter.getTensor(outputDetails[0].index);
    }
  }

  // Classify image with TFLite model
  async classifyImage(
    model: ModelMeta,
    imageBuffer: Buffer,
    returnTopk: number = 1
  ): Promise<ClassifyTop[]> {
    const startTime = Date.now();
    
    try {
      // Load model if not already loaded
      if (!this.interpreters.has(model.path)) {
        await this.loadModel(model.path);
      }

      // Run inference
      const logits = await this.runInference(model.path, imageBuffer, model.input.width);
      
      // Apply softmax
      const probabilities = this.softmax(Array.from(logits));
      
      // Get top-k predictions
      const results = this.getTopK(probabilities, model.labels, returnTopk);
      
      const inferenceTime = Date.now() - startTime;
      console.log(`TFLite inference completed in ${inferenceTime}ms`);
      
      return results;
    } catch (error) {
      console.error('TFLite classification failed:', error);
      throw error;
    }
  }

  // Apply softmax to logits
  private softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits);
    const expLogits = logits.map(logit => Math.exp(logit - maxLogit));
    const sumExp = expLogits.reduce((sum, exp) => sum + exp, 0);
    return expLogits.map(exp => exp / sumExp);
  }

  // Get top-k predictions
  private getTopK(
    probabilities: number[], 
    labels: string[], 
    k: number
  ): ClassifyTop[] {
    const indexedProbs = probabilities.map((prob, index) => ({
      label: labels[index] || `class_${index}`,
      confidence: prob,
      index
    }));

    // Sort by confidence (descending)
    indexedProbs.sort((a, b) => b.confidence - a.confidence);

    // Return top-k
    return indexedProbs.slice(0, k).map(({ label, confidence }) => ({
      label,
      confidence
    }));
  }

  // Get model info
  getModelInfo(modelPath: string): {
    inputShape: number[];
    outputShape: number[];
    inputType: string;
    outputType: string;
    isQuantized: boolean;
  } | null {
    const inputDetails = this.inputDetails.get(modelPath);
    const outputDetails = this.outputDetails.get(modelPath);
    
    if (!inputDetails || !outputDetails) {
      return null;
    }

    return {
      inputShape: inputDetails[0].shape,
      outputShape: outputDetails[0].shape,
      inputType: inputDetails[0].dtype,
      outputType: outputDetails[0].dtype,
      isQuantized: inputDetails[0].dtype === 'int8'
    };
  }

  // Unload model
  unloadModel(modelPath: string): void {
    this.interpreters.delete(modelPath);
    this.inputDetails.delete(modelPath);
    this.outputDetails.delete(modelPath);
    console.log(`TFLite model unloaded: ${modelPath}`);
  }

  // List loaded models
  getLoadedModels(): string[] {
    return Array.from(this.interpreters.keys());
  }

  // Clear all models
  clearAllModels(): void {
    this.interpreters.clear();
    this.inputDetails.clear();
    this.outputDetails.clear();
    console.log('All TFLite models cleared');
  }
}

// Export singleton instance
export const tfliteInferenceEngine = new TFLiteInferenceEngine();
