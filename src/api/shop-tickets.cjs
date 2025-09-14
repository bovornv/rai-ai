const { Router } = require('express');
const sqlite3 = require('sqlite3');
const { open, Database } = require('sqlite');
const { createTicket, verifyPayload, scanTicket, confirmSale, expireOldTickets } = require('../lib/shop-ticket-service.cjs');

async function openShopDb(dbPath = process.env.SHOPTICKET_DB_PATH || "data/app.db") {
  const db = await open({ 
    filename: dbPath, 
    driver: sqlite3.Database 
  });
  return db;
}

function makeShopTicketRouter(db) {
  const r = Router();

  // Create ticket (farmer app)
  r.post("/shop-tickets", async (req, res) => {
    try {
      const b = req.body || {};
      if (!b.user_id || !b.crop || !b.diagnosis_key || !Array.isArray(b.recommended_classes)) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const out = await createTicket(db, b);
      res.json(out);
    } catch (e) {
      console.error('Create ticket error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // List user tickets
  r.get("/shop-tickets", async (req, res) => {
    try {
      const user_id = req.query.user_id;
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      const status = req.query.status;
      const rows = await db.all(
        `SELECT id,crop,diagnosis_key,severity,rai,status,created_at,expires_at FROM shop_tickets WHERE user_id=? ${status ? "AND status=?" : ""} ORDER BY created_at DESC LIMIT 100`,
        ...(status ? [user_id, status] : [user_id])
      );
      res.json({ items: rows });
    } catch (e) {
      console.error('List tickets error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Ticket detail
  r.get("/shop-tickets/:id", async (req, res) => {
    try {
      const t = await db.get(`SELECT * FROM shop_tickets WHERE id=?`, req.params.id);
      if (!t) return res.status(404).json({ error: "Not found" });
      res.json(t);
    } catch (e) {
      console.error('Get ticket error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Update status (user cancels, etc.)
  r.put("/shop-tickets/:id/status", async (req, res) => {
    try {
      const { status } = req.body || {};
      if (!["issued","canceled"].includes(status)) return res.status(400).json({ error: "Invalid status" });
      await db.run(`UPDATE shop_tickets SET status=? WHERE id=?`, status, req.params.id);
      res.json({ ok: true });
    } catch (e) {
      console.error('Update status error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Shop directory
  r.get("/shops", async (req, res) => {
    try {
      const province = req.query.province_code;
      const rows = await db.all(
        `SELECT id,name_th,province_code,amphoe_code,tambon_code,address,phone,line_id,referral_code FROM shops WHERE is_active=1 ${province ? "AND province_code=?" : ""} ORDER BY name_th`,
        ...(province ? [province] : [])
      );
      res.json({ items: rows });
    } catch (e) {
      console.error('List shops error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Counter Mode: scan QR
  r.post("/shops/scan-qr", async (req, res) => {
    try {
      const { qr, shop_id } = req.body || {};
      if (!qr || !shop_id) return res.status(400).json({ error: "qr and shop_id required" });
      
      const result = await scanTicket(db, qr, shop_id);
      res.json(result);
    } catch (e) {
      console.error('Scan QR error:', e);
      res.status(400).json({ error: e.message });
    }
  });

  // Counter Mode: confirm sale
  r.post("/shops/confirm-sale", async (req, res) => {
    try {
      const { ticket_id, shop_id, items } = req.body || {};
      if (!ticket_id || !shop_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "ticket_id, shop_id, items required" });
      }
      
      const result = await confirmSale(db, ticket_id, shop_id, items);
      res.json(result);
    } catch (e) {
      console.error('Confirm sale error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  return r;
}

module.exports = { makeShopTicketRouter, openShopDb };
