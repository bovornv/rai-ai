#!/usr/bin/env ts-node

/**
 * Rice Model Management CLI
 * Usage: ts-node scripts/rice-model-cli.ts <command> [options]
 */

import { Command } from 'commander';
import { 
  riceModelManager, 
  modelVersionManager, 
  modelEvaluator, 
  modelDeploymentManager,
  trainingConfigManager,
  modelPerformanceMonitor
} from '../src/ml';
import { tfliteModelManager } from '../src/ml/tflite-framework';
import { mobileModelConfigManager } from '../src/ml/mobile-config';
import { mobileDeploymentManager } from '../src/ml/mobile-deployment';
import { mobileTestingFramework } from '../src/ml/mobile-testing';
import { durianModelManager } from '../src/ml/durian-framework';

const program = new Command();

program
  .name('rice-model-cli')
  .description('Rice Model Management CLI')
  .version('1.0.0');

// Training configuration commands
program
  .command('config:create')
  .description('Create training configuration')
  .option('-n, --name <name>', 'Experiment name')
  .option('-i, --id <id>', 'Model ID')
  .option('-v, --version <version>', 'Model version')
  .option('-c, --crop <crop>', 'Crop type (rice|durian)')
  .option('-a, --arch <architecture>', 'Model architecture')
  .option('-e, --epochs <epochs>', 'Number of epochs')
  .option('-b, --batch-size <size>', 'Batch size')
  .option('-l, --lr <rate>', 'Learning rate')
  .action((options) => {
    const config = trainingConfigManager.createTrainingConfig(
      options.name || 'rice_experiment',
      options.id || 'rice_v1',
      options.version || '1.0.0',
      options.crop || 'rice',
      {
        architecture: options.arch || 'efficientnet_b0',
        epochs: parseInt(options.epochs) || 12,
        batch_size: parseInt(options.batchSize) || 32,
        learning_rate: parseFloat(options.lr) || 3e-4
      }
    );

    const configPath = trainingConfigManager.saveTrainingConfig(config);
    console.log(`Training configuration created: ${configPath}`);
  });

program
  .command('config:generate-script')
  .description('Generate PyTorch training script from configuration')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-o, --output <path>', 'Output script path')
  .action((options) => {
    const config = trainingConfigManager.loadTrainingConfig(options.config);
    const script = trainingConfigManager.generateTrainingScript(config);
    
    const outputPath = options.output || `training_${config.experiment_name}.py`;
    require('fs').writeFileSync(outputPath, script);
    console.log(`Training script generated: ${outputPath}`);
  });

// Model versioning commands
program
  .command('model:list')
  .description('List all model versions')
  .option('-i, --id <id>', 'Filter by model ID')
  .action((options) => {
    const stats = modelVersionManager.getRegistryStats();
    console.log('Model Registry Statistics:');
    console.log(`Total Models: ${stats.total_models}`);
    console.log(`Production: ${stats.production_models}`);
    console.log(`Staging: ${stats.staging_models}`);
    console.log(`Deprecated: ${stats.deprecated_models}`);
    console.log(`Crops: ${JSON.stringify(stats.crops, null, 2)}`);
  });

program
  .command('model:register')
  .description('Register a new model version')
  .option('-i, --id <id>', 'Model ID')
  .option('-v, --version <version>', 'Model version')
  .option('-c, --crop <crop>', 'Crop type')
  .option('-p, --onnx-path <path>', 'ONNX model path')
  .option('-l, --labels-path <path>', 'Labels file path')
  .option('-m, --meta-path <path>', 'Metadata file path')
  .action((options) => {
    const modelVersion = modelVersionManager.registerModel({
      id: options.id,
      version: options.version,
      crop: options.crop,
      performance: {
        accuracy: 0.85,
        precision: 0.84,
        recall: 0.83,
        f1_score: 0.835,
        confusion_matrix: []
      },
      artifacts: {
        onnx_path: options.onnxPath,
        labels_path: options.labelsPath,
        meta_path: options.metaPath,
        config_path: '',
        metrics_path: ''
      },
      metadata: {
        architecture: 'efficientnet_b0',
        input_size: 224,
        training_epochs: 12,
        dataset_size: 1000,
        training_time_hours: 2.5,
        created_by: 'cli',
        description: 'Registered via CLI'
      }
    });

    console.log(`Model registered: ${modelVersion.id} v${modelVersion.version}`);
  });

// Evaluation commands
program
  .command('eval:run')
  .description('Run model evaluation')
  .option('-i, --id <id>', 'Model ID')
  .option('-v, --version <version>', 'Model version')
  .option('-d, --test-dir <path>', 'Test images directory')
  .option('-o, --output <path>', 'Output report path')
  .action(async (options) => {
    const model = modelVersionManager.getModel(options.id, options.version);
    if (!model) {
      console.error(`Model ${options.id} version ${options.version} not found`);
      return;
    }

    const testImages = modelEvaluator.loadTestImages(options.testDir);
    if (testImages.length === 0) {
      console.error('No test images found');
      return;
    }

    console.log(`Running evaluation on ${testImages.length} test images...`);
    const report = await modelEvaluator.evaluateModel(model, testImages);
    
    const summary = modelEvaluator.generateEvaluationSummary(report);
    console.log(summary);

    if (options.output) {
      require('fs').writeFileSync(options.output, summary);
      console.log(`Report saved to: ${options.output}`);
    }
  });

// Deployment commands
program
  .command('deploy:create')
  .description('Deploy a model version')
  .option('-i, --id <id>', 'Model ID')
  .option('-v, --version <version>', 'Model version')
  .option('-e, --env <environment>', 'Deployment environment')
  .action(async (options) => {
    const config = modelDeploymentManager.createDeploymentConfig(
      options.id,
      options.version,
      'rice', // Default to rice
      options.env || 'production'
    );

    try {
      const deployment = await modelDeploymentManager.deployModel(config);
      console.log(`Model deployed successfully: ${deployment.model_id} v${deployment.version}`);
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  });

program
  .command('deploy:status')
  .description('Show deployment status')
  .action(() => {
    const deployments = modelDeploymentManager.getAllDeployments();
    const report = modelDeploymentManager.generateDeploymentReport();
    console.log(report);
  });

// Monitoring commands
program
  .command('monitor:stats')
  .description('Show model performance statistics')
  .option('-i, --id <id>', 'Model ID')
  .option('-v, --version <version>', 'Model version')
  .option('-h, --hours <hours>', 'Time window in hours')
  .action((options) => {
    const stats = modelPerformanceMonitor.getPerformanceStats(
      options.id || 'rice_v1',
      options.version,
      parseInt(options.hours) || 24
    );

    if (!stats) {
      console.log('No performance data found');
      return;
    }

    const report = modelPerformanceMonitor.generatePerformanceReport(
      options.id || 'rice_v1',
      parseInt(options.hours) || 24
    );
    console.log(report);
  });

program
  .command('monitor:alerts')
  .description('Show active alerts')
  .action(() => {
    const alerts = modelPerformanceMonitor.getActiveAlerts();
    if (alerts.length === 0) {
      console.log('No active alerts');
      return;
    }

    console.log(`Active Alerts (${alerts.length}):`);
    alerts.forEach(alert => {
      console.log(`- [${alert.severity.toUpperCase()}] ${alert.message}`);
      console.log(`  Model: ${alert.model_id}, Triggered: ${alert.triggered_at}`);
    });
  });

// Utility commands
program
  .command('notebook:generate')
  .description('Generate Colab training notebook')
  .option('-i, --id <id>', 'Model ID')
  .option('-v, --version <version>', 'Model version')
  .option('-c, --crop <crop>', 'Crop type')
  .option('-t, --type <type>', 'Notebook type (pytorch|tflite|both)', 'both')
  .option('-o, --output <path>', 'Output notebook path')
  .action((options) => {
    const config = riceModelManager.createDefaultConfig();
    const datasetConfig = riceModelManager.createDefaultDatasetConfig();
    
    if (options.type === 'pytorch' || options.type === 'both') {
      const pytorchNotebook = riceModelManager.generatePyTorchNotebook(config, datasetConfig);
      const pytorchPath = options.output || `training_${options.id || 'rice'}_pytorch.py`;
      require('fs').writeFileSync(pytorchPath, pytorchNotebook);
      console.log(`PyTorch notebook generated: ${pytorchPath}`);
    }
    
    if (options.type === 'tflite' || options.type === 'both') {
      const tfliteNotebook = riceModelManager.generateTFLiteNotebook(config, datasetConfig);
      const tflitePath = options.output || `training_${options.id || 'rice'}_tflite.py`;
      require('fs').writeFileSync(tflitePath, tfliteNotebook);
      console.log(`TFLite notebook generated: ${tflitePath}`);
    }
  });

// TFLite specific commands
program
  .command('tflite:config')
  .description('Create TFLite training configuration')
  .option('-i, --id <id>', 'Model ID')
  .option('-v, --version <version>', 'Model version')
  .option('-c, --crop <crop>', 'Crop type')
  .option('-a, --arch <architecture>', 'Model architecture (mobilenet_v2|efficientnet_b0)')
  .option('-e, --epochs <epochs>', 'Number of epochs')
  .option('-b, --batch-size <size>', 'Batch size')
  .option('-l, --lr <rate>', 'Learning rate')
  .action((options) => {
    const config = tfliteModelManager.createDefaultConfig();
    config.id = options.id || 'rice_v1_tflite';
    config.version = options.version || '1.0.0';
    config.architecture = options.arch || 'mobilenet_v2';
    config.epochs = parseInt(options.epochs) || 12;
    config.batch_size = parseInt(options.batchSize) || 32;
    config.learning_rate = parseFloat(options.lr) || 3e-4;

    const configPath = tfliteModelManager.saveConfig(config);
    console.log(`TFLite configuration created: ${configPath}`);
  });

program
  .command('tflite:notebook')
  .description('Generate TFLite Colab notebook')
  .option('-i, --id <id>', 'Model ID')
  .option('-v, --version <version>', 'Model version')
  .option('-c, --crop <crop>', 'Crop type')
  .option('-o, --output <path>', 'Output notebook path')
  .action((options) => {
    const config = tfliteModelManager.createDefaultConfig();
    const datasetConfig = tfliteModelManager.createDefaultDatasetConfig();
    
    const notebook = tfliteModelManager.generateTrainingNotebook(config, datasetConfig);
    
    const outputPath = options.output || `tflite_training_${options.id || 'rice'}.py`;
    require('fs').writeFileSync(outputPath, notebook);
    console.log(`TFLite notebook generated: ${outputPath}`);
  });

program
  .command('tflite:deploy')
  .description('Deploy TFLite model artifacts')
  .option('-i, --id <id>', 'Model ID')
  .option('-v, --version <version>', 'Model version')
  .option('-p, --int8-path <path>', 'INT8 TFLite model path')
  .option('-f, --fp16-path <path>', 'Float16 TFLite model path')
  .option('-l, --labels-path <path>', 'Labels file path')
  .option('-m, --meta-path <path>', 'Metadata file path')
  .action((options) => {
    const artifacts = {
      savedmodel_path: '', // Not needed for deployment
      int8_tflite_path: options.int8Path || `./artifacts/${options.id}_int8.tflite`,
      float16_tflite_path: options.fp16Path || `./artifacts/${options.id}_fp16.tflite`,
      labels_path: options.labelsPath || `./artifacts/labels.json`,
      meta_path: options.metaPath || `./artifacts/meta.json`,
      config_path: '',
      metrics_path: ''
    };

    const success = tfliteModelManager.deployModel(artifacts);
    if (success) {
      console.log(`TFLite model ${options.id} deployed successfully`);
    } else {
      console.error(`Failed to deploy TFLite model ${options.id}`);
    }
  });

// Mobile deployment commands
program
  .command('mobile:config')
  .description('Create mobile model configuration')
  .option('-i, --id <id>', 'Model ID')
  .option('-p, --platform <platform>', 'Platform (android|ios|both)', 'both')
  .option('-q, --quantization <type>', 'Quantization (int8|float16|both)', 'both')
  .action((options) => {
    const config = mobileModelConfigManager.createMobileConfig(
      { 
        id: options.id || 'rice_v1', 
        crop: 'rice', 
        task: 'disease-classification', 
        version: '1.0.0', 
        input: { width: 224, height: 224, channels: 3 }, 
        labels: [], 
        threshold_default: 0.75, 
        runtime: 'tflite', 
        path: '' 
      },
      options.platform,
      options.quantization
    );
    
    const configPath = mobileModelConfigManager.saveMobileConfig(config);
    console.log(`Mobile configuration created: ${configPath}`);
  });

program
  .command('mobile:deploy')
  .description('Deploy model to mobile platforms')
  .option('-i, --id <id>', 'Model ID')
  .option('-p, --platform <platform>', 'Platform (android|ios|both)', 'both')
  .option('-q, --quantization <type>', 'Quantization (int8|float16|both)', 'both')
  .option('-o, --output <dir>', 'Output directory', 'mobile_deployment')
  .option('--no-code', 'Skip code generation')
  .option('--no-docs', 'Skip documentation generation')
  .option('--compress', 'Compress assets')
  .action(async (options) => {
    const model = { 
      id: options.id || 'rice_v1', 
      crop: 'rice' as const, 
      task: 'disease-classification' as const, 
      version: '1.0.0', 
      input: { width: 224, height: 224, channels: 3 }, 
      labels: ['rice_brown_spot', 'rice_blast', 'bacterial_leaf_blight', 'healthy'], 
      threshold_default: 0.75, 
      runtime: 'tflite' as const, 
      path: '' 
    };
    
    const deploymentOptions = {
      platform: options.platform,
      quantization: options.quantization,
      outputDir: options.output,
      includeDocumentation: !options.noDocs,
      generateCode: !options.noCode,
      compressAssets: options.compress
    };
    
    console.log('Deploying mobile model...');
    const result = await mobileDeploymentManager.deployModel(model, deploymentOptions);
    
    if (result.success) {
      console.log('✅ Mobile deployment completed successfully!');
      console.log(`📁 Output directory: ${result.outputDir}`);
      console.log(`📦 Assets: ${result.assets.length} files`);
      console.log(`💻 Generated code: ${result.generatedCode.length} files`);
      console.log(`📚 Documentation: ${result.documentation.length} files`);
    } else {
      console.error('❌ Mobile deployment failed!');
      result.errors.forEach(error => console.error(`  - ${error}`));
    }
  });

program
  .command('mobile:test')
  .description('Run mobile tests')
  .option('-i, --id <id>', 'Model ID')
  .option('-p, --platform <platform>', 'Platform (android|ios|both)', 'both')
  .option('-o, --output <dir>', 'Output directory', 'mobile_test_results')
  .action(async (options) => {
    const testConfig = mobileTestingFramework.createTestConfig(
      options.id || 'rice_v1',
      options.platform
    );
    
    console.log('Running mobile tests...');
    const testSuite = await mobileTestingFramework.runTests(testConfig);
    
    console.log('📊 Test Results:');
    console.log(`  Overall: ${testSuite.summary.overallPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Passed: ${testSuite.summary.passedTests}/${testSuite.summary.totalTests}`);
    console.log(`  Avg Inference Time: ${testSuite.summary.averageInferenceTime.toFixed(1)}ms`);
    console.log(`  Avg Accuracy: ${(testSuite.summary.averageAccuracy * 100).toFixed(1)}%`);
    
    // Generate test report
    const report = mobileTestingFramework.generateTestReport(testSuite);
    const reportPath = `${options.output}/test_report.md`;
    require('fs').writeFileSync(reportPath, report);
    console.log(`📋 Test report saved: ${reportPath}`);
  });

program
  .command('mobile:generate')
  .description('Generate mobile integration code')
  .option('-i, --id <id>', 'Model ID')
  .option('-p, --platform <platform>', 'Platform (android|ios|both)', 'both')
  .option('-o, --output <dir>', 'Output directory', 'mobile_code')
  .action((options) => {
    const config = mobileModelConfigManager.createMobileConfig(
      { 
        id: options.id || 'rice_v1', 
        crop: 'rice', 
        task: 'disease-classification', 
        version: '1.0.0', 
        input: { width: 224, height: 224, channels: 3 }, 
        labels: ['rice_brown_spot', 'rice_blast', 'bacterial_leaf_blight', 'healthy'], 
        threshold_default: 0.75, 
        runtime: 'tflite', 
        path: '' 
      },
      options.platform,
      'both'
    );
    
    if (options.platform === 'android' || options.platform === 'both') {
      const androidCode = mobileModelConfigManager.generateMobileCode(config, 'android');
      if (androidCode.kotlin) {
        const androidPath = `${options.output}/android/TFLiteClassifier.kt`;
        require('fs').mkdirSync(require('path').dirname(androidPath), { recursive: true });
        require('fs').writeFileSync(androidPath, androidCode.kotlin);
        console.log(`📱 Android code generated: ${androidPath}`);
      }
    }
    
    if (options.platform === 'ios' || options.platform === 'both') {
      const iosCode = mobileModelConfigManager.generateMobileCode(config, 'ios');
      if (iosCode.swift) {
        const iosPath = `${options.output}/ios/RiceClassifier.swift`;
        require('fs').mkdirSync(require('path').dirname(iosPath), { recursive: true });
        require('fs').writeFileSync(iosPath, iosCode.swift);
        console.log(`🍎 iOS code generated: ${iosPath}`);
      }
    }
  });

program
  .command('mobile:project')
  .description('Create mobile project structure')
  .option('-i, --id <id>', 'Model ID')
  .option('-p, --platform <platform>', 'Platform (android|ios|both)', 'both')
  .option('-o, --output <dir>', 'Output directory', 'mobile_projects')
  .action(async (options) => {
    const modelId = options.id || 'rice_v1';
    const outputDir = options.output;
    
    if (options.platform === 'android' || options.platform === 'both') {
      console.log('Creating Android project...');
      const androidFiles = await mobileDeploymentManager.createAndroidProject(modelId, outputDir);
      console.log(`📱 Android project created: ${androidFiles.length} files`);
    }
    
    if (options.platform === 'ios' || options.platform === 'both') {
      console.log('Creating iOS project...');
      const iosFiles = await mobileDeploymentManager.createiOSProject(modelId, outputDir);
      console.log(`🍎 iOS project created: ${iosFiles.length} files`);
    }
  });

// Durian-specific commands
program
  .command('durian:config')
  .description('Create Durian model configuration')
  .option('-i, --id <id>', 'Model ID', 'durian_v1_tflite')
  .option('-v, --version <version>', 'Model version', '1.0.0')
  .option('-a, --arch <architecture>', 'Model architecture (mobilenet_v2|efficientnet_b0)', 'mobilenet_v2')
  .option('-e, --epochs <epochs>', 'Number of epochs', '12')
  .option('-b, --batch-size <size>', 'Batch size', '32')
  .option('-l, --lr <rate>', 'Learning rate', '3e-4')
  .action((options) => {
    const config = durianModelManager.createDefaultConfig();
    config.id = options.id;
    config.version = options.version;
    config.architecture = options.arch;
    config.epochs = parseInt(options.epochs);
    config.batch_size = parseInt(options.batchSize);
    config.learning_rate = parseFloat(options.lr);

    const configPath = durianModelManager.saveConfig(config);
    console.log(`Durian configuration created: ${configPath}`);
  });

program
  .command('durian:notebook')
  .description('Generate Durian training notebook')
  .option('-i, --id <id>', 'Model ID', 'durian_v1_tflite')
  .option('-t, --type <type>', 'Notebook type (pytorch|tflite|both)', 'both')
  .option('-o, --output <path>', 'Output notebook path')
  .action((options) => {
    const config = durianModelManager.createDefaultConfig();
    const datasetConfig = durianModelManager.createDefaultDatasetConfig();
    
    if (options.type === 'pytorch' || options.type === 'both') {
      const pytorchNotebook = durianModelManager.generatePyTorchNotebook(config, datasetConfig);
      const pytorchPath = options.output || `durian_training_${options.id}_pytorch.py`;
      require('fs').writeFileSync(pytorchPath, pytorchNotebook);
      console.log(`PyTorch notebook generated: ${pytorchPath}`);
    }
    
    if (options.type === 'tflite' || options.type === 'both') {
      const tfliteNotebook = durianModelManager.generateTFLiteNotebook(config, datasetConfig);
      const tflitePath = options.output || `durian_training_${options.id}_tflite.py`;
      require('fs').writeFileSync(tflitePath, tfliteNotebook);
      console.log(`TFLite notebook generated: ${tflitePath}`);
    }
  });

program
  .command('durian:deploy')
  .description('Deploy Durian model to mobile platforms')
  .option('-i, --id <id>', 'Model ID', 'durian_v1_tflite')
  .option('-p, --platform <platform>', 'Platform (android|ios|both)', 'both')
  .option('-q, --quantization <type>', 'Quantization (int8|float16|both)', 'both')
  .option('-o, --output <dir>', 'Output directory', 'durian_mobile_deployment')
  .option('--no-code', 'Skip code generation')
  .option('--no-docs', 'Skip documentation generation')
  .option('--compress', 'Compress assets')
  .action(async (options) => {
    const model = { 
      id: options.id, 
      crop: 'durian' as const, 
      task: 'disease-classification' as const, 
      version: '1.0.0', 
      input: { width: 224, height: 224, channels: 3 }, 
      labels: ['anthracnose', 'phytophthora_foot_rot', 'leaf_spot', 'healthy'], 
      threshold_default: 0.75, 
      runtime: 'tflite' as const, 
      path: '' 
    };
    
    const deploymentOptions = {
      platform: options.platform,
      quantization: options.quantization,
      outputDir: options.output,
      includeDocumentation: !options.noDocs,
      generateCode: !options.noCode,
      compressAssets: options.compress
    };
    
    console.log('Deploying Durian mobile model...');
    const result = await mobileDeploymentManager.deployModel(model, deploymentOptions);
    
    if (result.success) {
      console.log('✅ Durian mobile deployment completed successfully!');
      console.log(`📁 Output directory: ${result.outputDir}`);
      console.log(`📦 Assets: ${result.assets.length} files`);
      console.log(`💻 Generated code: ${result.generatedCode.length} files`);
      console.log(`📚 Documentation: ${result.documentation.length} files`);
    } else {
      console.error('❌ Durian mobile deployment failed!');
      result.errors.forEach(error => console.error(`  - ${error}`));
    }
  });

program
  .command('durian:test')
  .description('Run Durian mobile tests')
  .option('-i, --id <id>', 'Model ID', 'durian_v1_tflite')
  .option('-p, --platform <platform>', 'Platform (android|ios|both)', 'both')
  .option('-o, --output <dir>', 'Output directory', 'durian_test_results')
  .action(async (options) => {
    const testConfig = mobileTestingFramework.createTestConfig(
      options.id,
      options.platform
    );
    
    console.log('Running Durian mobile tests...');
    const testSuite = await mobileTestingFramework.runTests(testConfig);
    
    console.log('📊 Durian Test Results:');
    console.log(`  Overall: ${testSuite.summary.overallPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Passed: ${testSuite.summary.passedTests}/${testSuite.summary.totalTests}`);
    console.log(`  Avg Inference Time: ${testSuite.summary.averageInferenceTime.toFixed(1)}ms`);
    console.log(`  Avg Accuracy: ${(testSuite.summary.averageAccuracy * 100).toFixed(1)}%`);
    
    // Generate test report
    const report = mobileTestingFramework.generateTestReport(testSuite);
    const reportPath = `${options.output}/durian_test_report.md`;
    require('fs').writeFileSync(reportPath, report);
    console.log(`📋 Durian test report saved: ${reportPath}`);
  });

program
  .command('cleanup')
  .description('Clean up old data')
  .option('-d, --days <days>', 'Days to keep')
  .action((options) => {
    const days = parseInt(options.days) || 30;
    const result = modelPerformanceMonitor.cleanup(days);
    console.log(`Cleanup completed: ${result.metricsRemoved} metrics, ${result.alertsRemoved} alerts removed`);
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
