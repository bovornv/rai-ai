// src/lib/ml-pipeline.ts
// Public DTOs + domain logic thin layer (no Express in this file)

export type Crop = "rice" | "durian";

export type ModelMeta = {
  id: string;                 // e.g., "rice_v1"
  crop: Crop;
  task: "disease-classification";
  version: string;            // semantic version
  input: { width: number; height: number; channels: 3 };
  labels: string[];           // class names
  threshold_default: number;  // recommended min confidence (0..1)
  runtime: "tflite" | "onnx" | "tfjs";
  path: string;               // server file path or CDN URL
};

export type ModelsResponse = {
  models: ModelMeta[];
  updated_at: string;
};

export type ClassifyRequest = {
  // Either provide a multipart file upload (preferred) OR a base64 payload.
  // If base64 route used:
  image_base64?: string;  // data URL or raw base64
  crop: Crop;
  model_id?: string;      // optional explicit model; otherwise latest for crop
  // Optional knobs:
  min_confidence?: number;   // override threshold
  return_topk?: number;      // default 1
};

export type ClassifyTop = {
  label: string;
  confidence: number;        // 0..1
};

export type ClassifyResponse = {
  crop: Crop;
  model_id: string;
  model_version: string;
  topk: ClassifyTop[];       // sorted desc
  chosen: ClassifyTop;       // top-1
  uncertain: boolean;        // chosen.confidence < min_confidence
  timing_ms: { load: number; infer: number; total: number };
  device?: { id?: string };  // optional passthrough
};

export type WarmupRequest = {
  model_ids?: string[];      // warm specific; default = all
  batch?: number;            // number of dummy runs, default 1
};

export type WarmupResponse = {
  warmed: { model_id: string; ok: boolean; timing_ms: number }[];
  updated_at: string;
};