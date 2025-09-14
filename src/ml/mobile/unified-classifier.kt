package your.app.ml

import android.content.Context
import android.graphics.Bitmap

/** Unified prediction result */
data class Pred(val label: String, val confidence: Float)

/** Common classifier interface so UI/ViewModels don't care about backend. */
interface Classifier : AutoCloseable {
  /** Returns topK predictions (sorted by confidence desc). */
  fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred>
  override fun close()
}

/** Configuration knobs (can be filled from Remote Config or BuildConfig). */
data class ClassifierConfig(
  val backend: Backend = Backend.INT8,   // INT8 or FP16
  val useGPU: Boolean = false,           // FP16 likes GPU; INT8 usually CPU/NNAPI
  val useNNAPI: Boolean = true,          // INT8 likes NNAPI on many devices
  val modelAssetInt8: String = "rice_v1_int8.tflite",
  val modelAssetFp16: String = "rice_v1_fp16.tflite",
  val labelsAsset: String = "labels.json",
  val imgSize: Int = 224
) {
  enum class Backend { INT8, FP16 }
}

/** Factory that returns the right implementation based on config. */
object ClassifierFactory {
  fun create(context: Context, cfg: ClassifierConfig = ClassifierConfig()): Classifier {
    return when (cfg.backend) {
      ClassifierConfig.Backend.INT8 -> Int8ClassifierAdapter(
        TFLiteClassifier(
          context = context.applicationContext,
          modelAsset = cfg.modelAssetInt8,
          labelsAsset = cfg.labelsAsset,
          imgSize = cfg.imgSize,
          useNNAPI = cfg.useNNAPI,
          useGPU = false // GPU not ideal for fully-quantized int8
        )
      )
      ClassifierConfig.Backend.FP16 -> Fp16ClassifierAdapter(
        TFLiteClassifierFloat(
          context = context.applicationContext,
          modelAsset = cfg.modelAssetFp16,
          labelsAsset = cfg.labelsAsset,
          imgSize = cfg.imgSize,
          useNNAPI = false,             // default to GPU for FP16
          useGPU = cfg.useGPU
        )
      )
    }
  }
}

/** Adapters wrap your existing concrete classes to the common interface. */
private class Int8ClassifierAdapter(
  private val impl: TFLiteClassifier
) : Classifier {
  override fun classify(bitmap: Bitmap, topK: Int): List<Pred> = impl.classify(bitmap, topK)
  override fun close() = impl.close()
}

private class Fp16ClassifierAdapter(
  private val impl: TFLiteClassifierFloat
) : Classifier {
  override fun classify(bitmap: Bitmap, topK: Int): List<Pred> = impl.classify(bitmap, topK)
  override fun close() = impl.close()
}

/** Crop enumeration for model switching */
enum class Crop { RICE, DURIAN }

/** Model mapping for different crops */
data class CropModelMap(
  val riceInt8: String = "rice_v1_int8.tflite",
  val riceFp16: String = "rice_v1_fp16.tflite",
  val durianInt8: String = "durian_v1_int8.tflite",
  val durianFp16: String = "durian_v1_fp16.tflite",
  val labelsRice: String = "labels_rice.json",
  val labelsDurian: String = "labels_durian.json"
)

/** Build configuration for specific crop and backend */
fun buildConfigFor(crop: Crop, backend: ClassifierConfig.Backend, map: CropModelMap = CropModelMap()): ClassifierConfig {
  return when (crop) {
    Crop.RICE -> ClassifierConfig(
      backend = backend,
      modelAssetInt8 = map.riceInt8,
      modelAssetFp16 = map.riceFp16,
      labelsAsset = map.labelsRice,
      imgSize = 224,
      useGPU = backend == ClassifierConfig.Backend.FP16,
      useNNAPI = backend == ClassifierConfig.Backend.INT8
    )
    Crop.DURIAN -> ClassifierConfig(
      backend = backend,
      modelAssetInt8 = map.durianInt8,
      modelAssetFp16 = map.durianFp16,
      labelsAsset = map.labelsDurian,
      imgSize = 224,
      useGPU = backend == ClassifierConfig.Backend.FP16,
      useNNAPI = backend == ClassifierConfig.Backend.INT8
    )
  }
}

/** Performance benchmark utility */
object MlBenchmark {
  data class Stats(
    val medianMs: Double,
    val p95Ms: Double,
    val p99Ms: Double,
    val minMs: Double,
    val maxMs: Double,
    val meanMs: Double
  )

  fun run(
    warmups: Int = 5,
    runs: Int = 30,
    block: () -> Double
  ): Stats {
    // Warmup runs
    repeat(warmups) { block() }
    
    // Actual benchmark runs
    val times = mutableListOf<Double>()
    repeat(runs) {
      times.add(block())
    }
    
    times.sort()
    
    return Stats(
      medianMs = times[times.size / 2],
      p95Ms = times[(times.size * 0.95).toInt()],
      p99Ms = times[(times.size * 0.99).toInt()],
      minMs = times.minOrNull() ?: 0.0,
      maxMs = times.maxOrNull() ?: 0.0,
      meanMs = times.average()
    )
  }
}
