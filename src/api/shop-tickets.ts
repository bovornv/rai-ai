import { Router } from "express";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { 
  createTicket, 
  scanTicket, 
  confirmSale, 
  getTicketById, 
  getUserTickets, 
  getShops,
  expireOldTickets
} from "../lib/shop-ticket-service";

export async function openShopDb(dbPath = process.env.SHOPTICKET_DB_PATH || "data/app.db") {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  return db;
}

export function makeShopTicketRouter(db: Database) {
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
    } catch (e: any) {
      console.error("Create ticket error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // List user tickets
  r.get("/shop-tickets", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      const status = req.query.status as string | undefined;
      const items = await getUserTickets(db, user_id, status);
      res.json({ items });
    } catch (e: any) {
      console.error("Get tickets error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Ticket detail
  r.get("/shop-tickets/:id", async (req, res) => {
    try {
      const ticket = await getTicketById(db, req.params.id);
      if (!ticket) return res.status(404).json({ error: "Not found" });
      res.json(ticket);
    } catch (e: any) {
      console.error("Get ticket error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Update status (user cancels, etc.)
  r.put("/shop-tickets/:id/status", async (req, res) => {
    try {
      const { status } = req.body || {};
      if (!["issued", "canceled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await db.run(`UPDATE shop_tickets SET status=? WHERE id=?`, status, req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      console.error("Update status error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Shop directory
  r.get("/shops", async (req, res) => {
    try {
      const province = req.query.province_code as string | undefined;
      const items = await getShops(db, province);
      res.json({ items });
    } catch (e: any) {
      console.error("Get shops error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Counter Mode: scan QR
  r.post("/shops/scan-qr", async (req, res) => {
    try {
      const { qr, shop_id } = req.body || {};
      if (!qr || !shop_id) {
        return res.status(400).json({ error: "qr and shop_id required" });
      }

      const result = await scanTicket(db, qr, shop_id);
      res.json(result);
    } catch (e: any) {
      console.error("Scan QR error:", e);
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
    } catch (e: any) {
      console.error("Confirm sale error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Expire old tickets (cron job)
  r.post("/admin/expire-tickets", async (req, res) => {
    try {
      const expiredCount = await expireOldTickets(db);
      res.json({ expired_count: expiredCount });
    } catch (e: any) {
      console.error("Expire tickets error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Sales report
  r.get("/admin/sales-report", async (req, res) => {
    try {
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id as string) : undefined;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;
      
      const report = await db.all(`
        SELECT 
          ts.shop_id,
          s.name_th as shop_name,
          ts.class_key,
          pc.name_th as class_name,
          COUNT(*) as item_count,
          SUM(ts.total_thb) as total_thb,
          AVG(ts.total_thb) as avg_price
        FROM ticket_sales ts
        JOIN shops s ON ts.shop_id = s.id
        LEFT JOIN product_classes pc ON ts.class_key = pc.key
        WHERE 1=1
        ${shopId ? "AND ts.shop_id = ?" : ""}
        ${startDate ? "AND ts.created_at >= ?" : ""}
        ${endDate ? "AND ts.created_at <= ?" : ""}
        GROUP BY ts.shop_id, ts.class_key
        ORDER BY total_thb DESC
      `, 
        ...(shopId ? [shopId] : []),
        ...(startDate ? [startDate] : []),
        ...(endDate ? [endDate] : [])
      );
      
      res.json({ report });
    } catch (e: any) {
      console.error("Sales report error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  return r;
}
