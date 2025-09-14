# iOS TFLite Integration Guide

Complete iOS integration for rice disease classification using TensorFlow Lite with INT8 quantization and MobileNetV2 preprocessing.

## 🚀 Quick Start

### 1. Podfile Setup

```ruby
# Podfile
platform :ios, '12.0'

target 'YourApp' do
  use_frameworks!
  
  # TensorFlow Lite
  pod 'TensorFlowLite', '2.14.0'
  pod 'TensorFlowLiteSwift', '2.14.0'
  
  # Optional: GPU delegate
  pod 'TensorFlowLiteGPU', '2.14.0'
  
  # Optional: Select TF ops
  pod 'TensorFlowLiteSelectTfOps', '2.14.0'
end
```

### 2. Bundle Resources

Add these files to your Xcode project bundle:

```
YourApp/
├── rice_v1_int8.tflite          # INT8 quantized model
├── rice_v1_fp16.tflite          # Float16 fallback model
├── labels.json                  # Class labels
└── meta.json                    # Model metadata
```

### 3. TFLite Classifier

Create `RiceClassifier.swift`:

```swift
import TensorFlowLite
import UIKit
import Foundation

struct Prediction {
    let label: String
    let confidence: Float
    let isUncertain: Bool
}

enum ClassificationError: Error {
    case invalidImage
    case modelLoadFailed
    case inferenceFailed
    case preprocessingFailed
}

class RiceClassifier {
    private let interpreter: Interpreter
    private let labels: [String]
    private let threshold: Float
    private let inputSize: Int
    
    // Quantization parameters
    private var inScale: Float = 1.0
    private var inZero: Int32 = 0
    private var outScale: Float = 1.0
    private var outZero: Int32 = 0
    
    init(modelName: String = "rice_v1_int8") throws {
        guard let modelPath = Bundle.main.path(forResource: modelName, ofType: "tflite") else {
            throw ClassificationError.modelLoadFailed
        }
        
        // Initialize interpreter
        interpreter = try Interpreter(modelPath: modelPath)
        try interpreter.allocateTensors()
        
        // Load labels
        labels = try loadLabels()
        threshold = try loadThreshold()
        inputSize = 224
        
        // Read quantization parameters
        setupQuantizationParameters()
    }
    
    func classify(image: UIImage, topK: Int = 3) throws -> [Prediction] {
        // 1) Preprocess image
        let preprocessedImage = try preprocessImage(image)
        
        // 2) Run inference
        try interpreter.copy(preprocessedImage, toInputAt: 0)
        try interpreter.invoke()
        
        // 3) Get output and postprocess
        let outputData = try interpreter.output(at: 0).data
        let logits = try dequantizeOutput(data: outputData)
        let probabilities = softmax(logits: logits)
        
        // 4) Get top-K predictions
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
    
    // MARK: - Private Methods
    
    private func preprocessImage(_ image: UIImage) throws -> Data {
        guard let cgImage = image.cgImage else {
            throw ClassificationError.invalidImage
        }
        
        // Resize image to 224x224
        let resizedImage = image.resized(to: CGSize(width: inputSize, height: inputSize))
        guard let resizedCGImage = resizedImage.cgImage else {
            throw ClassificationError.preprocessingFailed
        }
        
        // Extract pixel data
        let width = resizedCGImage.width
        let height = resizedCGImage.height
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
        
        context?.draw(resizedCGImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        // Convert to INT8 with MobileNetV2 preprocessing
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
    
    private func setupQuantizationParameters() {
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
    
    private func loadLabels() throws -> [String] {
        guard let labelsPath = Bundle.main.path(forResource: "labels", ofType: "json"),
              let labelsData = NSData(contentsOfFile: labelsPath),
              let labelsArray = try JSONSerialization.jsonObject(with: labelsData as Data) as? [String] else {
            throw ClassificationError.modelLoadFailed
        }
        return labelsArray
    }
    
    private func loadThreshold() throws -> Float {
        guard let metaPath = Bundle.main.path(forResource: "meta", ofType: "json"),
              let metaData = NSData(contentsOfFile: metaPath),
              let metaDict = try JSONSerialization.jsonObject(with: metaData as Data) as? [String: Any],
              let threshold = metaDict["threshold_default"] as? Double else {
            return 0.75 // Default threshold
        }
        return Float(threshold)
    }
}

// MARK: - Extensions

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
}
```

### 4. Usage in ViewController

```swift
import UIKit

class ScanViewController: UIViewController {
    private var classifier: RiceClassifier?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupClassifier()
    }
    
    private func setupClassifier() {
        do {
            classifier = try RiceClassifier()
        } catch {
            print("Failed to initialize classifier: \(error)")
        }
    }
    
    @IBAction func scanButtonTapped(_ sender: UIButton) {
        presentImagePicker()
    }
    
    private func presentImagePicker() {
        let imagePicker = UIImagePickerController()
        imagePicker.delegate = self
        imagePicker.sourceType = .camera
        imagePicker.allowsEditing = true
        present(imagePicker, animated: true)
    }
    
    private func classifyImage(_ image: UIImage) {
        guard let classifier = classifier else { return }
        
        do {
            let predictions = try classifier.classify(image, topK: 3)
            displayResults(predictions)
        } catch {
            print("Classification failed: \(error)")
            showError("Classification failed. Please try again.")
        }
    }
    
    private func displayResults(_ predictions: [Prediction]) {
        guard let topPrediction = predictions.first else { return }
        
        if topPrediction.isUncertain {
            resultLabel.text = "ไม่แน่ใจ - กรุณาถ่ายภาพใหม่"
            adviceLabel.text = "คำแนะนำ: ตรวจสอบแสงสว่างและความชัดเจนของภาพ"
        } else {
            resultLabel.text = "\(topPrediction.label) (\(Int(topPrediction.confidence * 100))%)"
            adviceLabel.text = getDiseaseAdvice(for: topPrediction.label)
        }
    }
    
    private func getDiseaseAdvice(for label: String) -> String {
        switch label {
        case "rice_brown_spot":
            return "โรคใบจุดสีน้ำตาล: ใช้สารเคมีป้องกันกำจัดเชื้อรา"
        case "rice_blast":
            return "โรคไหม้: ใช้สารเคมีป้องกันกำจัดเชื้อรา"
        case "bacterial_leaf_blight":
            return "โรคใบไหม้แบคทีเรีย: ใช้สารเคมีป้องกันกำจัดแบคทีเรีย"
        case "healthy":
            return "ใบข้าวแข็งแรง: ดูแลรักษาต่อไป"
        default:
            return "ไม่สามารถระบุโรคได้"
        }
    }
    
    private func showError(_ message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - UIImagePickerControllerDelegate

extension ScanViewController: UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
        picker.dismiss(animated: true)
        
        if let image = info[.editedImage] as? UIImage ?? info[.originalImage] as? UIImage {
            classifyImage(image)
        }
    }
    
    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
    }
}
```

## 🔧 Advanced Configuration

### Model Manager with Fallback

```swift
class ModelManager {
    private var int8Classifier: RiceClassifier?
    private var fp16Classifier: RiceClassifier?
    
    func getClassifier() -> RiceClassifier? {
        // Try INT8 first (smaller, faster)
        if int8Classifier == nil {
            do {
                int8Classifier = try RiceClassifier(modelName: "rice_v1_int8")
                return int8Classifier
            } catch {
                print("INT8 model failed to load: \(error)")
            }
        } else {
            return int8Classifier
        }
        
        // Fallback to Float16
        if fp16Classifier == nil {
            do {
                fp16Classifier = try RiceClassifier(modelName: "rice_v1_fp16")
                return fp16Classifier
            } catch {
                print("Float16 model failed to load: \(error)")
            }
        }
        
        return fp16Classifier
    }
}
```

### Performance Monitoring

```swift
class PerformanceMonitor {
    private var inferenceTimes: [TimeInterval] = []
    private let maxSamples = 100
    
    func recordInference(time: TimeInterval) {
        inferenceTimes.append(time)
        if inferenceTimes.count > maxSamples {
            inferenceTimes.removeFirst()
        }
    }
    
    var averageInferenceTime: TimeInterval {
        guard !inferenceTimes.isEmpty else { return 0 }
        return inferenceTimes.reduce(0, +) / Double(inferenceTimes.count)
    }
    
    var performanceStats: String {
        guard !inferenceTimes.isEmpty else { return "No data" }
        let avg = averageInferenceTime
        let min = inferenceTimes.min() ?? 0
        let max = inferenceTimes.max() ?? 0
        return String(format: "Avg: %.1fms, Min: %.1fms, Max: %.1fms", avg * 1000, min * 1000, max * 1000)
    }
}
```

### Async Classification

```swift
extension RiceClassifier {
    func classifyAsync(_ image: UIImage, completion: @escaping (Result<[Prediction], Error>) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            do {
                let predictions = try self?.classify(image) ?? []
                DispatchQueue.main.async {
                    completion(.success(predictions))
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
            }
        }
    }
}
```

## 📊 Performance Optimization

### GPU Delegate (Float16 models)

```swift
class GPURiceClassifier: RiceClassifier {
    override init(modelName: String = "rice_v1_fp16") throws {
        try super.init(modelName: modelName)
        
        // Add GPU delegate for Float16 models
        if let gpuDelegate = try? GPUDelegate() {
            try interpreter.addDelegate(gpuDelegate)
        }
    }
}
```

### Batch Processing

```swift
extension RiceClassifier {
    func classifyBatch(_ images: [UIImage]) throws -> [[Prediction]] {
        return try images.map { try classify($0) }
    }
}
```

## 🧪 Testing

### Unit Tests

```swift
import XCTest
@testable import YourApp

class RiceClassifierTests: XCTestCase {
    var classifier: RiceClassifier!
    
    override func setUp() {
        super.setUp()
        do {
            classifier = try RiceClassifier()
        } catch {
            XCTFail("Failed to initialize classifier: \(error)")
        }
    }
    
    func testClassification() throws {
        let testImage = createTestImage()
        let predictions = try classifier.classify(testImage)
        
        XCTAssertFalse(predictions.isEmpty)
        XCTAssertTrue(predictions.first!.confidence > 0)
        XCTAssertTrue(predictions.first!.confidence <= 1)
    }
    
    func testUncertaintyDetection() throws {
        let uncertainImage = createUncertainImage()
        let predictions = try classifier.classify(uncertainImage)
        
        XCTAssertTrue(predictions.first?.isUncertain == true)
    }
    
    private func createTestImage() -> UIImage {
        // Create a test image
        let size = CGSize(width: 224, height: 224)
        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
        UIColor.green.setFill()
        UIRectFill(CGRect(origin: .zero, size: size))
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return image ?? UIImage()
    }
    
    private func createUncertainImage() -> UIImage {
        // Create an uncertain test image
        let size = CGSize(width: 224, height: 224)
        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
        UIColor.gray.setFill()
        UIRectFill(CGRect(origin: .zero, size: size))
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return image ?? UIImage()
    }
}
```

### Integration Tests

```swift
class RiceClassifierIntegrationTests: XCTestCase {
    func testModelLoading() throws {
        let classifier = try RiceClassifier()
        XCTAssertNotNil(classifier)
    }
    
    func testLabelsLoading() throws {
        let classifier = try RiceClassifier()
        // Test that labels are loaded correctly
        XCTAssertFalse(classifier.labels.isEmpty)
    }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Model not found**
   - Ensure `.tflite` files are added to Xcode project
   - Check file names match exactly
   - Verify files are in the app bundle

2. **Preprocessing errors**
   - MobileNetV2 uses `(x/127.5) - 1.0` normalization
   - Ensure image is resized to 224x224
   - Check channel order (RGB)

3. **Quantization issues**
   - Verify quantization parameters are read correctly
   - Check input/output tensor types
   - Ensure proper int8 conversion

4. **Memory issues**
   - Use weak references in closures
   - Release interpreter when done
   - Monitor memory usage

### Debug Tools

```swift
class DebugRiceClassifier: RiceClassifier {
    override func classify(image: UIImage, topK: Int = 3) throws -> [Prediction] {
        let startTime = CFAbsoluteTimeGetCurrent()
        let predictions = try super.classify(image, topK: topK)
        let timeElapsed = CFAbsoluteTimeGetCurrent() - startTime
        
        print("Inference time: \(timeElapsed * 1000)ms")
        print("Input scale: \(inScale), zero: \(inZero)")
        print("Output scale: \(outScale), zero: \(outZero)")
        print("Predictions: \(predictions)")
        
        return predictions
    }
}
```

## 🚀 Deployment

### Build Configuration

```swift
// In your app's Info.plist
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to classify rice diseases.</string>
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take photos of rice leaves for disease classification.</string>
```

### App Store Optimization

- Include model files in app bundle
- Test on various iOS versions
- Optimize for different device capabilities
- Monitor crash reports and performance

This iOS integration provides a complete, production-ready solution for rice disease classification on iOS devices! 📱✨
