# Android TFLite Integration Guide

Complete Android integration for rice disease classification using TensorFlow Lite with INT8 quantization and MobileNetV2 preprocessing.

## 🚀 Quick Start

### 1. Gradle Setup

```gradle
// app/build.gradle
android {
    compileSdk 34
    
    defaultConfig {
        // ...
        aaptOptions { 
            noCompress "tflite" 
        }
        // For AGP 8+: 
        // androidResources { 
        //     noCompress 'tflite' 
        // }
    }
}

dependencies {
    implementation("org.tensorflow:tensorflow-lite:2.14.0")
    implementation("org.tensorflow:tensorflow-lite-support:0.4.4")
    
    // Optional: GPU and NNAPI delegates
    implementation("org.tensorflow:tensorflow-lite-gpu:2.14.0")
    implementation("org.tensorflow:tensorflow-lite-select-tf-ops:2.14.0")
}
```

### 2. Asset Files

Place these files in `app/src/main/assets/`:

```
assets/
├── rice_v1_int8.tflite          # INT8 quantized model
├── rice_v1_fp16.tflite          # Float16 fallback model
├── labels.json                  # Class labels
└── meta.json                    # Model metadata
```

### 3. TFLite Classifier

Create `app/src/main/java/your/app/ml/TFLiteClassifier.kt`:

```kotlin
package your.app.ml

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import org.json.JSONArray
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.Delegate
import org.tensorflow.lite.nnapi.NnApiDelegate
import org.tensorflow.lite.gpu.GpuDelegate
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.exp

data class Prediction(
    val label: String, 
    val confidence: Float,
    val isUncertain: Boolean = false
)

class TFLiteClassifier(
    private val context: Context,
    private val modelAsset: String = "rice_v1_int8.tflite",
    private val labelsAsset: String = "labels.json",
    private val metaAsset: String = "meta.json",
    private val imgSize: Int = 224,
    private val numChannels: Int = 3,
    useNNAPI: Boolean = true,
    useGPU: Boolean = false
) : AutoCloseable {

    private val interpreter: Interpreter
    private var delegate: Delegate? = null
    private val labels: List<String>
    private val threshold: Float

    // Quantization parameters
    private var inScale = 1f
    private var inZero = 0
    private var outScale = 1f
    private var outZero = 0

    init {
        val options = Interpreter.Options().apply {
            setNumThreads(4)
            if (useGPU) {
                delegate = GpuDelegate().also { addDelegate(it) }
            } else if (useNNAPI) {
                delegate = NnApiDelegate().also { addDelegate(it) }
            }
        }

        interpreter = Interpreter(loadAssetToBuffer(modelAsset), options)
        labels = loadLabels(labelsAsset)
        threshold = loadThreshold(metaAsset)

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

    fun classify(bitmap: Bitmap, topK: Int = 3): List<Prediction> {
        // 1) Preprocess: Resize -> RGB -> MobileNetV2 normalize -> quantize to int8
        val resized = Bitmap.createScaledBitmap(bitmap, imgSize, imgSize, true)
        val input = preprocessToInt8(resized)

        // 2) Prepare output (int8 logits)
        val numClasses = labels.size
        val output = Array(1) { ByteArray(numClasses) }

        // 3) Inference
        val start = System.nanoTime()
        interpreter.run(input, output)
        val inferMs = (System.nanoTime() - start) / 1_000_000.0

        // 4) Dequantize to float and softmax
        val logits = FloatArray(numClasses)
        for (i in 0 until numClasses) {
            val q = output[0][i].toInt()
            logits[i] = (q - outZero) * outScale
        }
        val probs = softmax(logits)

        // 5) Top-K with uncertainty detection
        val idxs = probs.indices.sortedByDescending { probs[it] }.take(topK)
        val predictions = idxs.map { idx ->
            val confidence = probs[idx]
            val isUncertain = confidence < threshold
            Prediction(
                label = labels[idx],
                confidence = confidence,
                isUncertain = isUncertain
            )
        }

        return predictions
    }

    /** MobileNetV2 preprocessing: (x/127.5) - 1.0, then quantize to int8 */
    private fun preprocessToInt8(bm: Bitmap): ByteBuffer {
        val inputBuffer = ByteBuffer.allocateDirect(1 * imgSize * imgSize * numChannels)
        inputBuffer.order(ByteOrder.nativeOrder())

        for (y in 0 until imgSize) {
            for (x in 0 until imgSize) {
                val px = bm.getPixel(x, y)
                val r = Color.red(px).toFloat()
                val g = Color.green(px).toFloat()
                val b = Color.blue(px).toFloat()

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

    private fun loadAssetToBuffer(assetName: String): ByteBuffer {
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

    private fun loadLabels(assetName: String): List<String> {
        context.assets.open(assetName).use { input ->
            val text = BufferedReader(InputStreamReader(input)).readText()
            val arr = JSONArray(text)
            return List(arr.length()) { i -> arr.getString(i) }
        }
    }

    private fun loadThreshold(assetName: String): Float {
        return try {
            context.assets.open(assetName).use { input ->
                val text = BufferedReader(InputStreamReader(input)).readText()
                val json = org.json.JSONObject(text)
                json.getDouble("threshold_default").toFloat()
            }
        } catch (e: Exception) {
            0.75f // Default threshold
        }
    }

    private fun softmax(logits: FloatArray): FloatArray {
        val max = logits.maxOrNull() ?: 0f
        val exps = FloatArray(logits.size) { i -> 
            exp((logits[i] - max).toDouble()).toFloat() 
        }
        val sum = exps.sum()
        return FloatArray(logits.size) { i -> 
            if (sum > 0f) exps[i] / sum else 0f 
        }
    }

    override fun close() {
        try { interpreter.close() } catch (_: Throwable) {}
        try { delegate?.close() } catch (_: Throwable) {}
    }
}
```

### 4. Usage in ViewModel

```kotlin
class ScanViewModel(app: Application) : AndroidViewModel(app) {
    private val classifier by lazy { 
        TFLiteClassifier(app.applicationContext) 
    }

    fun classify(bitmap: Bitmap): List<Prediction> {
        return classifier.classify(bitmap, topK = 3)
    }

    fun getDiseaseAdvice(prediction: Prediction): String {
        return when (prediction.label) {
            "rice_brown_spot" -> "โรคใบจุดสีน้ำตาล: ใช้สารเคมีป้องกันกำจัดเชื้อรา"
            "rice_blast" -> "โรคไหม้: ใช้สารเคมีป้องกันกำจัดเชื้อรา"
            "bacterial_leaf_blight" -> "โรคใบไหม้แบคทีเรีย: ใช้สารเคมีป้องกันกำจัดแบคทีเรีย"
            "healthy" -> "ใบข้าวแข็งแรง: ดูแลรักษาต่อไป"
            else -> "ไม่สามารถระบุโรคได้"
        }
    }

    override fun onCleared() {
        super.onCleared()
        classifier.close()
    }
}
```

### 5. UI Integration

```kotlin
class ScanActivity : AppCompatActivity() {
    private lateinit var viewModel: ScanViewModel
    private lateinit var binding: ActivityScanBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScanBinding.inflate(layoutInflater)
        setContentView(binding.root)

        viewModel = ViewModelProvider(this)[ScanViewModel::class.java]

        binding.btnScan.setOnClickListener {
            // Take photo or select from gallery
            takePhoto()
        }
    }

    private fun takePhoto() {
        // Implementation for camera/gallery
        // After getting bitmap:
        val predictions = viewModel.classify(bitmap)
        displayResults(predictions)
    }

    private fun displayResults(predictions: List<Prediction>) {
        val topPrediction = predictions.firstOrNull()
        
        if (topPrediction?.isUncertain == true) {
            binding.tvResult.text = "ไม่แน่ใจ - กรุณาถ่ายภาพใหม่"
            binding.tvAdvice.text = "คำแนะนำ: ตรวจสอบแสงสว่างและความชัดเจนของภาพ"
        } else {
            topPrediction?.let { pred ->
                binding.tvResult.text = "${pred.label} (${(pred.confidence * 100).toInt()}%)"
                binding.tvAdvice.text = viewModel.getDiseaseAdvice(pred)
            }
        }
    }
}
```

## 🔧 Advanced Configuration

### Model Selection

```kotlin
class ModelManager(private val context: Context) {
    private var int8Classifier: TFLiteClassifier? = null
    private var fp16Classifier: TFLiteClassifier? = null

    fun getClassifier(): TFLiteClassifier {
        return try {
            // Try INT8 first (smaller, faster)
            int8Classifier ?: TFLiteClassifier(
                context = context,
                modelAsset = "rice_v1_int8.tflite"
            ).also { int8Classifier = it }
        } catch (e: Exception) {
            // Fallback to Float16
            fp16Classifier ?: TFLiteClassifier(
                context = context,
                modelAsset = "rice_v1_fp16.tflite"
            ).also { fp16Classifier = it }
        }
    }
}
```

### Performance Optimization

```kotlin
class OptimizedTFLiteClassifier(
    context: Context,
    useNNAPI: Boolean = true,
    useGPU: Boolean = false
) : TFLiteClassifier(
    context = context,
    useNNAPI = useNNAPI,
    useGPU = useGPU
) {
    
    // Batch processing for multiple images
    fun classifyBatch(bitmaps: List<Bitmap>): List<List<Prediction>> {
        return bitmaps.map { classify(it) }
    }
    
    // Async classification
    fun classifyAsync(
        bitmap: Bitmap,
        callback: (List<Prediction>) -> Unit
    ) {
        Thread {
            val results = classify(bitmap)
            runOnUiThread { callback(results) }
        }.start()
    }
}
```

## 📊 Performance Monitoring

```kotlin
class PerformanceMonitor {
    private val inferenceTimes = mutableListOf<Long>()
    
    fun recordInference(timeMs: Long) {
        inferenceTimes.add(timeMs)
        if (inferenceTimes.size > 100) {
            inferenceTimes.removeAt(0)
        }
    }
    
    fun getAverageInferenceTime(): Long {
        return if (inferenceTimes.isNotEmpty()) {
            inferenceTimes.average().toLong()
        } else 0L
    }
    
    fun getPerformanceStats(): String {
        val avg = getAverageInferenceTime()
        val min = inferenceTimes.minOrNull() ?: 0L
        val max = inferenceTimes.maxOrNull() ?: 0L
        return "Avg: ${avg}ms, Min: ${min}ms, Max: ${max}ms"
    }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Assets not found**
   - Ensure files are in `app/src/main/assets/`
   - Check file names match exactly
   - Verify `aaptOptions { noCompress "tflite" }`

2. **Wrong preprocessing**
   - MobileNetV2 uses `(x/127.5) - 1.0`
   - Keep consistent with training notebook
   - Verify quantization parameters

3. **Channel order**
   - Code uses NHWC (RGB)
   - If model expects NCHW, re-export or transpose

4. **Quantization parameters**
   - Always read from interpreter
   - Don't hardcode scale/zero values

5. **Delegates**
   - NNAPI may speed up on some devices
   - GPU works better with float models
   - Test on target devices

### Debug Tools

```kotlin
class DebugTFLiteClassifier(
    context: Context
) : TFLiteClassifier(context) {
    
    override fun classify(bitmap: Bitmap, topK: Int): List<Prediction> {
        val start = System.nanoTime()
        val results = super.classify(bitmap, topK)
        val time = (System.nanoTime() - start) / 1_000_000.0
        
        Log.d("TFLiteDebug", "Inference time: ${time}ms")
        Log.d("TFLiteDebug", "Input scale: $inScale, zero: $inZero")
        Log.d("TFLiteDebug", "Output scale: $outScale, zero: $outZero")
        Log.d("TFLiteDebug", "Results: $results")
        
        return results
    }
}
```

## 📱 Testing

### Unit Tests

```kotlin
@Test
fun testClassification() {
    val classifier = TFLiteClassifier(context)
    val testBitmap = createTestBitmap()
    
    val predictions = classifier.classify(testBitmap)
    
    assertTrue(predictions.isNotEmpty())
    assertTrue(predictions.first().confidence > 0f)
    assertTrue(predictions.first().confidence <= 1f)
}
```

### Integration Tests

```kotlin
@Test
fun testModelLoading() {
    val classifier = TFLiteClassifier(context)
    assertNotNull(classifier)
    
    // Test with known image
    val testImage = loadTestImage("healthy_rice.jpg")
    val predictions = classifier.classify(testImage)
    
    val healthyPrediction = predictions.find { it.label == "healthy" }
    assertNotNull(healthyPrediction)
    assertTrue(healthyPrediction!!.confidence > 0.5f)
}
```

## 🚀 Deployment

### Build Configuration

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // Keep TFLite models
            proguardFiles 'proguard-tflite.pro'
        }
    }
}
```

### ProGuard Rules

```proguard
# proguard-tflite.pro
-keep class org.tensorflow.lite.** { *; }
-keep class org.tensorflow.lite.nnapi.** { *; }
-keep class org.tensorflow.lite.gpu.** { *; }
```

This Android integration provides a complete, production-ready solution for rice disease classification on mobile devices! 📱✨
