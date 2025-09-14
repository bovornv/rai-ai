const crypto = require("crypto");
const qrcode = require("qrcode");
const { ulid } = require("ulid");

const TICKET_TTL_HOURS = 72; // MVP
const HMAC_SECRET = process.env.SHOPTICKET_HMAC_SECRET || "dev-secret-change-me";

function signPayload(obj) {
  const json = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const sig = crypto.createHmac("sha256", HMAC_SECRET).update(json).digest("base64url");
  return `${json}.${sig}`;
}

function verifyPayload(packed) {
  const [json, sig] = packed.split(".");
  const valid = crypto.createHmac("sha256", HMAC_SECRET).update(json).digest("base64url");
  if (sig !== valid) throw new Error("Invalid QR signature");
  const data = JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
  if (new Date(data.exp).getTime() < Date.now()) throw new Error("Ticket expired");
  return data;
}

async function makeQrPng(data) {
  // returns data URL (PNG) for mobile display/printing
  return qrcode.toDataURL(data, { 
    errorCorrectionLevel: "M", 
    margin: 1, 
    width: 360 
  });
}

function expiryISO(hours = TICKET_TTL_HOURS) {
  const d = new Date(Date.now() + hours * 3600 * 1000);
  return d.toISOString();
}

async function createTicket(db, input) {
  const id = ulid();
  const payload = { 
    tid: id, 
    u: input.user_id, 
    exp: expiryISO(), 
    v: 1 
  };
  const packed = signPayload(payload);
  const qrContent = `rai://ticket/${packed}`;
  const now = new Date().toISOString();
  
  await db.run(
    `INSERT INTO shop_tickets (id,user_id,crop,diagnosis_key,severity,recommended_classes,dosage_note,rai,status,shop_id,created_at,expires_at,hmac_sig) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    id, 
    input.user_id, 
    input.crop, 
    input.diagnosis_key, 
    input.severity ?? null, 
    JSON.stringify(input.recommended_classes), 
    input.dosage_note ?? null, 
    input.rai ?? null, 
    "issued", 
    input.shop_id ?? null, 
    now, 
    payload.exp, 
    packed.split(".")[1] // store sig
  );
  
  const qrPng = await makeQrPng(qrContent);
  return { 
    id, 
    status: "issued", 
    qrPng, 
    qrContent, 
    printableUrl: `/tickets/${id}/print` 
  };
}

async function scanTicket(db, qr, shop_id) {
  // Expected format: rai://ticket/<packed>
  const packed = String(qr).split("rai://ticket/")[1] || qr;
  const payload = verifyPayload(packed);
  
  const t = await db.get(`SELECT * FROM shop_tickets WHERE id=?`, payload.tid);
  if (!t) throw new Error("Ticket not found");
  if (t.status === "fulfilled") throw new Error("Already fulfilled");
  if (new Date(t.expires_at).getTime() < Date.now()) throw new Error("Expired");
  
  // Mark scanned (soft)
  if (t.status === "issued") {
    await db.run(`UPDATE shop_tickets SET status='scanned' WHERE id=?`, t.id);
  }
  
  return {
    ticket_id: t.id,
    crop: t.crop,
    diagnosis_key: t.diagnosis_key,
    recommended_classes: JSON.parse(t.recommended_classes),
    dosage_note: t.dosage_note,
    rai: t.rai,
    expires_at: t.expires_at
  };
}

async function confirmSale(db, ticket_id, shop_id, items) {
  // Validate open ticket
  const t = await db.get(`SELECT * FROM shop_tickets WHERE id=?`, ticket_id);
  if (!t) throw new Error("Ticket not found");
  if (t.status === "fulfilled") throw new Error("Already fulfilled");
  
  // Save items
  const now = new Date().toISOString();
  await db.exec("BEGIN");
  
  try {
    for (const it of items) {
      await db.run(
        `INSERT INTO ticket_sales (ticket_id,shop_id,item_desc,class_key,qty,unit,price_thb,total_thb,created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
        ticket_id, 
        shop_id, 
        it.item_desc, 
        it.class_key ?? null, 
        it.qty ?? null, 
        it.unit ?? null, 
        it.price_thb ?? null, 
        it.total_thb, 
        now
      );
    }
    
    await db.run(
      `UPDATE shop_tickets SET status='fulfilled', redeemed_at=?, shop_id=COALESCE(shop_id, ?) WHERE id=?`, 
      now, 
      shop_id, 
      ticket_id
    );
    
    await db.exec("COMMIT");
    return { ok: true, ticket_id };
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

async function expireOldTickets(db) {
  const now = new Date().toISOString();
  const result = await db.run(
    `UPDATE shop_tickets SET status='expired' WHERE status IN ('issued', 'scanned') AND expires_at < ?`,
    now
  );
  return result.changes;
}

module.exports = {
  signPayload,
  verifyPayload,
  makeQrPng,
  expiryISO,
  createTicket,
  scanTicket,
  confirmSale,
  expireOldTickets
};
