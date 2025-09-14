import { ModelMeta } from "../lib/ml-pipeline";
import path from "path";

export const MODEL_DIR = path.join(process.cwd(), "models"); // put .onnx/.tflite here

// MVP: two classifiers
export const MODELS: ModelMeta[] = [
  {
    id: "rice_v1",
    crop: "rice",
    task: "disease-classification",
    version: "1.0.0",
    input: { width: 224, height: 224, channels: 3 },
    labels: [
      "rice_brown_spot",
      "rice_blast",
      "bacterial_leaf_blight",
      "healthy"
    ],
    threshold_default: 0.75,
    runtime: "onnx", // set "tflite" if you prefer, but server example uses onnxruntime
    path: path.join(MODEL_DIR, "rice_v1.onnx"),
  },
  {
    id: "rice_v1_tflite",
    crop: "rice",
    task: "disease-classification",
    version: "1.0.0",
    input: { width: 224, height: 224, channels: 3 },
    labels: [
      "rice_brown_spot",
      "rice_blast",
      "bacterial_leaf_blight",
      "healthy"
    ],
    threshold_default: 0.75,
    runtime: "tflite",
    path: path.join(MODEL_DIR, "rice_v1_tflite_int8.tflite"),
  },
  {
    id: "durian_v1",
    crop: "durian",
    task: "disease-classification",
    version: "1.0.0",
    input: { width: 224, height: 224, channels: 3 },
    labels: [
      "anthracnose",
      "phytophthora_foot_rot",
      "leaf_spot",
      "healthy"
    ],
    threshold_default: 0.75,
    runtime: "onnx",
    path: path.join(MODEL_DIR, "durian_v1.onnx"),
  },
  {
    id: "durian_v1_tflite",
    crop: "durian",
    task: "disease-classification",
    version: "1.0.0",
    input: { width: 224, height: 224, channels: 3 },
    labels: [
      "anthracnose",
      "phytophthora_foot_rot",
      "leaf_spot",
      "healthy"
    ],
    threshold_default: 0.75,
    runtime: "tflite",
    path: path.join(MODEL_DIR, "durian_v1_tflite_int8.tflite"),
  }
];

export function latestForCrop(crop: "rice" | "durian"): ModelMeta {
  // simple: last one matching crop
  const list = MODELS.filter(m => m.crop === crop);
  if (!list.length) throw new Error(`No model for crop=${crop}`);
  return list[list.length - 1];
}

export function getModel(id?: string, crop?: "rice" | "durian"): ModelMeta {
  if (id) {
    const m = MODELS.find(mm => mm.id === id);
    if (!m) throw new Error(`Unknown model_id=${id}`);
    return m;
  }
  if (crop) return latestForCrop(crop);
  throw new Error("model_id or crop required");
}
