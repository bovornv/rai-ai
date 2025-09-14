package your.app.scan

import android.app.Application
import android.graphics.Bitmap
import androidx.lifecycle.AndroidViewModel
import your.app.ml.*

class ScanViewModel(app: Application) : AndroidViewModel(app) {

  // Example: decide from Remote Config / BuildConfig / device capability
  private val cfg = ClassifierConfig(
    backend = pickBackend(),
    useGPU = true,          // try GPU for FP16
    useNNAPI = true,        // try NNAPI for INT8
    modelAssetInt8 = "rice_v1_int8.tflite",
    modelAssetFp16 = "rice_v1_fp16.tflite",
    labelsAsset = "labels.json",
    imgSize = 224
  )

  private val classifier: Classifier by lazy {
    ClassifierFactory.create(app.applicationContext, cfg)
  }

  /** One-shot inference (UI thread should call this on a Worker/Coroutine). */
  fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred> = classifier.classify(bitmap, topK)

  override fun onCleared() {
    super.onCleared()
    classifier.close()
  }

  /** Simple heuristic: try INT8 on low-end; FP16 on mid/high. Replace with Remote Config if you want. */
  private fun pickBackend(): ClassifierConfig.Backend {
    val mem = Runtime.getRuntime().maxMemory() / (1024 * 1024) // MB
    val cores = Runtime.getRuntime().availableProcessors()
    val isLowEnd = mem < 2000 || cores <= 4
    return if (isLowEnd) ClassifierConfig.Backend.INT8 else ClassifierConfig.Backend.FP16
  }
}

/** Crop-specific ViewModel for switching between Rice and Durian */
class CropScanViewModel(
  app: Application,
  private val crop: Crop
) : AndroidViewModel(app) {

  private val map = CropModelMap()
  private val cfg = buildConfigFor(crop, pickBackend(), map)
  
  private val classifier: Classifier by lazy {
    ClassifierFactory.create(app.applicationContext, cfg)
  }

  fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred> = classifier.classify(bitmap, topK)

  override fun onCleared() {
    super.onCleared()
    classifier.close()
  }

  private fun pickBackend(): ClassifierConfig.Backend {
    val mem = Runtime.getRuntime().maxMemory() / (1024 * 1024) // MB
    val cores = Runtime.getRuntime().availableProcessors()
    val isLowEnd = mem < 2000 || cores <= 4
    return if (isLowEnd) ClassifierConfig.Backend.INT8 else ClassifierConfig.Backend.FP16
  }
}

/** Advanced ViewModel with performance monitoring */
class AdvancedScanViewModel(
  app: Application,
  private val crop: Crop = Crop.RICE
) : AndroidViewModel(app) {

  private val map = CropModelMap()
  private val cfg = buildConfigFor(crop, pickBackend(), map)
  
  private val classifier: Classifier by lazy {
    ClassifierFactory.create(app.applicationContext, cfg)
  }

  private val performanceMonitor = PerformanceMonitor()

  fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred> {
    val startTime = System.nanoTime()
    val result = classifier.classify(bitmap, topK)
    val inferenceTime = (System.nanoTime() - startTime) / 1_000_000.0
    
    performanceMonitor.recordInference(inferenceTime)
    return result
  }

  fun getPerformanceStats(): String = performanceMonitor.getStats()

  fun runBenchmark(bitmap: Bitmap): MlBenchmark.Stats {
    return MlBenchmark.run(
      warmups = 5,
      runs = 30
    ) {
      val t0 = System.nanoTime()
      classifier.classify(bitmap, topK = 1)
      (System.nanoTime() - t0) / 1_000_000.0
    }
  }

  override fun onCleared() {
    super.onCleared()
    classifier.close()
  }

  private fun pickBackend(): ClassifierConfig.Backend {
    val mem = Runtime.getRuntime().maxMemory() / (1024 * 1024) // MB
    val cores = Runtime.getRuntime().availableProcessors()
    val isLowEnd = mem < 2000 || cores <= 4
    return if (isLowEnd) ClassifierConfig.Backend.INT8 else ClassifierConfig.Backend.FP16
  }
}

/** Performance monitoring utility */
private class PerformanceMonitor {
  private val inferenceTimes = mutableListOf<Double>()
  private val maxSamples = 100

  fun recordInference(timeMs: Double) {
    inferenceTimes.add(timeMs)
    if (inferenceTimes.size > maxSamples) {
      inferenceTimes.removeAt(0)
    }
  }

  fun getStats(): String {
    if (inferenceTimes.isEmpty()) return "No data"
    
    val sorted = inferenceTimes.sorted()
    val median = sorted[sorted.size / 2]
    val p95 = sorted[(sorted.size * 0.95).toInt()]
    val mean = sorted.average()
    val min = sorted.minOrNull() ?: 0.0
    val max = sorted.maxOrNull() ?: 0.0
    
    return "Inference: median=${median.toInt()}ms, p95=${p95.toInt()}ms, mean=${mean.toInt()}ms, min=${min.toInt()}ms, max=${max.toInt()}ms"
  }
}
