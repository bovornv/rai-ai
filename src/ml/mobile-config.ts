// Mobile-Specific Model Configuration
import { ModelMeta } from "../lib/ml-pipeline";
import fs from "fs";
import path from "path";

export interface MobileModelConfig {
  id: string;
  version: string;
  platform: "android" | "ios" | "both";
  quantization: "int8" | "float16" | "both";
  architecture: "mobilenet_v2" | "efficientnet_b0";
  input_size: number;
  channels: number;
  labels: string[];
  threshold: number;
  assets: {
    model_path: string;
    labels_path: string;
    meta_path: string;
  };
  performance: {
    expected_inference_time_ms: number;
    model_size_mb: number;
    memory_usage_mb: number;
  };
  preprocessing: {
    normalization: "mobilenet_v2" | "imagenet" | "custom";
    resize_method: "bilinear" | "nearest" | "bicubic";
    channel_order: "nhwc" | "nchw";
  };
  postprocessing: {
    softmax: boolean;
    top_k: number;
    uncertainty_threshold: number;
  };
}

export interface MobileDeploymentPackage {
  platform: "android" | "ios" | "both";
  models: {
    int8?: MobileModelConfig;
    float16?: MobileModelConfig;
  };
  assets: {
    model_files: string[];
    label_files: string[];
    meta_files: string[];
  };
  documentation: {
    integration_guide: string;
    api_reference: string;
    troubleshooting: string;
  };
}

export class MobileModelConfigManager {
  private configsDir: string;
  private assetsDir: string;

  constructor(configsDir = "mobile_configs", assetsDir = "mobile_assets") {
    this.configsDir = configsDir;
    this.assetsDir = assetsDir;
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.configsDir, this.assetsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Create mobile model configuration
  createMobileConfig(
    baseModel: ModelMeta,
    platform: "android" | "ios" | "both" = "both",
    quantization: "int8" | "float16" | "both" = "both"
  ): MobileModelConfig {
    const modelSize = this.estimateModelSize(baseModel);
    const expectedInferenceTime = this.estimateInferenceTime(baseModel, quantization);

    return {
      id: baseModel.id,
      version: baseModel.version,
      platform,
      quantization: quantization as any,
      architecture: this.mapToMobileArchitecture(baseModel),
      input_size: baseModel.input.width,
      channels: baseModel.input.channels,
      labels: baseModel.labels,
      threshold: baseModel.threshold_default,
      assets: {
        model_path: this.getModelAssetPath(baseModel.id, quantization as string),
        labels_path: this.getLabelsAssetPath(baseModel.crop),
        meta_path: this.getMetaAssetPath(baseModel.crop)
      },
      performance: {
        expected_inference_time_ms: expectedInferenceTime,
        model_size_mb: modelSize,
        memory_usage_mb: modelSize * 2 // Rough estimate
      },
      preprocessing: {
        normalization: "mobilenet_v2",
        resize_method: "bilinear",
        channel_order: "nhwc"
      },
      postprocessing: {
        softmax: true,
        top_k: 3,
        uncertainty_threshold: baseModel.threshold_default
      }
    };
  }

  // Map ONNX architecture to mobile architecture
  private mapToMobileArchitecture(model: ModelMeta): "mobilenet_v2" | "efficientnet_b0" {
    // This would be more sophisticated in practice
    if (model.id.includes("mobilenet") || model.id.includes("tflite")) {
      return "mobilenet_v2";
    }
    return "efficientnet_b0";
  }

  // Estimate model size based on quantization
  private estimateModelSize(model: ModelMeta): number {
    const baseSize = 15; // MB for float32
    switch (model.runtime) {
      case "tflite":
        return model.id.includes("int8") ? 3 : 8; // INT8 vs Float16
      case "onnx":
        return baseSize;
      default:
        return baseSize;
    }
  }

  // Estimate inference time
  private estimateInferenceTime(model: ModelMeta, quantization: string): number {
    const baseTime = 100; // ms
    switch (quantization) {
      case "int8":
        return 30; // Fastest
      case "float16":
        return 60; // Medium
      default:
        return baseTime;
    }
  }

  // Get model asset path
  private getModelAssetPath(modelId: string, quantization: string): string {
    if (quantization === "int8") {
      return `${modelId}_int8.tflite`;
    } else if (quantization === "float16") {
      return `${modelId}_fp16.tflite`;
    }
    return `${modelId}.tflite`;
  }

  // Get labels asset path based on crop
  private getLabelsAssetPath(crop: string): string {
    return crop === "durian" ? "labels_durian.json" : "labels_rice.json";
  }

  // Get meta asset path based on crop
  private getMetaAssetPath(crop: string): string {
    return crop === "durian" ? "meta_durian.json" : "meta_rice.json";
  }

  // Generate Android assets package
  generateAndroidAssets(mobileConfig: MobileModelConfig): string[] {
    const assetsDir = path.join(this.assetsDir, "android", mobileConfig.id);
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const files: string[] = [];

    // Copy model files
    if (mobileConfig.quantization === "int8" || mobileConfig.quantization === "both") {
      const int8Path = path.join(assetsDir, `${mobileConfig.id}_int8.tflite`);
      files.push(int8Path);
    }

    if (mobileConfig.quantization === "float16" || mobileConfig.quantization === "both") {
      const fp16Path = path.join(assetsDir, `${mobileConfig.id}_fp16.tflite`);
      files.push(fp16Path);
    }

    // Generate labels file
    const labelsFileName = this.getLabelsAssetPath(mobileConfig.id.includes('durian') ? 'durian' : 'rice');
    const labelsPath = path.join(assetsDir, labelsFileName);
    fs.writeFileSync(labelsPath, JSON.stringify(mobileConfig.labels, null, 2));
    files.push(labelsPath);

    // Generate meta file
    const metaFileName = this.getMetaAssetPath(mobileConfig.id.includes('durian') ? 'durian' : 'rice');
    const metaPath = path.join(assetsDir, metaFileName);
    const meta = {
      id: mobileConfig.id,
      version: mobileConfig.version,
      platform: "android",
      quantization: mobileConfig.quantization,
      architecture: mobileConfig.architecture,
      input_size: mobileConfig.input_size,
      labels: mobileConfig.labels,
      threshold_default: mobileConfig.threshold,
      performance: mobileConfig.performance,
      preprocessing: mobileConfig.preprocessing,
      postprocessing: mobileConfig.postprocessing
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    files.push(metaPath);

    return files;
  }

  // Generate iOS assets package
  generateiOSAssets(mobileConfig: MobileModelConfig): string[] {
    const assetsDir = path.join(this.assetsDir, "ios", mobileConfig.id);
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const files: string[] = [];

    // Copy model files
    if (mobileConfig.quantization === "int8" || mobileConfig.quantization === "both") {
      const int8Path = path.join(assetsDir, `${mobileConfig.id}_int8.tflite`);
      files.push(int8Path);
    }

    if (mobileConfig.quantization === "float16" || mobileConfig.quantization === "both") {
      const fp16Path = path.join(assetsDir, `${mobileConfig.id}_fp16.tflite`);
      files.push(fp16Path);
    }

    // Generate labels file
    const labelsFileName = this.getLabelsAssetPath(mobileConfig.id.includes('durian') ? 'durian' : 'rice');
    const labelsPath = path.join(assetsDir, labelsFileName);
    fs.writeFileSync(labelsPath, JSON.stringify(mobileConfig.labels, null, 2));
    files.push(labelsPath);

    // Generate meta file
    const metaFileName = this.getMetaAssetPath(mobileConfig.id.includes('durian') ? 'durian' : 'rice');
    const metaPath = path.join(assetsDir, metaFileName);
    const meta = {
      id: mobileConfig.id,
      version: mobileConfig.version,
      platform: "ios",
      quantization: mobileConfig.quantization,
      architecture: mobileConfig.architecture,
      input_size: mobileConfig.input_size,
      labels: mobileConfig.labels,
      threshold_default: mobileConfig.threshold,
      performance: mobileConfig.performance,
      preprocessing: mobileConfig.preprocessing,
      postprocessing: mobileConfig.postprocessing
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    files.push(metaPath);

    return files;
  }

  // Create deployment package
  createDeploymentPackage(
    modelId: string,
    platform: "android" | "ios" | "both" = "both"
  ): MobileDeploymentPackage {
    const int8Config = this.createMobileConfig(
      { id: modelId, crop: "rice", task: "disease-classification", version: "1.0.0", input: { width: 224, height: 224, channels: 3 }, labels: [], threshold_default: 0.75, runtime: "tflite", path: "" },
      platform,
      "int8"
    );

    const float16Config = this.createMobileConfig(
      { id: modelId, crop: "rice", task: "disease-classification", version: "1.0.0", input: { width: 224, height: 224, channels: 3 }, labels: [], threshold_default: 0.75, runtime: "tflite", path: "" },
      platform,
      "float16"
    );

    const assets = {
      model_files: [],
      label_files: [],
      meta_files: []
    };

    if (platform === "android" || platform === "both") {
      const androidFiles = this.generateAndroidAssets(int8Config);
      assets.model_files.push(...androidFiles.filter(f => f.endsWith('.tflite')));
      assets.label_files.push(...androidFiles.filter(f => f.endsWith('labels.json')));
      assets.meta_files.push(...androidFiles.filter(f => f.endsWith('meta.json')));
    }

    if (platform === "ios" || platform === "both") {
      const iosFiles = this.generateiOSAssets(int8Config);
      assets.model_files.push(...iosFiles.filter(f => f.endsWith('.tflite')));
      assets.label_files.push(...iosFiles.filter(f => f.endsWith('labels.json')));
      assets.meta_files.push(...iosFiles.filter(f => f.endsWith('meta.json')));
    }

    return {
      platform,
      models: {
        int8: int8Config,
        float16: float16Config
      },
      assets,
      documentation: {
        integration_guide: `mobile/${platform}/integration-guide.md`,
        api_reference: `mobile/${platform}/api-reference.md`,
        troubleshooting: `mobile/${platform}/troubleshooting.md`
      }
    };
  }

  // Generate mobile integration code
  generateMobileCode(
    mobileConfig: MobileModelConfig,
    platform: "android" | "ios"
  ): { kotlin?: string; swift?: string } {
    const result: { kotlin?: string; swift?: string } = {};

    if (platform === "android") {
      result.kotlin = this.generateAndroidCode(mobileConfig);
    } else if (platform === "ios") {
      result.swift = this.generateiOSCode(mobileConfig);
    }

    return result;
  }

  // Generate Android Kotlin code
  private generateAndroidCode(config: MobileModelConfig): string {
    return `// Auto-generated Android integration code for ${config.id}
package your.app.ml

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder

class ${config.id.replace(/_/g, '').replace(/v/g, 'V')}Classifier(
    private val context: Context,
    private val useNNAPI: Boolean = true
) : AutoCloseable {
    
    private val interpreter: Interpreter
    private val labels = ${JSON.stringify(config.labels)}
    private val threshold = ${config.threshold}f
    private val inputSize = ${config.input_size}
    
    // Quantization parameters
    private var inScale = 1f
    private var inZero = 0
    private var outScale = 1f
    private var outZero = 0
    
    init {
        val options = Interpreter.Options().apply {
            setNumThreads(4)
            if (useNNAPI) {
                addDelegate(org.tensorflow.lite.nnapi.NnApiDelegate())
            }
        }
        
        interpreter = Interpreter(loadModel("${config.assets.model_path}"), options)
        
        // Read quantization parameters
        val inDet = interpreter.getInputTensor(0)
        val outDet = interpreter.getOutputTensor(0)
        val inQ = inDet.quantizationParams()
        val outQ = outDet.quantizationParams()
        inScale = inQ.scale
        inZero = inQ.zeroPoint
        outScale = outQ.scale
        outZero = outQ.zeroPoint
    }
    
    fun classify(bitmap: Bitmap, topK: Int = ${config.postprocessing.top_k}): List<Prediction> {
        val resized = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)
        val input = preprocessToInt8(resized)
        val output = Array(1) { ByteArray(labels.size) }
        
        interpreter.run(input, output)
        
        val logits = FloatArray(labels.size)
        for (i in labels.indices) {
            val q = output[0][i].toInt()
            logits[i] = (q - outZero) * outScale
        }
        
        val probs = softmax(logits)
        val idxs = probs.indices.sortedByDescending { probs[it] }.take(topK)
        
        return idxs.map { idx ->
            val confidence = probs[idx]
            val isUncertain = confidence < threshold
            Prediction(
                label = labels[idx],
                confidence = confidence,
                isUncertain = isUncertain
            )
        }
    }
    
    private fun preprocessToInt8(bm: Bitmap): ByteBuffer {
        val inputBuffer = ByteBuffer.allocateDirect(1 * inputSize * inputSize * 3)
        inputBuffer.order(ByteOrder.nativeOrder())
        
        for (y in 0 until inputSize) {
            for (x in 0 until inputSize) {
                val px = bm.getPixel(x, y)
                val r = android.graphics.Color.red(px).toFloat()
                val g = android.graphics.Color.green(px).toFloat()
                val b = android.graphics.Color.blue(px).toFloat()
                
                // MobileNetV2 normalization: (x/127.5) - 1.0
                val rn = (r / 127.5f) - 1.0f
                val gn = (g / 127.5f) - 1.0f
                val bn = (b / 127.5f) - 1.0f
                
                // Quantize to int8
                val rq = ((rn / inScale) + inZero).toInt().coerceIn(-128, 127)
                val gq = ((gn / inScale) + inZero).toInt().coerceIn(-128, 127)
                val bq = ((bn / inScale) + inZero).toInt().coerceIn(-128, 127)
                
                inputBuffer.put(rq.toByte())
                inputBuffer.put(gq.toByte())
                inputBuffer.put(bq.toByte())
            }
        }
        inputBuffer.rewind()
        return inputBuffer
    }
    
    private fun loadModel(assetName: String): ByteBuffer {
        context.assets.open(assetName).use { input ->
            val bytes = ByteArray(input.available())
            input.read(bytes)
            val bb = ByteBuffer.allocateDirect(bytes.size)
            bb.order(ByteOrder.nativeOrder())
            bb.put(bytes)
            bb.rewind()
            return bb
        }
    }
    
    private fun softmax(logits: FloatArray): FloatArray {
        val max = logits.maxOrNull() ?: 0f
        val exps = FloatArray(logits.size) { i -> 
            kotlin.math.exp((logits[i] - max).toDouble()).toFloat() 
        }
        val sum = exps.sum()
        return FloatArray(logits.size) { i -> 
            if (sum > 0f) exps[i] / sum else 0f 
        }
    }
    
    override fun close() {
        interpreter.close()
    }
}

data class Prediction(
    val label: String,
    val confidence: Float,
    val isUncertain: Boolean = false
)`;
  }

  // Generate iOS Swift code
  private generateiOSCode(config: MobileModelConfig): string {
    return `// Auto-generated iOS integration code for ${config.id}
import TensorFlowLite
import UIKit

class ${config.id.replace(/_/g, '').replace(/v/g, 'V')}Classifier {
    private let interpreter: Interpreter
    private let labels = ${JSON.stringify(config.labels)}
    private let threshold: Float = ${config.threshold}
    private let inputSize = ${config.input_size}
    
    // Quantization parameters
    private var inScale: Float = 1.0
    private var inZero: Int32 = 0
    private var outScale: Float = 1.0
    private var outZero: Int32 = 0
    
    init() throws {
        let modelPath = Bundle.main.path(forResource: "${config.assets.model_path}", ofType: "tflite")!
        interpreter = try Interpreter(modelPath: modelPath)
        try interpreter.allocateTensors()
        
        // Read quantization parameters
        let inputDetails = interpreter.input(at: 0)
        let outputDetails = interpreter.output(at: 0)
        
        if let inputQuantization = inputDetails.quantizationParameters {
            inScale = inputQuantization.scale
            inZero = inputQuantization.zeroPoint
        }
        
        if let outputQuantization = outputDetails.quantizationParameters {
            outScale = outputQuantization.scale
            outZero = outputQuantization.zeroPoint
        }
    }
    
    func classify(image: UIImage, topK: Int = ${config.postprocessing.top_k}) throws -> [Prediction] {
        let resizedImage = image.resized(to: CGSize(width: inputSize, height: inputSize))
        let inputData = try preprocessToInt8(image: resizedImage)
        
        try interpreter.copy(Data(inputData), toInputAt: 0)
        try interpreter.invoke()
        
        let outputData = try interpreter.output(at: 0).data
        let logits = try dequantizeOutput(data: outputData)
        let probabilities = softmax(logits: logits)
        
        let sortedIndices = probabilities.enumerated()
            .sorted { $0.element > $1.element }
            .prefix(topK)
        
        return sortedIndices.map { index, probability in
            let isUncertain = probability < threshold
            return Prediction(
                label: labels[index],
                confidence: probability,
                isUncertain: isUncertain
            )
        }
    }
    
    private func preprocessToInt8(image: UIImage) throws -> Data {
        guard let cgImage = image.cgImage else {
            throw ClassificationError.invalidImage
        }
        
        let width = cgImage.width
        let height = cgImage.height
        let bytesPerPixel = 4
        let bytesPerRow = width * bytesPerPixel
        
        var pixelData = [UInt8](repeating: 0, count: width * height * bytesPerPixel)
        let context = CGContext(
            data: &pixelData,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
        )
        
        context?.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        var inputData = Data()
        for y in 0..<height {
            for x in 0..<width {
                let pixelIndex = (y * width + x) * bytesPerPixel
                let r = Float(pixelData[pixelIndex]) / 255.0
                let g = Float(pixelData[pixelIndex + 1]) / 255.0
                let b = Float(pixelData[pixelIndex + 2]) / 255.0
                
                // MobileNetV2 normalization: (x/127.5) - 1.0
                let rn = (r / 127.5) - 1.0
                let gn = (g / 127.5) - 1.0
                let bn = (b / 127.5) - 1.0
                
                // Quantize to int8
                let rq = Int8(((rn / inScale) + Float(inZero)).clamped(to: -128...127))
                let gq = Int8(((gn / inScale) + Float(inZero)).clamped(to: -128...127))
                let bq = Int8(((bn / inScale) + Float(inZero)).clamped(to: -128...127))
                
                inputData.append(rq)
                inputData.append(gq)
                inputData.append(bq)
            }
        }
        
        return inputData
    }
    
    private func dequantizeOutput(data: Data) throws -> [Float] {
        let int8Data = data.map { Int8(bitPattern: $0) }
        return int8Data.map { q in
            (Float(q) - Float(outZero)) * outScale
        }
    }
    
    private func softmax(logits: [Float]) -> [Float] {
        let max = logits.max() ?? 0.0
        let exps = logits.map { exp($0 - max) }
        let sum = exps.reduce(0, +)
        return exps.map { $0 / sum }
    }
}

struct Prediction {
    let label: String
    let confidence: Float
    let isUncertain: Bool
}

enum ClassificationError: Error {
    case invalidImage
    case modelLoadFailed
    case inferenceFailed
}

extension UIImage {
    func resized(to size: CGSize) -> UIImage {
        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
        draw(in: CGRect(origin: .zero, size: size))
        let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return resizedImage ?? self
    }
}

extension Comparable {
    func clamped(to limits: ClosedRange<Self>) -> Self {
        return min(max(self, limits.lowerBound), limits.upperBound)
    }
}`;
  }

  // Save mobile configuration
  saveMobileConfig(config: MobileModelConfig): string {
    const configPath = path.join(this.configsDir, `${config.id}_${config.platform}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  // Load mobile configuration
  loadMobileConfig(configPath: string): MobileModelConfig {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  }
}

// Export singleton instance
export const mobileModelConfigManager = new MobileModelConfigManager();
