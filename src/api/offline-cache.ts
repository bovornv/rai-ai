import { Router } from "express";
import { makeDb } from "../lib/db/kysely";
import { doSyncKysely, processQueueKysely } from "../lib/offline/kysely-service";
import { ClientMutation } from "../lib/offline/types";

export async function makeOfflineCacheRouter() {
  const db = makeDb();
  const r = Router();

  /**
   * GET /api/cache/sync?user_id=...&since=...&areas=...&crops=...
   * Returns deltas (refs + user) since cursor.
   */
  r.get("/sync", async (req, res) => {
    try {
      const { user_id, since, areas, crops } = req.query as any;
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      const out = await doSyncKysely(db, { user_id, since, areas, crops });
      res.json(out);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * POST /api/cache/queue
   * body: { mutations: ClientMutation[] }
   * idempotent per mutation_id
   */
  r.post("/queue", async (req, res) => {
    try {
      const body = req.body || {};
      const muts: ClientMutation[] = Array.isArray(body.mutations) ? body.mutations : [];
      if (!muts.length) return res.status(400).json({ error: "mutations[] required" });
      const out = await processQueueKysely(db, muts);
      res.json(out);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return r;
}
