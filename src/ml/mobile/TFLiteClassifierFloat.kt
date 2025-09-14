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

class TFLiteClassifierFloat(
  private val context: Context,
  private val modelAsset: String = "rice_v1_fp16.tflite",
  private val labelsAsset: String = "labels.json",
  private val imgSize: Int = 224,
  private val numChannels: Int = 3,
  useNNAPI: Boolean = false,
  useGPU: Boolean = true
) : AutoCloseable {

  private val interpreter: Interpreter
  private var delegate: Delegate? = null
  private val labels: List<String>

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
  }

  fun classify(bitmap: Bitmap, topK: Int = 3): List<Pred> {
    // 1) Preprocess: Resize -> RGB -> MobileNetV2 normalize -> float32
    val resized = Bitmap.createScaledBitmap(bitmap, imgSize, imgSize, true)
    val input = preprocessToFloat(resized)

    // 2) Prepare output (float32 logits)
    val numClasses = labels.size
    val output = Array(1) { FloatArray(numClasses) }

    // 3) Inference
    val start = System.nanoTime()
    interpreter.run(input, output)
    val inferMs = (System.nanoTime() - start) / 1_000_000.0

    // 4) Softmax + top-K
    val logits = output[0]
    val probs = softmax(logits)

    // 5) Top-K
    val idxs = probs.indices.sortedByDescending { probs[it] }.take(topK)
    val preds = idxs.map { Pred(labels[it], probs[it]) }

    return preds
  }

  /** MobileNetV2 preprocessing: (x/127.5) - 1.0, then convert to float32 */
  private fun preprocessToFloat(bm: Bitmap): ByteBuffer {
    val inputBuffer = ByteBuffer.allocateDirect(4 * 1 * imgSize * imgSize * numChannels) // 4 bytes per float
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

        // Store as float32
        inputBuffer.putFloat(rn)
        inputBuffer.putFloat(gn)
        inputBuffer.putFloat(bn)
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
