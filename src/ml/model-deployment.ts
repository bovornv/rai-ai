// Model Deployment and Integration Helpers
import { ModelMeta } from "../lib/ml-pipeline";
import { ModelVersion, modelVersionManager } from "./model-versioning";
import { riceModelManager } from "./rice-framework";
import fs from "fs";
import path from "path";

export interface DeploymentConfig {
  environment: "development" | "staging" | "production";
  model_id: string;
  version: string;
  crop: "rice" | "durian";
  auto_scaling: boolean;
  max_instances: number;
  min_instances: number;
  health_check_interval: number;
  performance_threshold: number;
}

export interface DeploymentStatus {
  model_id: string;
  version: string;
  status: "deploying" | "deployed" | "failed" | "stopped";
  deployed_at: string;
  health_status: "healthy" | "unhealthy" | "unknown";
  performance_metrics: {
    avg_inference_time: number;
    success_rate: number;
    error_rate: number;
    requests_per_minute: number;
  };
  last_health_check: string;
}

export class ModelDeploymentManager {
  private deploymentsDir: string;
  private configsDir: string;
  private deployments: Map<string, DeploymentStatus> = new Map();

  constructor(deploymentsDir = "deployments", configsDir = "deployment_configs") {
    this.deploymentsDir = deploymentsDir;
    this.configsDir = configsDir;
    this.ensureDirectories();
    this.loadDeployments();
  }

  private ensureDirectories() {
    [this.deploymentsDir, this.configsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadDeployments() {
    try {
      const deploymentsFile = path.join(this.deploymentsDir, "deployments.json");
      if (fs.existsSync(deploymentsFile)) {
        const data = fs.readFileSync(deploymentsFile, 'utf8');
        const deployments = JSON.parse(data);
        this.deployments = new Map(Object.entries(deployments));
      }
    } catch (error) {
      console.warn("Failed to load deployments:", error);
    }
  }

  private saveDeployments() {
    const deploymentsFile = path.join(this.deploymentsDir, "deployments.json");
    const deploymentsObj = Object.fromEntries(this.deployments);
    fs.writeFileSync(deploymentsFile, JSON.stringify(deploymentsObj, null, 2));
  }

  // Deploy a model version
  async deployModel(config: DeploymentConfig): Promise<DeploymentStatus> {
    console.log(`Deploying model ${config.model_id} version ${config.version} to ${config.environment}`);

    // Validate model exists
    const model = modelVersionManager.getModel(config.model_id, config.version);
    if (!model) {
      throw new Error(`Model ${config.model_id} version ${config.version} not found`);
    }

    // Validate model artifacts
    if (!this.validateModelArtifacts(model)) {
      throw new Error(`Model artifacts validation failed for ${config.model_id} version ${config.version}`);
    }

    // Create deployment status
    const deploymentKey = `${config.model_id}:${config.version}:${config.environment}`;
    const deployment: DeploymentStatus = {
      model_id: config.model_id,
      version: config.version,
      status: "deploying",
      deployed_at: new Date().toISOString(),
      health_status: "unknown",
      performance_metrics: {
        avg_inference_time: 0,
        success_rate: 0,
        error_rate: 0,
        requests_per_minute: 0
      },
      last_health_check: new Date().toISOString()
    };

    this.deployments.set(deploymentKey, deployment);
    this.saveDeployments();

    try {
      // Simulate deployment process
      await this.performDeployment(model, config);
      
      // Update deployment status
      deployment.status = "deployed";
      deployment.health_status = "healthy";
      this.deployments.set(deploymentKey, deployment);
      this.saveDeployments();

      // Update model registry
      modelVersionManager.promoteToProduction(config.model_id, config.version);

      console.log(`Model ${config.model_id} version ${config.version} deployed successfully`);
      return deployment;

    } catch (error) {
      console.error(`Deployment failed for ${config.model_id} version ${config.version}:`, error);
      deployment.status = "failed";
      this.deployments.set(deploymentKey, deployment);
      this.saveDeployments();
      throw error;
    }
  }

  // Perform actual deployment (simulated)
  private async performDeployment(model: ModelVersion, config: DeploymentConfig): Promise<void> {
    // In a real implementation, this would:
    // 1. Copy model files to deployment directory
    // 2. Update model registry
    // 3. Restart inference services
    // 4. Run health checks
    // 5. Update load balancer configuration

    console.log(`Deploying model artifacts for ${model.id} version ${model.version}`);
    
    // Copy model files to deployment directory
    const deploymentPath = path.join(this.deploymentsDir, `${model.id}_${model.version}`);
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    // Copy ONNX model
    const onnxDest = path.join(deploymentPath, `${model.id}.onnx`);
    fs.copyFileSync(model.artifacts.onnx_path, onnxDest);

    // Copy labels
    const labelsDest = path.join(deploymentPath, "labels.json");
    fs.copyFileSync(model.artifacts.labels_path, labelsDest);

    // Copy metadata
    const metaDest = path.join(deploymentPath, "meta.json");
    fs.copyFileSync(model.artifacts.meta_path, metaDest);

    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`Model artifacts deployed to ${deploymentPath}`);
  }

  // Validate model artifacts
  private validateModelArtifacts(model: ModelVersion): boolean {
    const requiredFiles = [
      model.artifacts.onnx_path,
      model.artifacts.labels_path,
      model.artifacts.meta_path
    ];

    return requiredFiles.every(filePath => fs.existsSync(filePath));
  }

  // Get deployment status
  getDeploymentStatus(modelId: string, version: string, environment: string): DeploymentStatus | null {
    const deploymentKey = `${modelId}:${version}:${environment}`;
    return this.deployments.get(deploymentKey) || null;
  }

  // List all deployments
  getAllDeployments(): DeploymentStatus[] {
    return Array.from(this.deployments.values());
  }

  // Stop a deployment
  async stopDeployment(modelId: string, version: string, environment: string): Promise<boolean> {
    const deploymentKey = `${modelId}:${version}:${environment}`;
    const deployment = this.deployments.get(deploymentKey);
    
    if (!deployment) {
      console.warn(`Deployment not found: ${deploymentKey}`);
      return false;
    }

    deployment.status = "stopped";
    deployment.health_status = "unknown";
    this.deployments.set(deploymentKey, deployment);
    this.saveDeployments();

    console.log(`Deployment stopped: ${deploymentKey}`);
    return true;
  }

  // Health check for deployed models
  async performHealthCheck(modelId: string, version: string, environment: string): Promise<boolean> {
    const deploymentKey = `${modelId}:${version}:${environment}`;
    const deployment = this.deployments.get(deploymentKey);
    
    if (!deployment) {
      return false;
    }

    try {
      // Simulate health check
      const isHealthy = Math.random() > 0.1; // 90% success rate for demo
      
      deployment.health_status = isHealthy ? "healthy" : "unhealthy";
      deployment.last_health_check = new Date().toISOString();
      
      // Update performance metrics (simulated)
      deployment.performance_metrics = {
        avg_inference_time: 150 + Math.random() * 100,
        success_rate: isHealthy ? 0.95 + Math.random() * 0.05 : 0.5 + Math.random() * 0.3,
        error_rate: isHealthy ? Math.random() * 0.05 : 0.2 + Math.random() * 0.3,
        requests_per_minute: 10 + Math.random() * 50
      };

      this.deployments.set(deploymentKey, deployment);
      this.saveDeployments();

      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for ${deploymentKey}:`, error);
      deployment.health_status = "unhealthy";
      this.deployments.set(deploymentKey, deployment);
      this.saveDeployments();
      return false;
    }
  }

  // Generate deployment report
  generateDeploymentReport(): string {
    const deployments = this.getAllDeployments();
    const healthyDeployments = deployments.filter(d => d.health_status === "healthy");
    const unhealthyDeployments = deployments.filter(d => d.health_status === "unhealthy");

    return `
# Model Deployment Report

## Summary
- Total Deployments: ${deployments.length}
- Healthy: ${healthyDeployments.length}
- Unhealthy: ${unhealthyDeployments.length}
- Success Rate: ${deployments.length > 0 ? ((healthyDeployments.length / deployments.length) * 100).toFixed(1) : 0}%

## Deployments
${deployments.map(deployment => `
### ${deployment.model_id} v${deployment.version}
- Status: ${deployment.status}
- Health: ${deployment.health_status}
- Deployed: ${deployment.deployed_at}
- Last Check: ${deployment.last_health_check}
- Avg Inference Time: ${deployment.performance_metrics.avg_inference_time.toFixed(2)}ms
- Success Rate: ${(deployment.performance_metrics.success_rate * 100).toFixed(1)}%
- Requests/min: ${deployment.performance_metrics.requests_per_minute.toFixed(1)}
`).join('\n')}

## Recommendations
${unhealthyDeployments.length > 0 ? 
  `- ${unhealthyDeployments.length} deployment(s) are unhealthy. Consider investigating and restarting.` : 
  '- All deployments are healthy.'
}
${deployments.some(d => d.performance_metrics.avg_inference_time > 500) ?
  '- Some deployments have high inference times. Consider optimization.' : 
  '- Inference performance is good across all deployments.'
}
`;
  }

  // Create deployment configuration
  createDeploymentConfig(
    modelId: string, 
    version: string, 
    crop: "rice" | "durian",
    environment: "development" | "staging" | "production" = "production"
  ): DeploymentConfig {
    return {
      environment,
      model_id: modelId,
      version,
      crop,
      auto_scaling: environment === "production",
      max_instances: environment === "production" ? 10 : 3,
      min_instances: environment === "production" ? 2 : 1,
      health_check_interval: 300, // 5 minutes
      performance_threshold: 0.8
    };
  }

  // Save deployment configuration
  saveDeploymentConfig(config: DeploymentConfig): string {
    const configPath = path.join(
      this.configsDir, 
      `${config.model_id}_${config.version}_${config.environment}.json`
    );
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  // Load deployment configuration
  loadDeploymentConfig(configPath: string): DeploymentConfig {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  }

  // Update model registry with deployed models
  updateModelRegistry(): ModelMeta[] {
    const deployedModels = this.getAllDeployments()
      .filter(d => d.status === "deployed" && d.health_status === "healthy")
      .map(d => modelVersionManager.getModel(d.model_id, d.version))
      .filter((model): model is ModelVersion => model !== null);

    return deployedModels.map(model => ({
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
}

// Export singleton instance
export const modelDeploymentManager = new ModelDeploymentManager();
