package your.app.scan

import android.graphics.Bitmap
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import your.app.ml.*

class ScanFragment : Fragment() {

    private lateinit var viewModel: ScanViewModel
    private lateinit var cropViewModel: CropScanViewModel
    private lateinit var advancedViewModel: AdvancedScanViewModel

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Initialize ViewModels
        viewModel = ScanViewModel(requireActivity().application)
        cropViewModel = CropScanViewModel(requireActivity().application, Crop.RICE)
        advancedViewModel = AdvancedScanViewModel(requireActivity().application, Crop.DURIAN)
        
        return inflater.inflate(R.layout.fragment_scan, container, false)
    }

    private fun classifyImage(bitmap: Bitmap) {
        lifecycleScope.launch(Dispatchers.Default) {
            // Basic classification
            val preds = viewModel.classify(bitmap, topK = 3)
            
            withContext(Dispatchers.Main) {
                displayResults(preds)
            }
        }
    }

    private fun classifyImageWithCrop(bitmap: Bitmap, crop: Crop) {
        lifecycleScope.launch(Dispatchers.Default) {
            val cropViewModel = CropScanViewModel(requireActivity().application, crop)
            val preds = cropViewModel.classify(bitmap, topK = 3)
            
            withContext(Dispatchers.Main) {
                displayResults(preds)
            }
        }
    }

    private fun classifyImageAdvanced(bitmap: Bitmap) {
        lifecycleScope.launch(Dispatchers.Default) {
            val preds = advancedViewModel.classify(bitmap, topK = 3)
            val stats = advancedViewModel.getPerformanceStats()
            
            withContext(Dispatchers.Main) {
                displayResults(preds)
                displayPerformanceStats(stats)
            }
        }
    }

    private fun runBenchmark(bitmap: Bitmap) {
        lifecycleScope.launch(Dispatchers.Default) {
            val benchmarkStats = advancedViewModel.runBenchmark(bitmap)
            
            withContext(Dispatchers.Main) {
                displayBenchmarkResults(benchmarkStats)
            }
        }
    }

    private fun displayResults(predictions: List<Pred>) {
        val top1 = predictions.firstOrNull()
        val threshold = 0.75f
        val uncertain = (top1 == null) || (top1.confidence < threshold)
        
        if (uncertain) {
            // Show uncertain result
            showUncertainResult()
        } else {
            // Show confident result
            top1?.let { pred ->
                showConfidentResult(pred.label, pred.confidence)
            }
        }
    }

    private fun displayPerformanceStats(stats: String) {
        // Update UI with performance stats
        // e.g., textView.text = stats
    }

    private fun displayBenchmarkResults(stats: MlBenchmark.Stats) {
        val benchmarkText = """
            Benchmark Results:
            Median: ${stats.medianMs.toInt()}ms
            P95: ${stats.p95Ms.toInt()}ms
            P99: ${stats.p99Ms.toInt()}ms
            Min: ${stats.minMs.toInt()}ms
            Max: ${stats.maxMs.toInt()}ms
            Mean: ${stats.meanMs.toInt()}ms
        """.trimIndent()
        
        // Update UI with benchmark results
        // e.g., textView.text = benchmarkText
    }

    private fun showUncertainResult() {
        // Show uncertain result UI
        // e.g., "ไม่แน่ใจ - กรุณาถ่ายภาพใหม่"
    }

    private fun showConfidentResult(label: String, confidence: Float) {
        // Show confident result UI
        // e.g., "$label (${(confidence * 100).toInt()}%)"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // ViewModels will be cleared automatically
    }
}

/** Compose example */
/*
@Composable
fun ScanScreen(
    viewModel: ScanViewModel = hiltViewModel()
) {
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    var predictions by remember { mutableStateOf<List<Pred>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }

    LaunchedEffect(bitmap) {
        bitmap?.let { bmp ->
            isLoading = true
            val preds = withContext(Dispatchers.Default) {
                viewModel.classify(bmp, topK = 3)
            }
            predictions = preds
            isLoading = false
        }
    }

    Column {
        // Camera/Image picker
        ImagePicker { selectedBitmap ->
            bitmap = selectedBitmap
        }

        if (isLoading) {
            CircularProgressIndicator()
        } else {
            predictions.forEach { pred ->
                Text("${pred.label}: ${(pred.confidence * 100).toInt()}%")
            }
        }
    }
}
*/
