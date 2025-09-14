// Outbreak Service – domain layer
export type Crop = "rice" | "durian";
export type Source = "scan" | "manual" | "partner";

export type OutbreakReportInput = {
  source: Source;
  crop: Crop;
  label: string;
  confidence?: number;
  geohash5: string;
  observed_at: string;
  evidence?: { photo_hash?: string; ticket_id?: string };
  contact?: { co_op_id?: string; shop_id?: string };
  device_id?: string;
  field_id?: string;
};

export type OutbreakTrendPoint = { date: string; count: number };
export type OutbreakTopLabel = { label: string; count: number };
export type OutbreakResponse = {
  geohash5: string;
  crop: Crop;
  window_hours: number;
  total_reports: number;
  unique_fields?: number | null;
  top_labels: OutbreakTopLabel[];
  trend: OutbreakTrendPoint[];
  confidence: { k_anonymity: boolean; min_confidence: number };
  last_updated: string;
};

export type OutbreakBucket = { geohash5: string; count: number; severity: "stable"|"rising"|"surging" };

export type RadarResponse = {
  buckets: OutbreakBucket[];
  legend: Record<string, string>;
  since_hours: number;
};

export const OutbreakCfg = {
  MIN_CONFIDENCE: 0.75,
  WINDOW_HOURS_DEFAULT: 72,
  K_ANON: 3,
  SIGMA_BANDS: { rising: 1.0, surging: 2.0 },
};

export interface OutbreakRepo {
  insertReport(input: OutbreakReportInput): Promise<{ id: string }>;
  getCountsByDay(geohash5: string, crop: Crop, sinceHours: number): Promise<OutbreakTrendPoint[]>;
  getTopLabels(geohash5: string, crop: Crop, sinceHours: number, minConfidence: number): Promise<OutbreakTopLabel[]>;
  getTotal(geohash5: string, crop: Crop, sinceHours: number, minConfidence: number): Promise<number>;
  getUniqueFields(geohash5: string, crop: Crop, sinceHours: number, minConfidence: number): Promise<number | null>;
  getRadarBuckets(geohashes: string[], crop: Crop, sinceHours: number, minConfidence: number): Promise<{ geohash5: string; count: number; }[]>;
  getBaselineStats(geohashes: string[], crop: Crop, days: number): Promise<{ geohash5: string; median: number; sigma: number; }[]>;
}

// Domain services
export async function getOutbreaks(
  repo: OutbreakRepo,
  params: { geohash5: string; crop: Crop; since_hours?: number; min_confidence?: number }
): Promise<OutbreakResponse> {
  const since = params.since_hours ?? OutbreakCfg.WINDOW_HOURS_DEFAULT;
  const minConf = params.min_confidence ?? OutbreakCfg.MIN_CONFIDENCE;

  const [trend, topLabels, total, uniq] = await Promise.all([
    repo.getCountsByDay(params.geohash5, params.crop, since),
    repo.getTopLabels(params.geohash5, params.crop, since, minConf),
    repo.getTotal(params.geohash5, params.crop, since, minConf),
    repo.getUniqueFields(params.geohash5, params.crop, since, minConf),
  ]);

  return {
    geohash5: params.geohash5,
    crop: params.crop,
    window_hours: since,
    total_reports: total,
    unique_fields: uniq,
    top_labels: topLabels,
    trend,
    confidence: { k_anonymity: total >= OutbreakCfg.K_ANON, min_confidence: minConf },
    last_updated: new Date().toISOString(),
  };
}

export function classifySeverity(count: number, median: number, sigma: number): "stable"|"rising"|"surging" {
  if (count > median + OutbreakCfg.SIGMA_BANDS.surging * sigma) return "surging";
  if (count > median + OutbreakCfg.SIGMA_BANDS.rising  * sigma) return "rising";
  return "stable";
}

export async function getOutbreakRadar(
  repo: OutbreakRepo,
  params: { geohashes: string[]; crop: Crop; since_hours?: number; min_confidence?: number }
): Promise<RadarResponse> {
  const since = params.since_hours ?? OutbreakCfg.WINDOW_HOURS_DEFAULT;
  const minConf = params.min_confidence ?? OutbreakCfg.MIN_CONFIDENCE;

  const [counts, stats] = await Promise.all([
    repo.getRadarBuckets(params.geohashes, params.crop, since, minConf),
    repo.getBaselineStats(params.geohashes, params.crop, 30),
  ]);
  const statMap = new Map(stats.map(s => [s.geohash5, s]));

  const buckets = counts.map(({ geohash5, count }) => {
    const s = statMap.get(geohash5) ?? { median: 0, sigma: 1e-6 };
    return { geohash5, count, severity: classifySeverity(count, s.median, s.sigma) };
  });

  return {
    buckets,
    legend: { stable: "#A0D468", rising: "#FFCE54", surging: "#ED5565" },
    since_hours: since,
  };
}

export async function reportOutbreak(
  repo: OutbreakRepo,
  input: OutbreakReportInput
): Promise<{ id: string; status: "queued" | "pending_review" | "accepted" }> {
  // Basic validation
  if (!input.crop || !input.label || !input.geohash5 || !input.observed_at) {
    throw new Error("Missing required fields");
  }
  // Confidence rule (only required for scan)
  if (input.source === "scan" && (input.confidence ?? 0) < OutbreakCfg.MIN_CONFIDENCE) {
    // accept but do not count for radar; mark as pending
    const { id } = await repo.insertReport({ ...input });
    return { id, status: "pending_review" };
  }
  const { id } = await repo.insertReport({ ...input });
  // manual without evidence can also be pending_review if you choose
  const status: "queued" | "pending_review" | "accepted" =
    input.source === "manual" && !input.evidence?.photo_hash ? "pending_review" : "queued";
  return { id, status };
}