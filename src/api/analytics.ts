import { Router } from "express";
import { openAnalyticsDb } from "../lib/analytics/db";
import { insertEvents, requireWriteKey, requireReadKey, computeKpis } from "../lib/analytics/service";
import { AnalyticsEvent } from "../lib/analytics/types";

export async function makeAnalyticsRouter() {
  const db = await openAnalyticsDb();
  const r = Router();

  // POST /api/analytics/events  (single or batch)
  r.post("/events", async (req, res) => {
    try {
      requireWriteKey(req);
      const body = req.body || {};
      const events: AnalyticsEvent[] =
        Array.isArray(body.events) ? body.events :
        body.event ? [body.event] : [];
      if (!events.length) return res.status(400).json({ error: "No events" });
      await insertEvents(db, events);
      res.json({ ok: true, count: events.length });
    } catch (e: any) {
      const code = e.message === "Unauthorized" ? 401 : 500;
      res.status(code).json({ error: e.message });
    }
  });

  // GET /api/analytics/kpis?from=..&to=..
  r.get("/kpis", async (req, res) => {
    try {
      requireReadKey(req);
      const { from, to } = req.query as any;
      const kpis = await computeKpis(db, from, to);
      res.json({ window: { from, to }, kpis });
    } catch (e: any) {
      const code = e.message === "Unauthorized" ? 401 : 500;
      res.status(code).json({ error: e.message });
    }
  });

  return r;
}
