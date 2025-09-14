// Model Versioning and Metadata Management
import { ModelMeta } from "../lib/ml-pipeline";
import fs from "fs";
import path from "path";

export interface ModelVersion {
  id: string;
  version: string;
  crop: "rice" | "durian";
  created_at: string;
  deployed_at?: string;
  status: "training" | "staging" | "production" | "deprecated";
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    confusion_matrix: number[][];
  };
  artifacts: {
    onnx_path: string;
    labels_path: string;
    meta_path: string;
    config_path: string;
    metrics_path: string;
  };
  metadata: {
    architecture: string;
    input_size: number;
    training_epochs: number;
    dataset_size: number;
    training_time_hours: number;
    created_by: string;
    description?: string;
  };
}

export interface ModelRegistry {
  models: ModelVersion[];
  current_production: { [crop: string]: string }; // crop -> model_id
  last_updated: string;
}

export class ModelVersionManager {
  private registryPath: string;
  private modelsDir: string;
  private registry: ModelRegistry;

  constructor(registryPath = "models/registry.json", modelsDir = "models") {
    this.registryPath = registryPath;
    this.modelsDir = modelsDir;
    this.registry = this.loadRegistry();
  }

  private loadRegistry(): ModelRegistry {
    try {
      if (fs.existsSync(this.registryPath)) {
        const data = fs.readFileSync(this.registryPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn("Failed to load model registry, creating new one:", error);
    }

    return {
      models: [],
      current_production: {},
      last_updated: new Date().toISOString()
    };
  }

  private saveRegistry(): void {
    this.registry.last_updated = new Date().toISOString();
    fs.writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2));
  }

  // Register a new model version
  registerModel(version: Omit<ModelVersion, "created_at" | "status">): ModelVersion {
    const modelVersion: ModelVersion = {
      ...version,
      created_at: new Date().toISOString(),
      status: "staging"
    };

    // Check if model ID already exists
    const existingIndex = this.registry.models.findIndex(m => m.id === version.id);
    if (existingIndex >= 0) {
      this.registry.models[existingIndex] = modelVersion;
    } else {
      this.registry.models.push(modelVersion);
    }

    this.saveRegistry();
    return modelVersion;
  }

  // Get model by ID and version
  getModel(id: string, version?: string): ModelVersion | null {
    if (version) {
      return this.registry.models.find(m => m.id === id && m.version === version) || null;
    }
    
    // Return latest version
    const models = this.registry.models.filter(m => m.id === id);
    if (models.length === 0) return null;
    
    return models.sort((a, b) => b.version.localeCompare(a.version))[0];
  }

  // Get all versions of a model
  getModelVersions(id: string): ModelVersion[] {
    return this.registry.models
      .filter(m => m.id === id)
      .sort((a, b) => b.version.localeCompare(a.version));
  }

  // Promote model to production
  promoteToProduction(id: string, version: string): boolean {
    const model = this.getModel(id, version);
    if (!model) {
      console.error(`Model ${id} version ${version} not found`);
      return false;
    }

    // Validate model artifacts exist
    if (!this.validateModelArtifacts(model)) {
      console.error(`Model artifacts validation failed for ${id} version ${version}`);
      return false;
    }

    // Update model status
    model.status = "production";
    model.deployed_at = new Date().toISOString();

    // Update current production mapping
    this.registry.current_production[model.crop] = `${id}:${version}`;

    this.saveRegistry();
    console.log(`Model ${id} version ${version} promoted to production`);
    return true;
  }

  // Deprecate a model version
  deprecateModel(id: string, version: string): boolean {
    const model = this.getModel(id, version);
    if (!model) {
      console.error(`Model ${id} version ${version} not found`);
      return false;
    }

    model.status = "deprecated";
    this.saveRegistry();
    console.log(`Model ${id} version ${version} deprecated`);
    return true;
  }

  // Get current production model for crop
  getCurrentProduction(crop: "rice" | "durian"): ModelVersion | null {
    const productionId = this.registry.current_production[crop];
    if (!productionId) return null;

    const [id, version] = productionId.split(":");
    return this.getModel(id, version);
  }

  // Validate model artifacts exist
  private validateModelArtifacts(model: ModelVersion): boolean {
    const requiredFiles = [
      model.artifacts.onnx_path,
      model.artifacts.labels_path,
      model.artifacts.meta_path
    ];

    return requiredFiles.every(filePath => fs.existsSync(filePath));
  }

  // Generate model comparison report
  compareModels(id: string): string {
    const versions = this.getModelVersions(id);
    if (versions.length < 2) {
      return `Only ${versions.length} version(s) found for model ${id}`;
    }

    const sortedVersions = versions.sort((a, b) => b.version.localeCompare(a.version));
    const latest = sortedVersions[0];
    const previous = sortedVersions[1];

    return `
# Model Comparison: ${id}

## Latest Version (${latest.version})
- Accuracy: ${(latest.performance.accuracy * 100).toFixed(2)}%
- Precision: ${(latest.performance.precision * 100).toFixed(2)}%
- Recall: ${(latest.performance.recall * 100).toFixed(2)}%
- F1 Score: ${(latest.performance.f1_score * 100).toFixed(2)}%
- Status: ${latest.status}
- Created: ${latest.created_at}

## Previous Version (${previous.version})
- Accuracy: ${(previous.performance.accuracy * 100).toFixed(2)}%
- Precision: ${(previous.performance.precision * 100).toFixed(2)}%
- Recall: ${(previous.performance.recall * 100).toFixed(2)}%
- F1 Score: ${(previous.performance.f1_score * 100).toFixed(2)}%
- Status: ${previous.status}
- Created: ${previous.created_at}

## Improvement
- Accuracy: ${((latest.performance.accuracy - previous.performance.accuracy) * 100).toFixed(2)}%
- Precision: ${((latest.performance.precision - previous.performance.precision) * 100).toFixed(2)}%
- Recall: ${((latest.performance.recall - previous.performance.recall) * 100).toFixed(2)}%
- F1 Score: ${((latest.performance.f1_score - previous.performance.f1_score) * 100).toFixed(2)}%
`;
  }

  // Get model registry as ModelMeta[] for ML pipeline
  getModelRegistry(): ModelMeta[] {
    return this.registry.models
      .filter(m => m.status === "production")
      .map(model => ({
        id: model.id,
        crop: model.crop,
        task: "disease-classification" as const,
        version: model.version,
        input: {
          width: model.metadata.input_size,
          height: model.metadata.input_size,
          channels: 3
        },
        labels: this.loadLabels(model.artifacts.labels_path),
        threshold_default: 0.75,
        runtime: "onnx" as const,
        path: model.artifacts.onnx_path
      }));
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

  // Clean up deprecated models
  cleanupDeprecatedModels(): number {
    const deprecated = this.registry.models.filter(m => m.status === "deprecated");
    let cleaned = 0;

    for (const model of deprecated) {
      try {
        // Remove model files
        const files = [
          model.artifacts.onnx_path,
          model.artifacts.labels_path,
          model.artifacts.meta_path,
          model.artifacts.config_path,
          model.artifacts.metrics_path
        ];

        files.forEach(filePath => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        });

        // Remove from registry
        this.registry.models = this.registry.models.filter(m => 
          !(m.id === model.id && m.version === model.version)
        );
      } catch (error) {
        console.warn(`Failed to clean up model ${model.id} version ${model.version}:`, error);
      }
    }

    this.saveRegistry();
    return cleaned;
  }

  // Get registry statistics
  getRegistryStats(): {
    total_models: number;
    production_models: number;
    staging_models: number;
    deprecated_models: number;
    crops: { [crop: string]: number };
  } {
    const stats = {
      total_models: this.registry.models.length,
      production_models: 0,
      staging_models: 0,
      deprecated_models: 0,
      crops: {} as { [crop: string]: number }
    };

    this.registry.models.forEach(model => {
      stats[`${model.status}_models`]++;
      stats.crops[model.crop] = (stats.crops[model.crop] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const modelVersionManager = new ModelVersionManager();
