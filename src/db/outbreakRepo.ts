import { randomUUID } from "crypto";
import { Crop, OutbreakRepo, OutbreakReportInput, OutbreakTrendPoint } from "../lib/outbreak-service";

// Mock database interface for now - replace with actual SQLite implementation
interface Database {
  run(sql: string, ...params: any[]): Promise<void>;
  get<T>(sql: string, ...params: any[]): Promise<T | undefined>;
  all<T>(sql: string, ...params: any[]): Promise<T[]>;
}

// Helper: date math in SQLite-friendly format
const HOURS = (h: number) => `${-h} hours`;

export function makeOutbreakRepo(db: Database): OutbreakRepo {
  return {
    async insertReport(input: OutbreakReportInput) {
      const id = input["id" as any] ?? `obr_${randomUUID()}`;
      await db.run(
        `INSERT INTO outbreak_reports
         (id, geohash5, crop, label, confidence, observed_at, source, photo_hash, ticket_id, partner_id, device_id, field_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        id, input.geohash5, input.crop, input.label, input.confidence ?? null,
        input.observed_at, input.source, input.evidence?.photo_hash ?? null,
        input.evidence?.ticket_id ?? null, input.contact?.co_op_id ?? null,
        input.device_id ?? null, input.field_id ?? null
      );
      return { id };
    },

    async getCountsByDay(geohash5: string, crop: Crop, sinceHours: number) {
      const rows = await db.all<{ date: string; count: number }[]>(
        `SELECT substr(observed_at,1,10) AS date, COUNT(*) AS count
           FROM outbreak_reports
          WHERE geohash5=? AND crop=? AND observed_at >= datetime('now', ?)
            AND (confidence IS NULL OR confidence >= 0.75)
          GROUP BY date
          ORDER BY date ASC`,
        geohash5, crop, HOURS(sinceHours)
      );
      return rows.map(r => ({ date: r.date, count: Number(r.count) }));
    },

    async getTopLabels(geohash5: string, crop: Crop, sinceHours: number, minConfidence: number) {
      const rows = await db.all<{ label: string; count: number }[]>(
        `SELECT label, COUNT(*) AS count
           FROM outbreak_reports
          WHERE geohash5=? AND crop=? AND observed_at >= datetime('now', ?)
            AND (confidence IS NULL OR confidence >= ? OR confidence IS NULL)
          GROUP BY label
          ORDER BY count DESC
          LIMIT 5`,
        geohash5, crop, HOURS(sinceHours), minConfidence
      );
      return rows.map(r => ({ label: r.label, count: Number(r.count) }));
    },

    async getTotal(geohash5: string, crop: Crop, sinceHours: number, minConfidence: number) {
      const row = await db.get<{ c: number }>(
        `SELECT COUNT(*) AS c
           FROM outbreak_reports
          WHERE geohash5=? AND crop=? AND observed_at >= datetime('now', ?)
            AND (confidence IS NULL OR confidence >= ? OR confidence IS NULL)`,
        geohash5, crop, HOURS(sinceHours), minConfidence
      );
      return Number(row?.c ?? 0);
    },

    async getUniqueFields(geohash5: string, crop: Crop, sinceHours: number, minConfidence: number) {
      const row = await db.get<{ c: number }>(
        `SELECT COUNT(DISTINCT COALESCE(field_id, id)) AS c
           FROM outbreak_reports
          WHERE geohash5=? AND crop=? AND observed_at >= datetime('now', ?)
            AND (confidence IS NULL OR confidence >= ? OR confidence IS NULL)`,
        geohash5, crop, HOURS(sinceHours), minConfidence
      );
      return row ? Number(row.c) : null;
    },

    async getRadarBuckets(geohashes: string[], crop: Crop, sinceHours: number, minConfidence: number) {
      const placeholders = geohashes.map(() => "?").join(",");
      const rows = await db.all<{ geohash5: string; count: number }[]>(
        `SELECT geohash5, COUNT(*) AS count
           FROM outbreak_reports
          WHERE geohash5 IN (${placeholders}) AND crop=? AND observed_at >= datetime('now', ?)
            AND (confidence IS NULL OR confidence >= ? OR confidence IS NULL)
          GROUP BY geohash5`,
        ...geohashes, crop, HOURS(sinceHours), minConfidence
      );
      return rows.map(r => ({ geohash5: r.geohash5, count: Number(r.count) }));
    },

    async getBaselineStats(geohashes: string[], crop: Crop, days: number) {
      const placeholders = geohashes.map(() => "?").join(",");
      // Compute median + sigma over daily counts in the last N days
      const rows = await db.all<{ geohash5: string; median: number; sigma: number }[]>(
        `WITH cte AS (
           SELECT geohash5, substr(observed_at,1,10) AS d, COUNT(*) AS c
             FROM outbreak_reports
            WHERE geohash5 IN (${placeholders}) AND crop=? AND observed_at >= datetime('now', ?)
              AND (confidence IS NULL OR confidence >= 0.75)
            GROUP BY geohash5, d
         ),
         stats AS (
           SELECT geohash5,
                  -- approximate median via percentile_disc using window emulation
                  (SELECT c FROM cte c2 WHERE c2.geohash5=cte.geohash5 ORDER BY c LIMIT 1 OFFSET CAST((COUNT(*)-1)/2 AS INT)) AS median,
                  -- population stddev approximation
                  sqrt(AVG( (c - AVG(c))*(c - AVG(c)) ) ) OVER (PARTITION BY geohash5) AS sigma
           FROM cte
         )
         SELECT geohash5,
                MAX(median) AS median,
                MAX(COALESCE(sigma,0)) AS sigma
           FROM stats
          GROUP BY geohash5`,
        ...geohashes, crop, `${-24 * days} hours`
      );
      return rows.map(r => ({ geohash5: r.geohash5, median: Number(r.median ?? 0), sigma: Number(r.sigma ?? 0.000001) }));
    },
  };
}
