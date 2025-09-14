# ML Models Directory

This directory contains the ONNX model files for disease classification.

## Required Models

- `rice_v1.onnx` - Rice disease classification model
- `durian_v1.onnx` - Durian disease classification model

## Model Specifications

### Rice Model (rice_v1.onnx)
- Input: 224x224x3 RGB image
- Output: 4 classes
  - rice_brown_spot
  - rice_blast
  - bacterial_leaf_blight
  - healthy
- Threshold: 0.75

### Durian Model (durian_v1.onnx)
- Input: 224x224x3 RGB image
- Output: 4 classes
  - phytophthora_foot_rot
  - anthracnose
  - leaf_spot
  - healthy
- Threshold: 0.75

## Note

For MVP testing, you can use placeholder ONNX files or mock the inference in the code.
The API will work with proper model files once they are available.
