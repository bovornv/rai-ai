import { Router } from "express";
import multer from "multer";
import { ClassifyRequest, ClassifyResponse, ModelsResponse, WarmupRequest, WarmupResponse } from "../lib/ml-pipeline";
import { MODELS, getModel, latestForCrop } from "../ml/model-registry";
import { classifyBuffer, warmup } from "../ml/infer";
import { decodeBase64Image } from "../util/base64";

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

export const mlRouter = Router();

/** GET /api/ml/models */
mlRouter.get("/models", async (_req, res) => {
  const resp: ModelsResponse = { models: MODELS, updated_at: new Date().toISOString() };
  res.json(resp);
});

/** POST /api/ml/warmup */
mlRouter.post("/warmup", async (req, res) => {
  try {
    const body = (req.body || {}) as WarmupRequest;
    const target = body.model_ids?.length ? MODELS.filter(m => body.model_ids!.includes(m.id)) : MODELS;
    const batch = Math.max(1, Math.min(3, body.batch ?? 1));

    const warmed = [];
    for (const m of target) {
      const t = await warmup(m, batch).catch(() => -1);
      warmed.push({ model_id: m.id, ok: t >= 0, timing_ms: Math.max(0, t) });
    }
    const resp: WarmupResponse = { warmed, updated_at: new Date().toISOString() };
    res.json(resp);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/** POST /api/ml/classify
 * Accepts either multipart "image" OR JSON { image_base64, crop, ... }.
 */
mlRouter.post("/classify", upload.single("image"), async (req, res) => {
  const t0 = Date.now();
  try {
    const isMultipart = !!req.file;
    const body = (req.body || {}) as ClassifyRequest;

    // Image buffer
    let buf: Buffer | undefined;
    if (isMultipart) {
      buf = req.file!.buffer;
    } else if (body.image_base64) {
      buf = decodeBase64Image(body.image_base64);
    }
    if (!buf || !buf.length) return res.status(400).json({ error: "image required (multipart or base64)" });

    if (!body.crop) return res.status(400).json({ error: "crop required (rice|durian)" });

    const model = getModel(body.model_id, body.crop);
    const minConf = body.min_confidence ?? model.threshold_default;
    const topkN = Math.max(1, Math.min(5, body.return_topk ?? 1));

    const tLoadStart = Date.now();
    // ensure loaded once (will be near-zero after first call)
    await (await import("../ml/infer")).loadSession(model);
    const loadMs = Date.now() - tLoadStart;

    const tops = await classifyBuffer(model, buf, topkN);
    const chosen = tops[0];
    const resp: ClassifyResponse = {
      crop: body.crop,
      model_id: model.id,
      model_version: model.version,
      topk: tops,
      chosen,
      uncertain: chosen.confidence < minConf,
      timing_ms: { load: loadMs, infer: (tops as any).__timing_ms?.infer ?? 0, total: Date.now() - t0 },
    };

    res.json(resp);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
