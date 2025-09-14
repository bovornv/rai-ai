# Mobile Integration Guide

Complete mobile integration for rice disease classification using TensorFlow Lite with Android (Kotlin) and iOS (Swift) support.

## 🚀 Quick Start

### 1. Generate Mobile Code

```bash
# Generate both Android and iOS integration code
npm run rice:mobile:generate -- --id rice_v1_tflite --platform both

# Generate Android only
npm run rice:mobile:generate -- --id rice_v1_tflite --platform android

# Generate iOS only
npm run rice:mobile:generate -- --id rice_v1_tflite --platform ios
```

### 2. Deploy Mobile Model

```bash
# Deploy with both INT8 and Float16 quantization
npm run rice:mobile:deploy -- --id rice_v1_tflite --platform both --quantization both

# Deploy with code generation and documentation
npm run rice:mobile:deploy -- --id rice_v1_tflite --platform both --compress
```

### 3. Run Mobile Tests

```bash
# Run mobile tests
npm run rice:mobile:test -- --id rice_v1_tflite --platform both

# Generate test report
npm run rice:mobile:test -- --id rice_v1_tflite --platform both --output test_results
```

## 📱 Android Integration

### Setup

1. **Add to `app/build.gradle`:**
```gradle
android {
    aaptOptions { noCompress "tflite" }
}

dependencies {
    implementation 'org.tensorflow:tensorflow-lite:2.14.0'
    implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'
    implementation 'org.tensorflow:tensorflow-lite-gpu:2.14.0'
}
```

2. **Add assets to `app/src/main/assets/`:**
```
assets/
├── rice_v1_tflite_int8.tflite
├── rice_v1_tflite_fp16.tflite
├── labels.json
└── meta.json
```

3. **Use the generated `TFLiteClassifier.kt`:**
```kotlin
val classifier = TFLiteClassifier(context)
val predictions = classifier.classify(bitmap, topK = 3)
```

### Features

- **INT8 Quantization**: 2-5MB models for fast inference
- **Float16 Fallback**: 7-10MB models for compatibility
- **MobileNetV2 Preprocessing**: Optimized for mobile devices
- **Uncertainty Detection**: Mark low-confidence predictions
- **Performance Monitoring**: Track inference time and memory usage

## 🍎 iOS Integration

### Setup

1. **Add to `Podfile`:**
```ruby
pod 'TensorFlowLite', '2.14.0'
pod 'TensorFlowLiteSwift', '2.14.0'
pod 'TensorFlowLiteGPU', '2.14.0'
```

2. **Add model files to Xcode project:**
```
RiceClassifier/
├── rice_v1_tflite_int8.tflite
├── rice_v1_tflite_fp16.tflite
├── labels.json
└── meta.json
```

3. **Use the generated `RiceClassifier.swift`:**
```swift
let classifier = try RiceClassifier()
let predictions = try classifier.classify(image: image, topK: 3)
```

### Features

- **Swift Integration**: Native iOS development
- **Memory Management**: Automatic resource cleanup
- **Error Handling**: Comprehensive error management
- **Performance Optimization**: GPU delegate support
- **Async Processing**: Background classification

## 🔧 Mobile Configuration

### Model Configuration

```typescript
import { mobileModelConfigManager } from './src/ml';

const config = mobileModelConfigManager.createMobileConfig(
  model,
  'both', // android | ios | both
  'both'  // int8 | float16 | both
);
```

### Performance Thresholds

```typescript
const config = {
  performance: {
    expected_inference_time_ms: 100,  // Target inference time
    model_size_mb: 5,                 // Model size limit
    memory_usage_mb: 50               // Memory usage limit
  }
};
```

## 📊 Mobile Testing

### Test Configuration

```typescript
import { mobileTestingFramework } from './src/ml';

const testConfig = mobileTestingFramework.createTestConfig(
  'rice_v1_tflite',
  'both'
);
```

### Running Tests

```bash
# Run all mobile tests
npm run rice:mobile:test

# Run Android tests only
npm run rice:mobile:test -- --platform android

# Run iOS tests only
npm run rice:mobile:test -- --platform ios
```

### Test Cases

- **Healthy Rice**: Clear images of healthy rice leaves
- **Disease Classification**: Brown spot, blast, bacterial blight
- **Uncertainty Detection**: Blurry or unclear images
- **Performance Testing**: Inference time and memory usage
- **Edge Cases**: Various lighting and angle conditions

## 🚀 Mobile Deployment

### Deployment Options

```bash
# Full deployment with all features
npm run rice:mobile:deploy -- --id rice_v1_tflite --platform both --compress

# Deploy without code generation
npm run rice:mobile:deploy -- --id rice_v1_tflite --platform both --no-code

# Deploy without documentation
npm run rice:mobile:deploy -- --id rice_v1_tflite --platform both --no-docs
```

### Deployment Package

```
mobile_deployment/
├── assets/
│   ├── rice_v1_tflite_int8.tflite
│   ├── rice_v1_tflite_fp16.tflite
│   ├── labels.json
│   └── meta.json
├── code/
│   ├── android/
│   │   └── TFLiteClassifier.kt
│   └── ios/
│       └── RiceClassifier.swift
├── docs/
│   ├── android-integration.md
│   ├── ios-integration.md
│   └── README.md
└── mobile_deployment.zip
```

## 📱 Mobile Project Creation

### Create Complete Mobile Projects

```bash
# Create both Android and iOS projects
npm run rice:mobile:project -- --id rice_v1_tflite --platform both

# Create Android project only
npm run rice:mobile:project -- --id rice_v1_tflite --platform android

# Create iOS project only
npm run rice:mobile:project -- --id rice_v1_tflite --platform ios
```

### Generated Project Structure

**Android:**
```
android/
├── app/
│   ├── build.gradle
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── assets/
│   │   └── java/com/example/riceclassifier/
│   │       └── MainActivity.kt
│   └── src/main/res/
└── build.gradle
```

**iOS:**
```
ios/
├── Podfile
├── RiceClassifier/
│   ├── Info.plist
│   ├── Resources/
│   └── Classes/
└── RiceClassifier.xcodeproj
```

## 🔄 CLI Commands

### Mobile Configuration

```bash
# Create mobile configuration
npm run rice:mobile:config -- --id rice_v1_tflite --platform both

# Create with specific quantization
npm run rice:mobile:config -- --id rice_v1_tflite --platform android --quantization int8
```

### Mobile Deployment

```bash
# Deploy to mobile platforms
npm run rice:mobile:deploy -- --id rice_v1_tflite --platform both

# Deploy with compression
npm run rice:mobile:deploy -- --id rice_v1_tflite --platform both --compress
```

### Mobile Testing

```bash
# Run mobile tests
npm run rice:mobile:test -- --id rice_v1_tflite --platform both

# Run with custom output directory
npm run rice:mobile:test -- --id rice_v1_tflite --platform both --output custom_results
```

### Mobile Code Generation

```bash
# Generate mobile integration code
npm run rice:mobile:generate -- --id rice_v1_tflite --platform both

# Generate for specific platform
npm run rice:mobile:generate -- --id rice_v1_tflite --platform android
```

## 📊 Performance Comparison

| Platform | Model Type | Size | Speed | Accuracy | Use Case |
|----------|------------|------|-------|----------|----------|
| Android | INT8 | 2-5MB | 30ms | 94% | Primary mobile |
| Android | Float16 | 7-10MB | 60ms | 95% | Fallback |
| iOS | INT8 | 2-5MB | 25ms | 94% | Primary mobile |
| iOS | Float16 | 7-10MB | 50ms | 95% | Fallback |

## 🐛 Troubleshooting

### Common Issues

1. **Model Loading Errors**
   - Check file paths and names
   - Verify model format (INT8 vs Float16)
   - Ensure proper asset bundling

2. **Preprocessing Issues**
   - Verify MobileNetV2 normalization
   - Check image resizing (224x224)
   - Validate channel order (RGB)

3. **Quantization Problems**
   - Check quantization parameters
   - Verify input/output tensor types
   - Test with representative data

4. **Performance Issues**
   - Monitor memory usage
   - Check inference time
   - Consider model optimization

### Debug Tools

```kotlin
// Android debugging
class DebugTFLiteClassifier : TFLiteClassifier {
    override fun classify(bitmap: Bitmap, topK: Int): List<Prediction> {
        val startTime = System.currentTimeMillis()
        val results = super.classify(bitmap, topK)
        val time = System.currentTimeMillis() - startTime
        
        Log.d("TFLiteDebug", "Inference time: ${time}ms")
        Log.d("TFLiteDebug", "Results: $results")
        
        return results
    }
}
```

```swift
// iOS debugging
class DebugRiceClassifier: RiceClassifier {
    override func classify(image: UIImage, topK: Int = 3) throws -> [Prediction] {
        let startTime = CFAbsoluteTimeGetCurrent()
        let results = try super.classify(image: image, topK: topK)
        let time = CFAbsoluteTimeGetCurrent() - startTime
        
        print("Inference time: \(time * 1000)ms")
        print("Results: \(results)")
        
        return results
    }
}
```

## 📚 Documentation

- [Android Integration Guide](./mobile/android-integration.md)
- [iOS Integration Guide](./mobile/ios-integration.md)
- [TFLite Framework Documentation](./TFLITE-README.md)
- [Rice Model Framework](./README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to deploy rice disease classification to mobile devices!** 📱✨
