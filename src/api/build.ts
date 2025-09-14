import { Router } from "express";
import { getBuildInfo, getBuildConfig } from "../lib/build-system";

export function makeBuildRouter() {
  const r = Router();

  // GET /api/build/info
  r.get("/info", (req, res) => {
    try {
      res.json(getBuildInfo());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/build/config
  r.get("/config", (req, res) => {
    try {
      res.json(getBuildConfig());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return r;
}
