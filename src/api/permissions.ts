import { Router } from "express";
import { openDb } from "../lib/db";
import { getPermissionStatus, requestLocationPermission } from "../lib/permissions-service";

export async function makePermissionsRouter() {
  const db = await openDb();
  const r = Router();

  r.get("/status", async (req, res) => {
    try {
      const rec = await getPermissionStatus(db);
      res.json(rec ?? { status: "prompt", type: "manual" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  r.post("/location", async (req, res) => {
    try {
      const rec = await requestLocationPermission(db);
      res.json(rec);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return r;
}
