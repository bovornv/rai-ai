// Training Configuration and Hyperparameter Management
import fs from "fs";
import path from "path";

export interface HyperparameterConfig {
  // Model architecture
  architecture: "efficientnet_b0" | "efficientnet_b1" | "resnet50" | "mobilenet_v2" | "densenet121";
  
  // Training parameters
  epochs: number;
  batch_size: number;
  learning_rate: number;
  weight_decay: number;
  momentum?: number;
  
  // Optimizer settings
  optimizer: "adam" | "adamw" | "sgd" | "rmsprop";
  scheduler: "cosine" | "step" | "exponential" | "plateau";
  warmup_epochs?: number;
  
  // Data augmentation
  augmentation: {
    horizontal_flip: boolean;
    vertical_flip: boolean;
    rotation: number;
    color_jitter: {
      brightness: number;
      contrast: number;
      saturation: number;
      hue: number;
    };
    random_crop: boolean;
    mixup: boolean;
    mixup_alpha: number;
    cutmix: boolean;
    cutmix_alpha: number;
  };
  
  // Regularization
  dropout: number;
  label_smoothing: number;
  early_stopping: {
    enabled: boolean;
    patience: number;
    min_delta: number;
  };
  
  // Validation
  validation_split: number;
  test_split: number;
  
  // Hardware
  num_workers: number;
  pin_memory: boolean;
  mixed_precision: boolean;
  
  // Logging
  log_interval: number;
  save_interval: number;
  tensorboard: boolean;
}

export interface DatasetConfig {
  data_root: string;
  crop: "rice" | "durian";
  classes: string[];
  min_samples_per_class: number;
  max_samples_per_class?: number;
  image_size: number;
  channels: number;
  normalization: {
    mean: number[];
    std: number[];
  };
}

export interface TrainingConfig {
  experiment_name: string;
  model_id: string;
  version: string;
  crop: "rice" | "durian";
  hyperparameters: HyperparameterConfig;
  dataset: DatasetConfig;
  output_dir: string;
  seed: number;
  resume_from_checkpoint?: string;
  pretrained: boolean;
  freeze_backbone: boolean;
  freeze_epochs: number;
}

export class TrainingConfigManager {
  private configsDir: string;
  private templatesDir: string;

  constructor(configsDir = "training_configs", templatesDir = "config_templates") {
    this.configsDir = configsDir;
    this.templatesDir = templatesDir;
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.configsDir, this.templatesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Create default hyperparameter configuration
  createDefaultHyperparameters(): HyperparameterConfig {
    return {
      architecture: "efficientnet_b0",
      epochs: 12,
      batch_size: 32,
      learning_rate: 3e-4,
      weight_decay: 1e-4,
      optimizer: "adamw",
      scheduler: "cosine",
      warmup_epochs: 2,
      augmentation: {
        horizontal_flip: true,
        vertical_flip: false,
        rotation: 10,
        color_jitter: {
          brightness: 0.2,
          contrast: 0.2,
          saturation: 0.2,
          hue: 0.1
        },
        random_crop: true,
        mixup: false,
        mixup_alpha: 0.2,
        cutmix: false,
        cutmix_alpha: 1.0
      },
      dropout: 0.2,
      label_smoothing: 0.1,
      early_stopping: {
        enabled: true,
        patience: 5,
        min_delta: 0.001
      },
      validation_split: 0.15,
      test_split: 0.15,
      num_workers: 4,
      pin_memory: true,
      mixed_precision: true,
      log_interval: 10,
      save_interval: 1,
      tensorboard: true
    };
  }

  // Create default dataset configuration
  createDefaultDatasetConfig(crop: "rice" | "durian"): DatasetConfig {
    const riceClasses = [
      "rice_brown_spot",
      "rice_blast",
      "bacterial_leaf_blight",
      "healthy"
    ];

    const durianClasses = [
      "phytophthora_foot_rot",
      "anthracnose",
      "leaf_spot",
      "healthy"
    ];

    return {
      data_root: `./data/${crop}_dataset`,
      crop,
      classes: crop === "rice" ? riceClasses : durianClasses,
      min_samples_per_class: 100,
      max_samples_per_class: 1000,
      image_size: 224,
      channels: 3,
      normalization: {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225]
      }
    };
  }

  // Create training configuration
  createTrainingConfig(
    experimentName: string,
    modelId: string,
    version: string,
    crop: "rice" | "durian",
    customHyperparams?: Partial<HyperparameterConfig>,
    customDataset?: Partial<DatasetConfig>
  ): TrainingConfig {
    const hyperparameters = {
      ...this.createDefaultHyperparameters(),
      ...customHyperparams
    };

    const dataset = {
      ...this.createDefaultDatasetConfig(crop),
      ...customDataset
    };

    return {
      experiment_name: experimentName,
      model_id: modelId,
      version,
      crop,
      hyperparameters,
      dataset,
      output_dir: `./experiments/${experimentName}`,
      seed: 42,
      pretrained: true,
      freeze_backbone: false,
      freeze_epochs: 0
    };
  }

  // Save training configuration
  saveTrainingConfig(config: TrainingConfig): string {
    const configPath = path.join(
      this.configsDir,
      `${config.experiment_name}_${config.model_id}_${config.version}.json`
    );
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  // Load training configuration
  loadTrainingConfig(configPath: string): TrainingConfig {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  }

  // Create configuration template
  createTemplate(templateName: string, config: TrainingConfig): string {
    const templatePath = path.join(this.templatesDir, `${templateName}.json`);
    fs.writeFileSync(templatePath, JSON.stringify(config, null, 2));
    return templatePath;
  }

  // Load configuration template
  loadTemplate(templateName: string): TrainingConfig {
    const templatePath = path.join(this.templatesDir, `${templateName}.json`);
    return this.loadTrainingConfig(templatePath);
  }

  // Generate PyTorch training script from configuration
  generateTrainingScript(config: TrainingConfig): string {
    return `#!/usr/bin/env python3
"""
Auto-generated training script for ${config.experiment_name}
Model: ${config.model_id} v${config.version}
Crop: ${config.crop}
"""

import os
import json
import time
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import transforms, datasets
import timm
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
from rich.console import Console

console = Console()

# Configuration
CONFIG = ${JSON.stringify(config, null, 2)}

# Set random seeds
random.seed(CONFIG['seed'])
np.random.seed(CONFIG['seed'])
torch.manual_seed(CONFIG['seed'])

# Device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
console.log(f"Using device: {device}")

# Data transforms
train_transform = transforms.Compose([
    transforms.Resize((CONFIG['dataset']['image_size'], CONFIG['dataset']['image_size'])),
    transforms.RandomHorizontalFlip(p=0.5 if CONFIG['hyperparameters']['augmentation']['horizontal_flip'] else 0),
    transforms.RandomVerticalFlip(p=0.5 if CONFIG['hyperparameters']['augmentation']['vertical_flip'] else 0),
    transforms.RandomRotation(CONFIG['hyperparameters']['augmentation']['rotation']),
    transforms.ColorJitter(
        brightness=CONFIG['hyperparameters']['augmentation']['color_jitter']['brightness'],
        contrast=CONFIG['hyperparameters']['augmentation']['color_jitter']['contrast'],
        saturation=CONFIG['hyperparameters']['augmentation']['color_jitter']['saturation'],
        hue=CONFIG['hyperparameters']['augmentation']['color_jitter']['hue']
    ),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=CONFIG['dataset']['normalization']['mean'],
        std=CONFIG['dataset']['normalization']['std']
    )
])

val_transform = transforms.Compose([
    transforms.Resize((CONFIG['dataset']['image_size'], CONFIG['dataset']['image_size'])),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=CONFIG['dataset']['normalization']['mean'],
        std=CONFIG['dataset']['normalization']['std']
    )
])

# Load datasets
train_dataset = datasets.ImageFolder(
    os.path.join(CONFIG['dataset']['data_root'], 'train'),
    transform=train_transform
)
val_dataset = datasets.ImageFolder(
    os.path.join(CONFIG['dataset']['data_root'], 'val'),
    transform=val_transform
)
test_dataset = datasets.ImageFolder(
    os.path.join(CONFIG['dataset']['data_root'], 'test'),
    transform=val_transform
)

# Data loaders
train_loader = DataLoader(
    train_dataset,
    batch_size=CONFIG['hyperparameters']['batch_size'],
    shuffle=True,
    num_workers=CONFIG['hyperparameters']['num_workers'],
    pin_memory=CONFIG['hyperparameters']['pin_memory']
)

val_loader = DataLoader(
    val_dataset,
    batch_size=CONFIG['hyperparameters']['batch_size'],
    shuffle=False,
    num_workers=CONFIG['hyperparameters']['num_workers'],
    pin_memory=CONFIG['hyperparameters']['pin_memory']
)

test_loader = DataLoader(
    test_dataset,
    batch_size=CONFIG['hyperparameters']['batch_size'],
    shuffle=False,
    num_workers=CONFIG['hyperparameters']['num_workers'],
    pin_memory=CONFIG['hyperparameters']['pin_memory']
)

# Model
num_classes = len(CONFIG['dataset']['classes'])
model = timm.create_model(
    CONFIG['hyperparameters']['architecture'],
    pretrained=CONFIG['pretrained'],
    num_classes=num_classes,
    drop_rate=CONFIG['hyperparameters']['dropout']
)
model = model.to(device)

# Loss function
criterion = nn.CrossEntropyLoss(label_smoothing=CONFIG['hyperparameters']['label_smoothing'])

# Optimizer
if CONFIG['hyperparameters']['optimizer'] == 'adam':
    optimizer = optim.Adam(
        model.parameters(),
        lr=CONFIG['hyperparameters']['learning_rate'],
        weight_decay=CONFIG['hyperparameters']['weight_decay']
    )
elif CONFIG['hyperparameters']['optimizer'] == 'adamw':
    optimizer = optim.AdamW(
        model.parameters(),
        lr=CONFIG['hyperparameters']['learning_rate'],
        weight_decay=CONFIG['hyperparameters']['weight_decay']
    )
elif CONFIG['hyperparameters']['optimizer'] == 'sgd':
    optimizer = optim.SGD(
        model.parameters(),
        lr=CONFIG['hyperparameters']['learning_rate'],
        weight_decay=CONFIG['hyperparameters']['weight_decay'],
        momentum=CONFIG['hyperparameters'].get('momentum', 0.9)
    )

# Scheduler
if CONFIG['hyperparameters']['scheduler'] == 'cosine':
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=CONFIG['hyperparameters']['epochs']
    )
elif CONFIG['hyperparameters']['scheduler'] == 'step':
    scheduler = optim.lr_scheduler.StepLR(
        optimizer,
        step_size=CONFIG['hyperparameters']['epochs'] // 3,
        gamma=0.1
    )

# Training function
def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    
    for batch_idx, (data, target) in enumerate(loader):
        data, target = data.to(device), target.to(device)
        
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        pred = output.argmax(dim=1)
        correct += pred.eq(target).sum().item()
        total += target.size(0)
        
        if batch_idx % CONFIG['hyperparameters']['log_interval'] == 0:
            console.log(f'Batch {batch_idx}/{len(loader)}, Loss: {loss.item():.4f}')
    
    return total_loss / len(loader), correct / total

# Validation function
def validate_epoch(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for data, target in loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            loss = criterion(output, target)
            
            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)
    
    return total_loss / len(loader), correct / total

# Training loop
best_val_acc = 0
patience_counter = 0

for epoch in range(1, CONFIG['hyperparameters']['epochs'] + 1):
    console.log(f"Epoch {epoch}/{CONFIG['hyperparameters']['epochs']}")
    
    # Train
    train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
    
    # Validate
    val_loss, val_acc = validate_epoch(model, val_loader, criterion, device)
    
    # Update scheduler
    scheduler.step()
    
    console.log(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}")
    console.log(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")
    
    # Save best model
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        patience_counter = 0
        
        # Save checkpoint
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_acc': val_acc,
            'config': CONFIG
        }
        
        os.makedirs(CONFIG['output_dir'], exist_ok=True)
        torch.save(checkpoint, os.path.join(CONFIG['output_dir'], 'best_model.pth'))
        console.log(f"Saved best model with validation accuracy: {val_acc:.4f}")
    else:
        patience_counter += 1
    
    # Early stopping
    if CONFIG['hyperparameters']['early_stopping']['enabled'] and patience_counter >= CONFIG['hyperparameters']['early_stopping']['patience']:
        console.log(f"Early stopping triggered after {epoch} epochs")
        break

# Test evaluation
console.log("Evaluating on test set...")
test_loss, test_acc = validate_epoch(model, test_loader, criterion, device)
console.log(f"Test Loss: {test_loss:.4f}, Test Acc: {test_acc:.4f}")

# Generate predictions for detailed metrics
model.eval()
all_preds = []
all_targets = []

with torch.no_grad():
    for data, target in test_loader:
        data, target = data.to(device), target.to(device)
        output = model(data)
        pred = output.argmax(dim=1)
        all_preds.extend(pred.cpu().numpy())
        all_targets.extend(target.cpu().numpy())

# Classification report
print("\\nClassification Report:")
print(classification_report(all_targets, all_preds, target_names=CONFIG['dataset']['classes']))

print("\\nConfusion Matrix:")
print(confusion_matrix(all_targets, all_preds))

console.log("Training completed!")
`;
  }

  // Generate hyperparameter search configuration
  generateHyperparameterSearchConfig(
    baseConfig: TrainingConfig,
    searchSpace: { [K in keyof HyperparameterConfig]?: any[] }
  ): TrainingConfig[] {
    const configs: TrainingConfig[] = [];
    
    // Generate all combinations of hyperparameters
    const keys = Object.keys(searchSpace) as (keyof HyperparameterConfig)[];
    const values = keys.map(key => searchSpace[key] || [baseConfig.hyperparameters[key]]);
    
    // Cartesian product
    const combinations = this.cartesianProduct(values);
    
    combinations.forEach((combination, index) => {
      const newConfig = { ...baseConfig };
      newConfig.experiment_name = `${baseConfig.experiment_name}_search_${index}`;
      
      keys.forEach((key, i) => {
        (newConfig.hyperparameters as any)[key] = combination[i];
      });
      
      configs.push(newConfig);
    });
    
    return configs;
  }

  // Generate cartesian product of arrays
  private cartesianProduct(arrays: any[][]): any[][] {
    return arrays.reduce((acc, curr) => {
      const result: any[][] = [];
      acc.forEach(a => {
        curr.forEach(c => {
          result.push([...a, c]);
        });
      });
      return result;
    }, [[]]);
  }

  // Validate training configuration
  validateTrainingConfig(config: TrainingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!config.experiment_name) errors.push("experiment_name is required");
    if (!config.model_id) errors.push("model_id is required");
    if (!config.version) errors.push("version is required");
    if (!config.crop) errors.push("crop is required");
    
    // Check hyperparameters
    if (config.hyperparameters.epochs <= 0) errors.push("epochs must be positive");
    if (config.hyperparameters.batch_size <= 0) errors.push("batch_size must be positive");
    if (config.hyperparameters.learning_rate <= 0) errors.push("learning_rate must be positive");
    
    // Check dataset
    if (!config.dataset.data_root) errors.push("dataset.data_root is required");
    if (!config.dataset.classes || config.dataset.classes.length === 0) {
      errors.push("dataset.classes must have at least one class");
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const trainingConfigManager = new TrainingConfigManager();
