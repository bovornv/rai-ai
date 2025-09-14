// Model Evaluation and Testing Utilities
import { ClassifyTop } from "../lib/ml-pipeline";
import { ModelVersion } from "./model-versioning";
import { classifyBuffer } from "./infer";
import fs from "fs";
import path from "path";

export interface TestImage {
  path: string;
  true_label: string;
  predicted_label?: string;
  confidence?: number;
  correct?: boolean;
}

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  per_class_metrics: {
    [label: string]: {
      precision: number;
      recall: number;
      f1_score: number;
      support: number;
    };
  };
  inference_times: {
    mean: number;
    median: number;
    p95: number;
    p99: number;
  };
}

export interface EvaluationReport {
  model_id: string;
  model_version: string;
  test_dataset_size: number;
  evaluation_date: string;
  metrics: EvaluationMetrics;
  test_images: TestImage[];
  recommendations: string[];
}

export class ModelEvaluator {
  private testImagesDir: string;
  private resultsDir: string;

  constructor(testImagesDir = "test_images", resultsDir = "evaluation_results") {
    this.testImagesDir = testImagesDir;
    this.resultsDir = resultsDir;
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.testImagesDir, this.resultsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Load test images from directory structure
  loadTestImages(baseDir: string): TestImage[] {
    const testImages: TestImage[] = [];
    
    if (!fs.existsSync(baseDir)) {
      console.warn(`Test directory not found: ${baseDir}`);
      return testImages;
    }

    const classDirs = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const classDir of classDirs) {
      const classPath = path.join(baseDir, classDir);
      const imageFiles = fs.readdirSync(classPath)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file));

      for (const imageFile of imageFiles) {
        testImages.push({
          path: path.join(classPath, imageFile),
          true_label: classDir
        });
      }
    }

    console.log(`Loaded ${testImages.length} test images from ${classDirs.length} classes`);
    return testImages;
  }

  // Evaluate model on test dataset
  async evaluateModel(
    model: ModelVersion, 
    testImages: TestImage[],
    options: {
      batch_size?: number;
      confidence_threshold?: number;
      return_topk?: number;
    } = {}
  ): Promise<EvaluationReport> {
    const {
      batch_size = 1,
      confidence_threshold = 0.75,
      return_topk = 1
    } = options;

    console.log(`Evaluating model ${model.id} version ${model.version} on ${testImages.length} images`);

    const startTime = Date.now();
    const inferenceTimes: number[] = [];
    const predictions: { [path: string]: ClassifyTop[] } = {};

    // Process images in batches
    for (let i = 0; i < testImages.length; i += batch_size) {
      const batch = testImages.slice(i, i + batch_size);
      
      for (const testImage of batch) {
        try {
          const imageBuffer = fs.readFileSync(testImage.path);
          const inferenceStart = Date.now();
          
          const results = await classifyBuffer(
            {
              id: model.id,
              crop: model.crop,
              task: "disease-classification",
              version: model.version,
              input: { width: model.metadata.input_size, height: model.metadata.input_size, channels: 3 },
              labels: this.loadLabels(model.artifacts.labels_path),
              threshold_default: confidence_threshold,
              runtime: "onnx",
              path: model.artifacts.onnx_path
            },
            imageBuffer,
            return_topk
          );

          const inferenceTime = Date.now() - inferenceStart;
          inferenceTimes.push(inferenceTime);
          predictions[testImage.path] = results;

          // Update test image with prediction
          testImage.predicted_label = results[0].label;
          testImage.confidence = results[0].confidence;
          testImage.correct = testImage.predicted_label === testImage.true_label;

        } catch (error) {
          console.warn(`Failed to process image ${testImage.path}:`, error);
          testImage.predicted_label = "error";
          testImage.confidence = 0;
          testImage.correct = false;
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`Evaluation completed in ${totalTime}ms`);

    // Calculate metrics
    const metrics = this.calculateMetrics(testImages, inferenceTimes);
    const recommendations = this.generateRecommendations(metrics, testImages);

    const report: EvaluationReport = {
      model_id: model.id,
      model_version: model.version,
      test_dataset_size: testImages.length,
      evaluation_date: new Date().toISOString(),
      metrics,
      test_images: testImages,
      recommendations
    };

    // Save report
    this.saveEvaluationReport(report);

    return report;
  }

  // Calculate evaluation metrics
  private calculateMetrics(testImages: TestImage[], inferenceTimes: number[]): EvaluationMetrics {
    const labels = [...new Set(testImages.map(img => img.true_label))];
    const labelToIndex = Object.fromEntries(labels.map((label, i) => [label, i]));
    
    // Initialize confusion matrix
    const confusionMatrix = Array(labels.length).fill(null).map(() => Array(labels.length).fill(0));
    
    // Fill confusion matrix
    testImages.forEach(img => {
      if (img.predicted_label && img.predicted_label !== "error") {
        const trueIdx = labelToIndex[img.true_label];
        const predIdx = labelToIndex[img.predicted_label];
        if (trueIdx !== undefined && predIdx !== undefined) {
          confusionMatrix[trueIdx][predIdx]++;
        }
      }
    });

    // Calculate per-class metrics
    const perClassMetrics: { [label: string]: any } = {};
    
    labels.forEach((label, i) => {
      const truePositives = confusionMatrix[i][i];
      const falsePositives = confusionMatrix.reduce((sum, row) => sum + row[i], 0) - truePositives;
      const falseNegatives = confusionMatrix[i].reduce((sum, val) => sum + val, 0) - truePositives;
      
      const precision = truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
      const recall = truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
      const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
      
      perClassMetrics[label] = {
        precision,
        recall,
        f1_score: f1Score,
        support: truePositives + falseNegatives
      };
    });

    // Calculate overall metrics
    const correctPredictions = testImages.filter(img => img.correct).length;
    const accuracy = testImages.length > 0 ? correctPredictions / testImages.length : 0;
    
    const precision = Object.values(perClassMetrics).reduce((sum, metrics) => sum + metrics.precision, 0) / labels.length;
    const recall = Object.values(perClassMetrics).reduce((sum, metrics) => sum + metrics.recall, 0) / labels.length;
    const f1Score = Object.values(perClassMetrics).reduce((sum, metrics) => sum + metrics.f1_score, 0) / labels.length;

    // Calculate inference time statistics
    const sortedTimes = [...inferenceTimes].sort((a, b) => a - b);
    const mean = inferenceTimes.reduce((sum, time) => sum + time, 0) / inferenceTimes.length;
    const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    return {
      accuracy,
      precision,
      recall,
      f1_score: f1Score,
      confusion_matrix: confusionMatrix,
      per_class_metrics: perClassMetrics,
      inference_times: {
        mean,
        median,
        p95,
        p99
      }
    };
  }

  // Generate recommendations based on evaluation results
  private generateRecommendations(metrics: EvaluationMetrics, testImages: TestImage[]): string[] {
    const recommendations: string[] = [];

    // Accuracy recommendations
    if (metrics.accuracy < 0.8) {
      recommendations.push("Model accuracy is below 80%. Consider retraining with more data or data augmentation.");
    } else if (metrics.accuracy < 0.9) {
      recommendations.push("Model accuracy is good but could be improved. Consider fine-tuning hyperparameters.");
    } else {
      recommendations.push("Model accuracy is excellent. Consider deploying to production.");
    }

    // Per-class performance recommendations
    Object.entries(metrics.per_class_metrics).forEach(([label, classMetrics]) => {
      if (classMetrics.f1_score < 0.7) {
        recommendations.push(`Class '${label}' has low F1-score (${(classMetrics.f1_score * 100).toFixed(1)}%). Consider collecting more training data for this class.`);
      }
    });

    // Inference time recommendations
    if (metrics.inference_times.p95 > 1000) {
      recommendations.push("Inference time is high (>1s). Consider model optimization or quantization.");
    } else if (metrics.inference_times.p95 > 500) {
      recommendations.push("Inference time is moderate. Consider optimization for better performance.");
    }

    // Confidence distribution analysis
    const lowConfidenceImages = testImages.filter(img => (img.confidence || 0) < 0.5).length;
    const lowConfidenceRatio = lowConfidenceImages / testImages.length;
    
    if (lowConfidenceRatio > 0.2) {
      recommendations.push(`High number of low-confidence predictions (${(lowConfidenceRatio * 100).toFixed(1)}%). Consider adjusting confidence threshold or improving model training.`);
    }

    return recommendations;
  }

  // Load labels from file
  private loadLabels(labelsPath: string): string[] {
    try {
      const data = fs.readFileSync(labelsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Failed to load labels from ${labelsPath}:`, error);
      return [];
    }
  }

  // Save evaluation report
  private saveEvaluationReport(report: EvaluationReport): void {
    const reportPath = path.join(
      this.resultsDir, 
      `evaluation_${report.model_id}_${report.model_version}_${Date.now()}.json`
    );
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Evaluation report saved to: ${reportPath}`);
  }

  // Generate evaluation summary
  generateEvaluationSummary(report: EvaluationReport): string {
    const { metrics, test_images } = report;
    
    return `
# Model Evaluation Summary

## Model Information
- Model ID: ${report.model_id}
- Version: ${report.model_version}
- Test Dataset Size: ${report.test_dataset_size}
- Evaluation Date: ${report.evaluation_date}

## Performance Metrics
- **Accuracy**: ${(metrics.accuracy * 100).toFixed(2)}%
- **Precision**: ${(metrics.precision * 100).toFixed(2)}%
- **Recall**: ${(metrics.recall * 100).toFixed(2)}%
- **F1-Score**: ${(metrics.f1_score * 100).toFixed(2)}%

## Inference Performance
- **Mean Time**: ${metrics.inference_times.mean.toFixed(2)}ms
- **Median Time**: ${metrics.inference_times.median.toFixed(2)}ms
- **95th Percentile**: ${metrics.inference_times.p95.toFixed(2)}ms
- **99th Percentile**: ${metrics.inference_times.p99.toFixed(2)}ms

## Per-Class Performance
${Object.entries(metrics.per_class_metrics).map(([label, classMetrics]) => 
  `- **${label}**: Precision=${(classMetrics.precision * 100).toFixed(1)}%, Recall=${(classMetrics.recall * 100).toFixed(1)}%, F1=${(classMetrics.f1_score * 100).toFixed(1)}%`
).join('\n')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Confusion Matrix
${metrics.confusion_matrix.map((row, i) => 
  `${Object.keys(metrics.per_class_metrics)[i]}: [${row.join(', ')}]`
).join('\n')}
`;
  }

  // Compare two model evaluations
  compareEvaluations(report1: EvaluationReport, report2: EvaluationReport): string {
    const improvement = {
      accuracy: report2.metrics.accuracy - report1.metrics.accuracy,
      precision: report2.metrics.precision - report1.metrics.precision,
      recall: report2.metrics.recall - report1.metrics.recall,
      f1_score: report2.metrics.f1_score - report1.metrics.f1_score,
      inference_time: report2.metrics.inference_times.mean - report1.metrics.inference_times.mean
    };

    return `
# Model Comparison Report

## Model Versions
- Model 1: ${report1.model_id} v${report1.model_version}
- Model 2: ${report2.model_id} v${report2.model_version}

## Performance Comparison
- **Accuracy**: ${improvement.accuracy > 0 ? '+' : ''}${(improvement.accuracy * 100).toFixed(2)}%
- **Precision**: ${improvement.precision > 0 ? '+' : ''}${(improvement.precision * 100).toFixed(2)}%
- **Recall**: ${improvement.recall > 0 ? '+' : ''}${(improvement.recall * 100).toFixed(2)}%
- **F1-Score**: ${improvement.f1_score > 0 ? '+' : ''}${(improvement.f1_score * 100).toFixed(2)}%
- **Inference Time**: ${improvement.inference_time > 0 ? '+' : ''}${improvement.inference_time.toFixed(2)}ms

## Recommendation
${improvement.f1_score > 0.05 ? 
  'Model 2 shows significant improvement. Consider promoting to production.' :
  improvement.f1_score < -0.05 ?
  'Model 1 performs better. Consider keeping it in production.' :
  'Both models perform similarly. Consider other factors like inference time or model size.'
}
`;
  }
}

// Export singleton instance
export const modelEvaluator = new ModelEvaluator();
