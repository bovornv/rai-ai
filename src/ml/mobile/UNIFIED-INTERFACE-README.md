# Unified Classifier Interface

A unified interface for switching between INT8 and FP16 TFLite implementations without changing UI/ViewModels. This provides a clean abstraction layer for mobile app development.

## 🚀 Quick Start

### 1. Basic Usage

```kotlin
// Simple classification
val classifier = ClassifierFactory.create(context)
val predictions = classifier.classify(bitmap, topK = 3)
```

### 2. Crop-Specific Classification

```kotlin
// Rice classification
val riceClassifier = ClassifierFactory.create(
    context,
    buildConfigFor(Crop.RICE, ClassifierConfig.Backend.INT8)
)

// Durian classification
val durianClassifier = ClassifierFactory.create(
    context,
    buildConfigFor(Crop.DURIAN, ClassifierConfig.Backend.FP16)
)
```

### 3. ViewModel Integration

```kotlin
class ScanViewModel(app: Application) : AndroidViewModel(app) {
    private val classifier: Classifier by lazy {
        ClassifierFactory.create(app.applicationContext, pickConfig())
    }

    fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred> = 
        classifier.classify(bitmap, topK)
}
```

## 📱 Architecture

### Core Components

1. **Classifier Interface**: Common interface for all implementations
2. **ClassifierFactory**: Factory for creating appropriate implementations
3. **ClassifierConfig**: Configuration for backend selection and optimization
4. **CropModelMap**: Model mapping for different crops
5. **Adapters**: Bridge between concrete implementations and interface

### Backend Selection

| Backend | Model Size | Speed | Accuracy | Use Case |
|---------|------------|-------|----------|----------|
| INT8 | 2-5MB | 30ms | 94% | Low-end devices, primary mobile |
| FP16 | 7-10MB | 60ms | 95% | Mid/high-end devices, fallback |

### Device Heuristics

```kotlin
private fun pickBackend(): ClassifierConfig.Backend {
    val mem = Runtime.getRuntime().maxMemory() / (1024 * 1024) // MB
    val cores = Runtime.getRuntime().availableProcessors()
    val isLowEnd = mem < 2000 || cores <= 4
    return if (isLowEnd) ClassifierConfig.Backend.INT8 else ClassifierConfig.Backend.FP16
}
```

## 🔧 Configuration

### Basic Configuration

```kotlin
val config = ClassifierConfig(
    backend = ClassifierConfig.Backend.INT8,
    useGPU = false,
    useNNAPI = true,
    modelAssetInt8 = "rice_v1_int8.tflite",
    modelAssetFp16 = "rice_v1_fp16.tflite",
    labelsAsset = "labels.json",
    imgSize = 224
)
```

### Crop-Specific Configuration

```kotlin
val map = CropModelMap(
    riceInt8 = "rice_v1_int8.tflite",
    riceFp16 = "rice_v1_fp16.tflite",
    durianInt8 = "durian_v1_int8.tflite",
    durianFp16 = "durian_v1_fp16.tflite",
    labelsRice = "labels_rice.json",
    labelsDurian = "labels_durian.json"
)

val riceConfig = buildConfigFor(Crop.RICE, ClassifierConfig.Backend.INT8, map)
val durianConfig = buildConfigFor(Crop.DURIAN, ClassifierConfig.Backend.FP16, map)
```

## 📊 Performance Monitoring

### Basic Performance Tracking

```kotlin
class AdvancedScanViewModel(app: Application) : AndroidViewModel(app) {
    private val performanceMonitor = PerformanceMonitor()

    fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred> {
        val startTime = System.nanoTime()
        val result = classifier.classify(bitmap, topK)
        val inferenceTime = (System.nanoTime() - startTime) / 1_000_000.0
        
        performanceMonitor.recordInference(inferenceTime)
        return result
    }

    fun getPerformanceStats(): String = performanceMonitor.getStats()
}
```

### Benchmark Testing

```kotlin
val benchmarkStats = MlBenchmark.run(
    warmups = 5,
    runs = 30
) {
    val t0 = System.nanoTime()
    classifier.classify(bitmap, topK = 1)
    (System.nanoTime() - t0) / 1_000_000.0
}

println("Median: ${benchmarkStats.medianMs}ms")
println("P95: ${benchmarkStats.p95Ms}ms")
```

## 🧪 Testing

### Unit Testing

```kotlin
@Test
fun testClassifierInterface() {
    val classifier = ClassifierFactory.create(context)
    val testBitmap = createTestBitmap()
    
    val predictions = classifier.classify(testBitmap, topK = 3)
    
    assertFalse(predictions.isEmpty())
    assertTrue(predictions.first().confidence > 0f)
    assertTrue(predictions.first().confidence <= 1f)
}
```

### Integration Testing

```kotlin
@Test
fun testCropSwitching() {
    val riceClassifier = ClassifierFactory.create(
        context,
        buildConfigFor(Crop.RICE, ClassifierConfig.Backend.INT8)
    )
    val durianClassifier = ClassifierFactory.create(
        context,
        buildConfigFor(Crop.DURIAN, ClassifierConfig.Backend.INT8)
    )
    
    val ricePredictions = riceClassifier.classify(testBitmap)
    val durianPredictions = durianClassifier.classify(testBitmap)
    
    // Both should return predictions
    assertFalse(ricePredictions.isEmpty())
    assertFalse(durianPredictions.isEmpty())
}
```

## 📱 UI Integration

### Fragment Usage

```kotlin
class ScanFragment : Fragment() {
    private lateinit var viewModel: ScanViewModel

    private fun classifyImage(bitmap: Bitmap) {
        lifecycleScope.launch(Dispatchers.Default) {
            val preds = viewModel.classify(bitmap, topK = 3)
            
            withContext(Dispatchers.Main) {
                displayResults(preds)
            }
        }
    }

    private fun displayResults(predictions: List<Pred>) {
        val top1 = predictions.firstOrNull()
        val threshold = 0.75f
        val uncertain = (top1 == null) || (top1.confidence < threshold)
        
        if (uncertain) {
            showUncertainResult()
        } else {
            top1?.let { pred ->
                showConfidentResult(pred.label, pred.confidence)
            }
        }
    }
}
```

### Compose Usage

```kotlin
@Composable
fun ScanScreen(
    viewModel: ScanViewModel = hiltViewModel()
) {
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    var predictions by remember { mutableStateOf<List<Pred>>(emptyList()) }

    LaunchedEffect(bitmap) {
        bitmap?.let { bmp ->
            val preds = withContext(Dispatchers.Default) {
                viewModel.classify(bmp, topK = 3)
            }
            predictions = preds
        }
    }

    Column {
        ImagePicker { selectedBitmap ->
            bitmap = selectedBitmap
        }

        predictions.forEach { pred ->
            Text("${pred.label}: ${(pred.confidence * 100).toInt()}%")
        }
    }
}
```

## 🔄 Crop Switching

### Dynamic Crop Selection

```kotlin
class CropScanViewModel(
    app: Application,
    private val crop: Crop
) : AndroidViewModel(app) {

    private val map = CropModelMap()
    private val cfg = buildConfigFor(crop, pickBackend(), map)
    
    private val classifier: Classifier by lazy {
        ClassifierFactory.create(app.applicationContext, cfg)
    }

    fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred> = 
        classifier.classify(bitmap, topK)
}
```

### Runtime Crop Switching

```kotlin
class DynamicScanViewModel(app: Application) : AndroidViewModel(app) {
    private var currentCrop: Crop = Crop.RICE
    private var classifier: Classifier? = null

    fun switchCrop(crop: Crop) {
        currentCrop = crop
        classifier?.close()
        classifier = ClassifierFactory.create(
            app.applicationContext,
            buildConfigFor(crop, pickBackend())
        )
    }

    fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred> = 
        classifier?.classify(bitmap, topK) ?: emptyList()
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Model Loading Errors**
   - Check asset file paths and names
   - Verify model format compatibility
   - Ensure proper asset bundling

2. **Performance Issues**
   - Monitor inference times
   - Check memory usage
   - Consider backend switching

3. **Crop Switching Issues**
   - Verify crop enum values
   - Check asset file names
   - Ensure proper configuration

### Debug Tools

```kotlin
class DebugClassifier(
    private val impl: Classifier
) : Classifier {
    override fun classify(bitmap: Bitmap, topK: Int): List<Pred> {
        val startTime = System.nanoTime()
        val result = impl.classify(bitmap, topK)
        val time = (System.nanoTime() - startTime) / 1_000_000.0
        
        Log.d("ClassifierDebug", "Inference time: ${time}ms")
        Log.d("ClassifierDebug", "Results: $result")
        
        return result
    }

    override fun close() = impl.close()
}
```

## 📚 API Reference

### Classifier Interface

```kotlin
interface Classifier : AutoCloseable {
    fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred>
    override fun close()
}
```

### ClassifierConfig

```kotlin
data class ClassifierConfig(
    val backend: Backend = Backend.INT8,
    val useGPU: Boolean = false,
    val useNNAPI: Boolean = true,
    val modelAssetInt8: String = "rice_v1_int8.tflite",
    val modelAssetFp16: String = "rice_v1_fp16.tflite",
    val labelsAsset: String = "labels.json",
    val imgSize: Int = 224
)
```

### CropModelMap

```kotlin
data class CropModelMap(
    val riceInt8: String = "rice_v1_int8.tflite",
    val riceFp16: String = "rice_v1_fp16.tflite",
    val durianInt8: String = "durian_v1_int8.tflite",
    val durianFp16: String = "durian_v1_fp16.tflite",
    val labelsRice: String = "labels_rice.json",
    val labelsDurian: String = "labels_durian.json"
)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to use unified classifier interface for mobile apps!** 📱✨
