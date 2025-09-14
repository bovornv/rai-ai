import fs from "fs";
import sharp from "sharp";
import * as ort from "onnxruntime-node"; // npm i onnxruntime-node
import { ClassifyTop, ModelMeta } from "../lib/ml-pipeline";
import * as mockInfer from "./infer-mock";
import { tfliteInferenceEngine } from "./tflite-infer";

// naive in-memory session cache
const SESSIONS = new Map<string, ort.InferenceSession>();

export async function loadSession(model: ModelMeta): Promise<ort.InferenceSession> {
  if (SESSIONS.has(model.id)) return SESSIONS.get(model.id)!;
  if (!fs.existsSync(model.path)) {
    console.warn(`Model file missing: ${model.path}, using mock implementation`);
    return mockInfer.loadSession(model) as any;
  }
  const session = await ort.InferenceSession.create(model.path, { executionProviders: ["cpu"] });
  SESSIONS.set(model.id, session);
  return session;
}

export async function warmup(model: ModelMeta, batch = 1): Promise<number> {
  if (!fs.existsSync(model.path)) {
    console.warn(`Model file missing: ${model.path}, using mock warmup`);
    return mockInfer.warmup(model, batch);
  }
  
  const t0 = Date.now();
  const session = await loadSession(model);
  const dummy = new Float32Array(model.input.width * model.input.height * model.input.channels);
  for (let i = 0; i < batch; i++) {
    const inputName = session.inputNames[0];
    const tensor = new ort.Tensor("float32", dummy, [1, model.input.channels, model.input.height, model.input.width]);
    await session.run({ [inputName]: tensor });
  }
  return Date.now() - t0;
}

export async function classifyBuffer(model: ModelMeta, buf: Buffer, returnTopk = 1): Promise<ClassifyTop[]> {
  if (!fs.existsSync(model.path)) {
    console.warn(`Model file missing: ${model.path}, using mock classification`);
    return mockInfer.classifyBuffer(model, buf, returnTopk);
  }

  // Check if this is a TFLite model
  if (model.runtime === "tflite") {
    console.log(`Using TFLite inference for ${model.id}`);
    return tfliteInferenceEngine.classifyImage(model, buf, returnTopk);
  }

  // ONNX inference
  const session = await loadSession(model);

  // 1) preprocess: resize, to RGB, normalize to 0..1 and NCHW
  const { width, height, channels } = model.input;
  const img = sharp(buf).resize(width, height).ensureAlpha().removeAlpha().raw(); // RGB
  const raw = await img.toBuffer({ resolveWithObject: false });
  const float = new Float32Array(width * height * channels);
  for (let i = 0; i < raw.length; i++) float[i] = raw[i] / 255.0;

  // HWC -> CHW
  const chw = new Float32Array(width * height * channels);
  let idx = 0;
  for (let c = 0; c < channels; c++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        chw[idx++] = float[y * width * channels + x * channels + c];
      }
    }
  }

  const inputName = session.inputNames[0];
  const tensor = new ort.Tensor("float32", chw, [1, channels, height, width]);

  // 2) inference
  const t0 = Date.now();
  const out = await session.run({ [inputName]: tensor });
  const tInfer = Date.now() - t0;

  // 3) softmax + topk
  const output = out[session.outputNames[0]] as ort.Tensor;
  const logits = Array.from(output.data as Float32Array);
  const probs = softmax(logits);

  const tops = topk(probs, model.labels, returnTopk);
  (tops as any).__timing_ms = { infer: tInfer };
  return tops;
}

function softmax(arr: number[]): number[] {
  const m = Math.max(...arr);
  const exps = arr.map(v => Math.exp(v - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function topk(probs: number[], labels: string[], k = 1): { label: string; confidence: number }[] {
  const pairs = probs.map((p, i) => ({ label: labels[i] ?? `class_${i}`, confidence: p }));
  pairs.sort((a, b) => b.confidence - a.confidence);
  return pairs.slice(0, Math.max(1, k));
}
