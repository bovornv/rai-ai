import { Router } from "express";
import { getOutbreaks, getOutbreakRadar, reportOutbreak, OutbreakReportInput } from "../lib/outbreak-service";
import { makeOutbreakRepo } from "../db/outbreakRepo";

// Mock database - replace with actual SQLite instance
const mockDb = {
  run: async (sql: string, ...params: any[]) => {
    console.log('DB RUN:', sql, params);
  },
  get: async <T>(sql: string, ...params: any[]) => {
    console.log('DB GET:', sql, params);
    return undefined as T | undefined;
  },
  all: async <T>(sql: string, ...params: any[]) => {
    console.log('DB ALL:', sql, params);
    return [] as T[];
  }
};

const repo = makeOutbreakRepo(mockDb);
export const outbreaksRouter = Router();

/** GET /api/outbreaks?geohash5=..&crop=rice&since_hours=72 */
outbreaksRouter.get("/", async (req, res) => {
  try {
    const { geohash5, crop, since_hours } = req.query as any;
    if (!geohash5 || !crop) return res.status(400).json({ error: "geohash5 & crop required" });
    const data = await getOutbreaks(repo, {
      geohash5,
      crop,
      since_hours: since_hours ? Number(since_hours) : undefined,
    });
    // k-anonymity guard: if below K, up-bucket or redact counts
    if (data.total_reports < 3) {
      data.top_labels = [];
      data.trend = [];
    }
    return res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/outbreaks/radar?geohashes=a,b,c&crop=rice&since_hours=72 */
outbreaksRouter.get("/radar", async (req, res) => {
  try {
    const { geohashes, crop, since_hours } = req.query as any;
    const list = typeof geohashes === "string" ? geohashes.split(",") : [];
    if (!list.length || !crop) return res.status(400).json({ error: "geohashes & crop required" });
    const data = await getOutbreakRadar(repo, {
      geohashes: list,
      crop,
      since_hours: since_hours ? Number(since_hours) : undefined,
    });
    // Optionally, coarsen cells with <K
    data.buckets = data.buckets.map(b => (b.count < 3 ? { ...b, severity: "stable" } : b));
    return res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/outbreaks/report */
outbreaksRouter.post("/report", async (req, res) => {
  try {
    const body = req.body as OutbreakReportInput;
    // Simple rate-limit by device_id (implement properly with Redis in prod)
    if (!body.device_id && body.source !== "partner") {
      return res.status(400).json({ error: "device_id required for non-partner" });
    }
    const result = await reportOutbreak(repo, body);
    return res.status(201).json({ id: result.id, status: result.status });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
