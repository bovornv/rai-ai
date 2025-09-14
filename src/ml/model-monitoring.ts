// Model Performance Monitoring and Metrics
import { ClassifyResponse } from "../lib/ml-pipeline";
import fs from "fs";
import path from "path";

export interface PerformanceMetrics {
  timestamp: string;
  model_id: string;
  model_version: string;
  inference_time_ms: number;
  confidence: number;
  prediction_correct: boolean;
  input_size_bytes: number;
  error_type?: string;
  error_message?: string;
}

export interface ModelPerformanceStats {
  model_id: string;
  model_version: string;
  time_period: {
    start: string;
    end: string;
  };
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_inference_time: number;
  p50_inference_time: number;
  p95_inference_time: number;
  p99_inference_time: number;
  avg_confidence: number;
  accuracy: number;
  error_rate: number;
  requests_per_minute: number;
  throughput_mb_per_second: number;
}

export interface AlertRule {
  id: string;
  name: string;
  model_id: string;
  metric: keyof ModelPerformanceStats;
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=";
  threshold: number;
  duration_minutes: number;
  enabled: boolean;
  last_triggered?: string;
}

export interface Alert {
  id: string;
  rule_id: string;
  model_id: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  triggered_at: string;
  resolved_at?: string;
  status: "active" | "resolved";
  metrics: any;
}

export class ModelPerformanceMonitor {
  private metricsDir: string;
  private alertsDir: string;
  private rulesDir: string;
  private metrics: PerformanceMetrics[] = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];

  constructor(
    metricsDir = "monitoring/metrics",
    alertsDir = "monitoring/alerts",
    rulesDir = "monitoring/rules"
  ) {
    this.metricsDir = metricsDir;
    this.alertsDir = alertsDir;
    this.rulesDir = rulesDir;
    this.ensureDirectories();
    this.loadData();
  }

  private ensureDirectories() {
    [this.metricsDir, this.alertsDir, this.rulesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadData() {
    // Load metrics
    try {
      const metricsFile = path.join(this.metricsDir, "metrics.json");
      if (fs.existsSync(metricsFile)) {
        const data = fs.readFileSync(metricsFile, 'utf8');
        this.metrics = JSON.parse(data);
      }
    } catch (error) {
      console.warn("Failed to load metrics:", error);
    }

    // Load alerts
    try {
      const alertsFile = path.join(this.alertsDir, "alerts.json");
      if (fs.existsSync(alertsFile)) {
        const data = fs.readFileSync(alertsFile, 'utf8');
        this.alerts = JSON.parse(data);
      }
    } catch (error) {
      console.warn("Failed to load alerts:", error);
    }

    // Load alert rules
    try {
      const rulesFile = path.join(this.rulesDir, "rules.json");
      if (fs.existsSync(rulesFile)) {
        const data = fs.readFileSync(rulesFile, 'utf8');
        this.alertRules = JSON.parse(data);
      }
    } catch (error) {
      console.warn("Failed to load alert rules:", error);
    }
  }

  private saveData() {
    // Save metrics
    const metricsFile = path.join(this.metricsDir, "metrics.json");
    fs.writeFileSync(metricsFile, JSON.stringify(this.metrics, null, 2));

    // Save alerts
    const alertsFile = path.join(this.alertsDir, "alerts.json");
    fs.writeFileSync(alertsFile, JSON.stringify(this.alerts, null, 2));

    // Save alert rules
    const rulesFile = path.join(this.rulesDir, "rules.json");
    fs.writeFileSync(rulesFile, JSON.stringify(this.alertRules, null, 2));
  }

  // Record performance metrics
  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 10000 metrics to prevent memory issues
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }

    this.saveData();
    this.checkAlerts(metrics);
  }

  // Record metrics from classification response
  recordFromResponse(
    response: ClassifyResponse,
    inputSizeBytes: number,
    isCorrect: boolean = false
  ): void {
    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      model_id: response.model_id,
      model_version: response.model_version,
      inference_time_ms: response.timing_ms.total,
      confidence: response.chosen.confidence,
      prediction_correct: isCorrect,
      input_size_bytes: inputSizeBytes
    };

    this.recordMetrics(metrics);
  }

  // Get performance statistics for a model
  getPerformanceStats(
    modelId: string,
    modelVersion?: string,
    timeWindowHours: number = 24
  ): ModelPerformanceStats | null {
    const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
    
    const filteredMetrics = this.metrics.filter(m => {
      const metricTime = new Date(m.timestamp);
      const matchesModel = m.model_id === modelId;
      const matchesVersion = !modelVersion || m.model_version === modelVersion;
      const inTimeWindow = metricTime >= cutoffTime;
      
      return matchesModel && matchesVersion && inTimeWindow;
    });

    if (filteredMetrics.length === 0) {
      return null;
    }

    const successfulMetrics = filteredMetrics.filter(m => !m.error_type);
    const failedMetrics = filteredMetrics.filter(m => m.error_type);

    const inferenceTimes = successfulMetrics.map(m => m.inference_time_ms).sort((a, b) => a - b);
    const confidences = successfulMetrics.map(m => m.confidence);
    const correctPredictions = successfulMetrics.filter(m => m.prediction_correct).length;

    const totalRequests = filteredMetrics.length;
    const successfulRequests = successfulMetrics.length;
    const failedRequests = failedMetrics.length;

    return {
      model_id: modelId,
      model_version: modelVersion || "all",
      time_period: {
        start: cutoffTime.toISOString(),
        end: new Date().toISOString()
      },
      total_requests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      avg_inference_time: inferenceTimes.reduce((sum, time) => sum + time, 0) / inferenceTimes.length,
      p50_inference_time: this.percentile(inferenceTimes, 50),
      p95_inference_time: this.percentile(inferenceTimes, 95),
      p99_inference_time: this.percentile(inferenceTimes, 99),
      avg_confidence: confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length,
      accuracy: successfulRequests > 0 ? correctPredictions / successfulRequests : 0,
      error_rate: totalRequests > 0 ? failedRequests / totalRequests : 0,
      requests_per_minute: totalRequests / (timeWindowHours * 60),
      throughput_mb_per_second: successfulMetrics.reduce((sum, m) => sum + m.input_size_bytes, 0) / (timeWindowHours * 60 * 60 * 1024 * 1024)
    };
  }

  // Calculate percentile
  private percentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) {
      return sortedArray[sortedArray.length - 1];
    }

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  // Create alert rule
  createAlertRule(rule: Omit<AlertRule, "id">): AlertRule {
    const alertRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.alertRules.push(alertRule);
    this.saveData();
    return alertRule;
  }

  // Check alerts for new metrics
  private checkAlerts(metrics: PerformanceMetrics): void {
    const relevantRules = this.alertRules.filter(rule => 
      rule.enabled && 
      rule.model_id === metrics.model_id &&
      !rule.last_triggered
    );

    for (const rule of relevantRules) {
      const stats = this.getPerformanceStats(metrics.model_id, metrics.model_version, 1);
      if (!stats) continue;

      const metricValue = stats[rule.metric];
      if (metricValue === undefined) continue;

      let shouldTrigger = false;
      switch (rule.operator) {
        case ">": shouldTrigger = metricValue > rule.threshold; break;
        case "<": shouldTrigger = metricValue < rule.threshold; break;
        case ">=": shouldTrigger = metricValue >= rule.threshold; break;
        case "<=": shouldTrigger = metricValue <= rule.threshold; break;
        case "==": shouldTrigger = metricValue === rule.threshold; break;
        case "!=": shouldTrigger = metricValue !== rule.threshold; break;
      }

      if (shouldTrigger) {
        this.triggerAlert(rule, stats);
        rule.last_triggered = new Date().toISOString();
      }
    }

    this.saveData();
  }

  // Trigger alert
  private triggerAlert(rule: AlertRule, stats: ModelPerformanceStats): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rule_id: rule.id,
      model_id: rule.model_id,
      severity: this.determineSeverity(rule, stats),
      message: this.generateAlertMessage(rule, stats),
      triggered_at: new Date().toISOString(),
      status: "active",
      metrics: stats
    };

    this.alerts.push(alert);
    console.warn(`🚨 Alert triggered: ${alert.message}`);
  }

  // Determine alert severity
  private determineSeverity(rule: AlertRule, stats: ModelPerformanceStats): "low" | "medium" | "high" | "critical" {
    const metricValue = stats[rule.metric];
    const threshold = rule.threshold;
    const deviation = Math.abs(metricValue - threshold) / threshold;

    if (deviation > 2) return "critical";
    if (deviation > 1) return "high";
    if (deviation > 0.5) return "medium";
    return "low";
  }

  // Generate alert message
  private generateAlertMessage(rule: AlertRule, stats: ModelPerformanceStats): string {
    const metricValue = stats[rule.metric];
    const threshold = rule.threshold;

    return `Model ${rule.model_id}: ${rule.metric} is ${metricValue.toFixed(2)} ${rule.operator} ${threshold} (threshold: ${threshold})`;
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.status === "active");
  }

  // Resolve alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = "resolved";
    alert.resolved_at = new Date().toISOString();
    this.saveData();
    return true;
  }

  // Generate performance report
  generatePerformanceReport(modelId: string, timeWindowHours: number = 24): string {
    const stats = this.getPerformanceStats(modelId, undefined, timeWindowHours);
    if (!stats) {
      return `No performance data found for model ${modelId} in the last ${timeWindowHours} hours`;
    }

    const activeAlerts = this.getActiveAlerts().filter(alert => alert.model_id === modelId);

    return `
# Model Performance Report

## Model Information
- Model ID: ${stats.model_id}
- Version: ${stats.model_version}
- Time Period: ${stats.time_period.start} to ${stats.time_period.end}

## Performance Metrics
- **Total Requests**: ${stats.total_requests}
- **Successful Requests**: ${stats.successful_requests}
- **Failed Requests**: ${stats.failed_requests}
- **Success Rate**: ${((stats.successful_requests / stats.total_requests) * 100).toFixed(2)}%
- **Error Rate**: ${(stats.error_rate * 100).toFixed(2)}%

## Inference Performance
- **Average Time**: ${stats.avg_inference_time.toFixed(2)}ms
- **50th Percentile**: ${stats.p50_inference_time.toFixed(2)}ms
- **95th Percentile**: ${stats.p95_inference_time.toFixed(2)}ms
- **99th Percentile**: ${stats.p99_inference_time.toFixed(2)}ms

## Quality Metrics
- **Average Confidence**: ${(stats.avg_confidence * 100).toFixed(2)}%
- **Accuracy**: ${(stats.accuracy * 100).toFixed(2)}%

## Throughput
- **Requests per Minute**: ${stats.requests_per_minute.toFixed(2)}
- **Throughput**: ${stats.throughput_mb_per_second.toFixed(2)} MB/s

## Active Alerts
${activeAlerts.length > 0 ? 
  activeAlerts.map(alert => `- **${alert.severity.toUpperCase()}**: ${alert.message}`).join('\n') :
  'No active alerts'
}

## Recommendations
${this.generateRecommendations(stats, activeAlerts)}
`;
  }

  // Generate recommendations based on performance
  private generateRecommendations(stats: ModelPerformanceStats, alerts: Alert[]): string {
    const recommendations: string[] = [];

    if (stats.error_rate > 0.1) {
      recommendations.push("High error rate detected. Investigate model stability and input validation.");
    }

    if (stats.p95_inference_time > 1000) {
      recommendations.push("High inference times detected. Consider model optimization or hardware upgrade.");
    }

    if (stats.accuracy < 0.8) {
      recommendations.push("Low accuracy detected. Consider retraining or model improvement.");
    }

    if (stats.avg_confidence < 0.7) {
      recommendations.push("Low confidence predictions. Consider adjusting confidence threshold or improving model training.");
    }

    if (alerts.length > 0) {
      recommendations.push(`${alerts.length} active alert(s) require attention.`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Model performance is within acceptable ranges.");
    }

    return recommendations.map(rec => `- ${rec}`).join('\n');
  }

  // Clean up old metrics and alerts
  cleanup(daysToKeep: number = 30): { metricsRemoved: number; alertsRemoved: number } {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const initialMetricsCount = this.metrics.length;
    const initialAlertsCount = this.alerts.length;

    // Remove old metrics
    this.metrics = this.metrics.filter(m => new Date(m.timestamp) >= cutoffDate);

    // Remove old resolved alerts
    this.alerts = this.alerts.filter(a => 
      a.status === "active" || new Date(a.triggered_at) >= cutoffDate
    );

    this.saveData();

    return {
      metricsRemoved: initialMetricsCount - this.metrics.length,
      alertsRemoved: initialAlertsCount - this.alerts.length
    };
  }

  // Export metrics to CSV
  exportMetricsToCSV(modelId: string, outputPath: string): void {
    const modelMetrics = this.metrics.filter(m => m.model_id === modelId);
    
    if (modelMetrics.length === 0) {
      console.warn(`No metrics found for model ${modelId}`);
      return;
    }

    const csvHeader = "timestamp,model_id,model_version,inference_time_ms,confidence,prediction_correct,input_size_bytes,error_type,error_message\n";
    const csvRows = modelMetrics.map(m => 
      `${m.timestamp},${m.model_id},${m.model_version},${m.inference_time_ms},${m.confidence},${m.prediction_correct},${m.input_size_bytes},${m.error_type || ""},${m.error_message || ""}\n`
    ).join("");

    fs.writeFileSync(outputPath, csvHeader + csvRows);
    console.log(`Metrics exported to ${outputPath}`);
  }
}

// Export singleton instance
export const modelPerformanceMonitor = new ModelPerformanceMonitor();
