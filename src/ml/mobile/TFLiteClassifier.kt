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

data class Pred(val label: String, val confidence: Float)

class TFLiteClassifier(
  private val context: Context,
  private val modelAsset: String = "rice_v1_int8.tflite",
  private val labelsAsset: String = "labels.json",
  private val imgSize: Int = 224,
  private val numChannels: Int = 3,
  useNNAPI: Boolean = true,
  useGPU: Boolean = false
) : AutoCloseable {

  private val interpreter: Interpreter
  private var delegate: Delegate? = null
  private val labels: List<String>

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

  fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred> {
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

    // 5) Top-K
    val idxs = probs.indices.sortedByDescending { probs[it] }.take(topK)
    val preds = idxs.map { Pred(labels[it], probs[it]) }

    return preds
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
