# Rice Model Framework

A comprehensive framework for training, managing, and deploying rice disease classification models using PyTorch, ONNX, and TypeScript.

## 🚀 Features

- **Training Framework**: Complete PyTorch training pipeline with EfficientNet-B0
- **Model Versioning**: Track model versions, performance, and deployment status
- **Evaluation Tools**: Comprehensive model evaluation with metrics and reports
- **Deployment Management**: Automated model deployment and health monitoring
- **Performance Monitoring**: Real-time performance tracking and alerting
- **CLI Tools**: Command-line interface for all operations
- **Colab Integration**: Ready-to-use Google Colab notebooks

## 📁 Framework Structure

```
src/ml/
├── rice-framework.ts          # Core training framework
├── model-versioning.ts        # Model version management
├── model-evaluation.ts        # Evaluation and testing
├── model-deployment.ts        # Deployment management
├── training-config.ts         # Configuration management
├── model-monitoring.ts        # Performance monitoring
├── infer.ts                   # ONNX inference engine
├── infer-mock.ts              # Mock inference for testing
├── model-registry.ts          # Model registry
└── index.ts                   # Main exports
```

## 🛠️ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Training Configuration

```bash
npm run rice:config -- --name rice_experiment --id rice_v1 --crop rice
```

### 3. Generate Colab Notebook

```bash
npm run rice:notebook -- --id rice_v1 --crop rice --output rice_training.ipynb
```

### 4. Train Model in Colab

1. Upload your rice dataset to Google Drive
2. Open the generated notebook in Google Colab
3. Run all cells to train the model
4. Download the artifacts (`rice_artifacts.zip`)

### 5. Deploy Model

```bash
npm run rice:deploy -- --id rice_v1 --version 1.0.0 --env production
```

### 6. Monitor Performance

```bash
npm run rice:monitor -- --id rice_v1 --hours 24
```

## 📊 Dataset Structure

Organize your rice dataset as follows:

```
rice_dataset/
├── train/
│   ├── rice_brown_spot/
│   ├── rice_blast/
│   ├── bacterial_leaf_blight/
│   └── healthy/
├── val/
│   ├── rice_brown_spot/
│   ├── rice_blast/
│   ├── bacterial_leaf_blight/
│   └── healthy/
└── test/
    ├── rice_brown_spot/
    ├── rice_blast/
    ├── bacterial_leaf_blight/
    └── healthy/
```

## 🔧 Configuration

### Training Configuration

```typescript
import { trainingConfigManager } from './src/ml';

const config = trainingConfigManager.createTrainingConfig(
  'rice_experiment',
  'rice_v1',
  '1.0.0',
  'rice',
  {
    architecture: 'efficientnet_b0',
    epochs: 12,
    batch_size: 32,
    learning_rate: 3e-4
  }
);
```

### Model Versioning

```typescript
import { modelVersionManager } from './src/ml';

// Register a new model version
const modelVersion = modelVersionManager.registerModel({
  id: 'rice_v1',
  version: '1.0.0',
  crop: 'rice',
  performance: {
    accuracy: 0.85,
    precision: 0.84,
    recall: 0.83,
    f1_score: 0.835,
    confusion_matrix: []
  },
  artifacts: {
    onnx_path: './models/rice_v1.onnx',
    labels_path: './models/labels.json',
    meta_path: './models/meta.json',
    config_path: './models/config.json',
    metrics_path: './models/metrics.json'
  },
  metadata: {
    architecture: 'efficientnet_b0',
    input_size: 224,
    training_epochs: 12,
    dataset_size: 1000,
    training_time_hours: 2.5,
    created_by: 'user',
    description: 'Rice disease classification model'
  }
});
```

## 🧪 Evaluation

### Run Model Evaluation

```typescript
import { modelEvaluator } from './src/ml';

const testImages = modelEvaluator.loadTestImages('./test_images');
const report = await modelEvaluator.evaluateModel(model, testImages);
const summary = modelEvaluator.generateEvaluationSummary(report);
console.log(summary);
```

### CLI Evaluation

```bash
npm run rice:cli eval:run -- --id rice_v1 --test-dir ./test_images --output report.md
```

## 🚀 Deployment

### Deploy Model

```typescript
import { modelDeploymentManager } from './src/ml';

const config = modelDeploymentManager.createDeploymentConfig(
  'rice_v1',
  '1.0.0',
  'rice',
  'production'
);

const deployment = await modelDeploymentManager.deployModel(config);
```

### Monitor Deployment

```typescript
const status = modelDeploymentManager.getDeploymentStatus('rice_v1', '1.0.0', 'production');
const report = modelDeploymentManager.generateDeploymentReport();
```

## 📈 Performance Monitoring

### Record Metrics

```typescript
import { modelPerformanceMonitor } from './src/ml';

modelPerformanceMonitor.recordFromResponse(
  classificationResponse,
  inputSizeBytes,
  isCorrect
);
```

### Get Performance Stats

```typescript
const stats = modelPerformanceMonitor.getPerformanceStats('rice_v1', '1.0.0', 24);
const report = modelPerformanceMonitor.generatePerformanceReport('rice_v1', 24);
```

### Set Up Alerts

```typescript
const alertRule = modelPerformanceMonitor.createAlertRule({
  name: 'High Error Rate',
  model_id: 'rice_v1',
  metric: 'error_rate',
  operator: '>',
  threshold: 0.1,
  duration_minutes: 5,
  enabled: true
});
```

## 🖥️ CLI Commands

### Configuration Management

```bash
# Create training configuration
npm run rice:config -- --name experiment --id rice_v1 --crop rice

# Generate PyTorch training script
npm run rice:cli config:generate-script -- --config config.json --output train.py
```

### Model Management

```bash
# List all models
npm run rice:cli model:list

# Register new model
npm run rice:cli model:register -- --id rice_v1 --version 1.0.0 --crop rice
```

### Evaluation

```bash
# Run evaluation
npm run rice:cli eval:run -- --id rice_v1 --test-dir ./test_images
```

### Deployment

```bash
# Deploy model
npm run rice:cli deploy:create -- --id rice_v1 --version 1.0.0 --env production

# Check deployment status
npm run rice:cli deploy:status
```

### Monitoring

```bash
# View performance stats
npm run rice:cli monitor:stats -- --id rice_v1 --hours 24

# Check alerts
npm run rice:cli monitor:alerts
```

### Utilities

```bash
# Generate Colab notebook
npm run rice:notebook -- --id rice_v1 --crop rice

# Clean up old data
npm run rice:cli cleanup -- --days 30
```

## 🔄 Integration with ML Pipeline

The rice model framework integrates seamlessly with the existing ML pipeline:

```typescript
import { modelVersionManager } from './src/ml';

// Get model registry for ML pipeline
const modelRegistry = modelVersionManager.getModelRegistry();

// Use in ML API
app.use('/api/ml', mlRouter);
```

## 📋 Model Classes

### Rice Disease Classes

- `rice_brown_spot` - Brown spot disease
- `rice_blast` - Blast disease  
- `bacterial_leaf_blight` - Bacterial leaf blight
- `healthy` - Healthy rice leaves

### Durian Disease Classes

- `phytophthora_foot_rot` - Phytophthora foot rot
- `anthracnose` - Anthracnose
- `leaf_spot` - Leaf spot disease
- `healthy` - Healthy durian leaves

## 🎯 Best Practices

1. **Data Quality**: Ensure balanced dataset with at least 100 samples per class
2. **Augmentation**: Use data augmentation to improve model generalization
3. **Validation**: Always validate on held-out test set
4. **Versioning**: Track all model versions and performance metrics
5. **Monitoring**: Set up alerts for performance degradation
6. **Deployment**: Test models in staging before production deployment

## 🐛 Troubleshooting

### Common Issues

1. **Model not found**: Check model ID and version in registry
2. **Low accuracy**: Increase training data or adjust hyperparameters
3. **High inference time**: Consider model optimization or quantization
4. **Deployment failures**: Check model artifacts and file paths

### Debug Commands

```bash
# Check model registry
npm run rice:cli model:list

# Validate deployment
npm run rice:cli deploy:status

# Check performance
npm run rice:cli monitor:stats -- --id rice_v1
```

## 📚 API Reference

See individual module documentation:

- [Rice Framework](./rice-framework.ts)
- [Model Versioning](./model-versioning.ts)
- [Model Evaluation](./model-evaluation.ts)
- [Model Deployment](./model-deployment.ts)
- [Training Config](./training-config.ts)
- [Model Monitoring](./model-monitoring.ts)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
