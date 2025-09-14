import { ClassifyTop, ModelMeta } from "../lib/ml-pipeline";

// Mock implementation for testing without actual model files
export async function loadSession(model: ModelMeta): Promise<any> {
  console.log(`Mock: Loading session for ${model.id}`);
  return { id: model.id, loaded: true };
}

export async function warmup(model: ModelMeta, batch = 1): Promise<number> {
  console.log(`Mock: Warming up ${model.id} with batch ${batch}`);
  // Simulate warmup time
  await new Promise(resolve => setTimeout(resolve, 100));
  return 100;
}

export async function classifyBuffer(model: ModelMeta, buf: Buffer, returnTopk = 1): Promise<ClassifyTop[]> {
  console.log(`Mock: Classifying with ${model.id}, buffer size: ${buf.length}`);
  
  // Simulate inference time
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Generate mock results based on model
  const mockResults: ClassifyTop[] = [];
  
  if (model.crop === 'rice') {
    mockResults.push(
      { label: 'healthy', confidence: 0.85 },
      { label: 'rice_brown_spot', confidence: 0.10 },
      { label: 'rice_blast', confidence: 0.03 },
      { label: 'bacterial_leaf_blight', confidence: 0.02 }
    );
  } else if (model.crop === 'durian') {
    mockResults.push(
      { label: 'healthy', confidence: 0.80 },
      { label: 'anthracnose', confidence: 0.15 },
      { label: 'leaf_spot', confidence: 0.03 },
      { label: 'phytophthora_foot_rot', confidence: 0.02 }
    );
  }
  
  // Sort by confidence and return top-k
  mockResults.sort((a, b) => b.confidence - a.confidence);
  const result = mockResults.slice(0, returnTopk);
  
  // Add timing info
  (result as any).__timing_ms = { infer: 200 };
  
  return result;
}
