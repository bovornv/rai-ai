import crypto from "crypto";
import qrcode from "qrcode";
import { Database } from "sqlite";
import { ulid } from "ulid";

const TICKET_TTL_HOURS = 72; // MVP: 3 days
const HMAC_SECRET = process.env.SHOPTICKET_HMAC_SECRET || "dev-secret-change-me-in-production";

export interface TicketPayload {
  tid: string;
  u: string;
  exp: string;
  v: number;
}

export interface CreateTicketInput {
  user_id: string;
  crop: "rice" | "durian";
  diagnosis_key: string;
  severity?: number;
  recommended_classes: string[];
  dosage_note?: string;
  rai?: number;
  shop_id?: number | null;
}

export interface CreateTicketOutput {
  id: string;
  status: string;
  qrPng: string;
  qrContent: string;
  printableUrl: string;
}

export interface SaleItem {
  item_desc: string;
  class_key?: string;
  qty?: number;
  unit?: string;
  price_thb?: number;
  total_thb: number;
}

export function signPayload(obj: any): string {
  const json = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const sig = crypto.createHmac("sha256", HMAC_SECRET).update(json).digest("base64url");
  return `${json}.${sig}`;
}

export function verifyPayload(packed: string): TicketPayload {
  const [json, sig] = packed.split(".");
  if (!json || !sig) throw new Error("Invalid payload format");
  
  const expectedSig = crypto.createHmac("sha256", HMAC_SECRET).update(json).digest("base64url");
  if (sig !== expectedSig) throw new Error("Invalid signature");
  
  return JSON.parse(Buffer.from(json, "base64url").toString());
}

export async function makeQrPng(data: string): Promise<string> {
  return qrcode.toDataURL(data, { 
    type: "image/png", 
    width: 200,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" }
  });
}

export function expiryISO(hours = TICKET_TTL_HOURS): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export async function createTicket(db: Database, input: CreateTicketInput): Promise<CreateTicketOutput> {
  const id = ulid();
  const payload: TicketPayload = {
    tid: id,
    u: input.user_id,
    exp: expiryISO(),
    v: 1
  };
  
  const qrContent = signPayload(payload);
  const qrPng = await makeQrPng(qrContent);
  const printableUrl = `${process.env.APP_BASE_URL || "https://raiai.app"}/ticket/${id}`;
  
  await db.run(`
    INSERT INTO shop_tickets (
      id, user_id, crop, diagnosis_key, severity, 
      recommended_classes, dosage_note, rai, shop_id, 
      status, qr_content, created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, 
    id, input.user_id, input.crop, input.diagnosis_key, input.severity || null,
    JSON.stringify(input.recommended_classes), input.dosage_note || null, input.rai || null, input.shop_id,
    "issued", qrContent, new Date().toISOString(), payload.exp
  );
  
  return {
    id,
    status: "issued",
    qrPng,
    qrContent,
    printableUrl
  };
}

export async function scanTicket(db: Database, qr: string, shopId: number) {
  const payload = verifyPayload(qr);
  const now = new Date().toISOString();
  
  if (payload.exp < now) {
    throw new Error("Ticket expired");
  }
  
  const ticket = await db.get(`
    SELECT * FROM shop_tickets WHERE id = ? AND status = 'issued'
  `, payload.tid);
  
  if (!ticket) {
    throw new Error("Ticket not found or already used");
  }
  
  await db.run(`
    UPDATE shop_tickets 
    SET status = 'scanned', shop_id = ?, scanned_at = ?
    WHERE id = ?
  `, shopId, now, payload.tid);
  
  return {
    id: ticket.id,
    user_id: ticket.user_id,
    crop: ticket.crop,
    diagnosis_key: ticket.diagnosis_key,
    severity: ticket.severity,
    recommended_classes: JSON.parse(ticket.recommended_classes || "[]"),
    dosage_note: ticket.dosage_note,
    rai: ticket.rai
  };
}

export async function confirmSale(db: Database, ticketId: string, shopId: number, items: SaleItem[]) {
  await db.exec("BEGIN TRANSACTION");
  
  try {
    // Verify ticket is scanned by this shop
    const ticket = await db.get(`
      SELECT * FROM shop_tickets 
      WHERE id = ? AND shop_id = ? AND status = 'scanned'
    `, ticketId, shopId);
    
    if (!ticket) {
      throw new Error("Ticket not found or not scanned by this shop");
    }
    
    // Update ticket status
    await db.run(`
      UPDATE shop_tickets 
      SET status = 'completed', completed_at = ?
      WHERE id = ?
    `, new Date().toISOString(), ticketId);
    
    // Record sale items
    for (const item of items) {
      await db.run(`
        INSERT INTO shop_sales (
          ticket_id, shop_id, item_desc, class_key, qty, unit, price_thb, total_thb, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, 
        ticketId, shopId, item.item_desc, item.class_key || null, 
        item.qty || null, item.unit || null, item.price_thb || null, 
        item.total_thb, new Date().toISOString()
      );
    }
    
    await db.exec("COMMIT");
    
    return {
      ticket_id: ticketId,
      items_count: items.length,
      total_amount: items.reduce((sum, item) => sum + item.total_thb, 0)
    };
    
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function expireOldTickets(db: Database) {
  const now = new Date().toISOString();
  const result = await db.run(
    `UPDATE shop_tickets 
     SET status = 'expired' 
     WHERE status IN ('issued', 'scanned') 
     AND expires_at < ?`,
    now
  );
  
  return result.changes || 0;
}

// Add missing functions
export async function getShops(db: Database) {
  const shops = await db.all(`
    SELECT id, name, location_code, phone, address, created_at
    FROM shops 
    ORDER BY name
  `);
  return shops;
}

export async function getTicketById(db: Database, ticketId: string) {
  const ticket = await db.get(`
    SELECT * FROM shop_tickets WHERE id = ?
  `, ticketId);
  
  if (ticket && ticket.recommended_classes) {
    ticket.recommended_classes = JSON.parse(ticket.recommended_classes);
  }
  
  return ticket;
}

export async function getUserTickets(db: Database, userId: string, limit = 50) {
  const tickets = await db.all(`
    SELECT * FROM shop_tickets 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `, userId, limit);
  
  return tickets.map(ticket => ({
    ...ticket,
    recommended_classes: ticket.recommended_classes ? JSON.parse(ticket.recommended_classes) : []
  }));
}