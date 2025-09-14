import { Router } from "express";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export async function openPricesDb(dbPath = process.env.APP_DB_PATH || "data/app.db") {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  return db;
}

export function makePricesRouter(db: Database) {
  const r = Router();

  // GET /api/prices/current
  r.get("/current", async (req, res) => {
    try {
      const { crop, market, variety, size } = req.query;
      
      let query = `
        SELECT pq.*, m.name as market_name, m.location_code
        FROM price_quotes pq
        JOIN markets m ON pq.market_id = m.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (crop) {
        query += " AND pq.crop = ?";
        params.push(crop);
      }
      if (market) {
        query += " AND m.key = ?";
        params.push(market);
      }
      if (variety) {
        query += " AND pq.variety = ?";
        params.push(variety);
      }
      if (size) {
        query += " AND pq.size = ?";
        params.push(size);
      }
      
      query += " ORDER BY pq.updated_at DESC LIMIT 100";
      
      const quotes = await db.all(query, params);
      res.json({ quotes });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/prices/history
  r.get("/history", async (req, res) => {
    try {
      const { crop, market, days = 30 } = req.query;
      
      const query = `
        SELECT pq.*, m.name as market_name
        FROM price_quotes pq
        JOIN markets m ON pq.market_id = m.id
        WHERE pq.crop = ? AND m.key = ?
        AND pq.updated_at >= datetime('now', '-${days} days')
        ORDER BY pq.updated_at DESC
      `;
      
      const quotes = await db.all(query, [crop, market]);
      res.json({ quotes });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/prices/markets
  r.get("/markets", async (req, res) => {
    try {
      const markets = await db.all(`
        SELECT id, key, name, location_code
        FROM markets
        ORDER BY name
      `);
      res.json({ markets });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/prices/stats
  r.get("/stats", async (req, res) => {
    try {
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total_quotes,
          COUNT(DISTINCT crop) as crops,
          COUNT(DISTINCT market_id) as markets,
          MAX(updated_at) as last_update
        FROM price_quotes
      `);
      res.json({ stats });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/prices/convert
  r.get("/convert", async (req, res) => {
    try {
      const { amount, from, to } = req.query;
      
      if (!amount || !from || !to) {
        return res.status(400).json({ error: "Missing amount, from, or to" });
      }
      
      // Simple conversion logic - you can enhance this
      const rate = 1; // Placeholder - implement actual conversion
      const converted = parseFloat(amount as string) * rate;
      
      res.json({ 
        amount: parseFloat(amount as string),
        from,
        to,
        rate,
        converted
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/prices/sources
  r.get("/sources", async (req, res) => {
    try {
      const sources = await db.all(`
        SELECT DISTINCT source
        FROM price_quotes
        WHERE source IS NOT NULL
        ORDER BY source
      `);
      res.json({ sources: sources.map(s => s.source) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return r;
}