import { Database } from "sqlite";
import { ClientMutation, SyncBundle, SyncQuery } from "./types";

function nowIso() { return new Date().toISOString(); }
function parseList(s?: string) {
  return (s ?? "").split(",").map(x => x.trim()).filter(Boolean);
}

/** Compute the "since" filter SQL */
function sinceWhere(col = "updated_at", since?: string) {
  return since ? `${col} > ?` : "1=1";
}
function sinceParam(since?: string) {
  return since ? [since] : [];
}

/** GET /api/cache/sync — produce deltas */
export async function doSync(db: Database, q: SyncQuery): Promise<SyncBundle> {
  const server_time = nowIso();
  const since = q.since; // exclusive

  // Filters
  const areas = parseList(q.areas);
  const crops = parseList(q.crops);

  // 1) Refs (public tables) — shops + product_classes
  const shops = await db.all(
    `SELECT id,name_th,province_code,amphoe_code,tambon_code,address,phone,line_id,referral_code,updated_at
     FROM shops
     WHERE is_active=1 AND ${sinceWhere("updated_at", since)}
     ${areas.length ? `AND (province_code IN (${areas.map(()=>"?").join(",")})
                          OR amphoe_code IN (${areas.map(()=>"?").join(",")})
                          OR tambon_code IN (${areas.map(()=>"?").join(",")}))` : ""}
     ORDER BY updated_at ASC
     LIMIT 2000`,
    ...sinceParam(since),
    ...areas, ...areas, ...areas
  );

  const product_classes = await db.all(
    `SELECT key,name_th,updated_at
     FROM product_classes
     WHERE ${sinceWhere("updated_at", since)}
     ORDER BY updated_at ASC
     LIMIT 2000`,
    ...sinceParam(since)
  );

  // 2) User-private bundles — price_alerts + shop_tickets (subset of fields)
  if (!q.user_id) throw new Error("user_id required for sync");
  const price_alerts = await db.all(
    `SELECT id,crop,market_key,variety,size,target_min,target_max,unit,active,created_at,updated_at
     FROM price_alerts
     WHERE user_id=? AND ${sinceWhere("updated_at", since)}
     ORDER BY updated_at ASC
     LIMIT 2000`,
    q.user_id, ...sinceParam(since)
  );

  const shop_tickets = await db.all(
    `SELECT id,crop,diagnosis_key,severity,rai,status,created_at,expires_at,updated_at,shop_id
     FROM shop_tickets
     WHERE user_id=? AND ${sinceWhere("updated_at", since)}
     ORDER BY updated_at ASC
     LIMIT 2000`,
    q.user_id, ...sinceParam(since)
  );

  // 3) next_since: highest updated_at seen among all rows (or server_time if none)
  const maxUpdated = [
    ...shops, ...product_classes, ...price_alerts, ...shop_tickets
  ].reduce<string>((acc, r: any) => r?.updated_at && r.updated_at > acc ? r.updated_at : acc, "");
  const next_since = maxUpdated || server_time;

  return {
    server_time,
    next_since,
    refs: { shops, product_classes },
    user: { price_alerts, shop_tickets }
  };
}

/** POST /api/cache/queue — accept batch of offline mutations */
export async function processQueue(db: Database, list: ClientMutation[]) {
  const results: Array<{ mutation_id: string; status: string; message?: string }> = [];
  const now = nowIso();

  await db.exec("BEGIN");
  try {
    for (const m of list) {
      // Idempotency: if mutation_id exists, skip
      const exists = await db.get(`SELECT status FROM outbox_log WHERE mutation_id=?`, m.mutation_id);
      if (exists) {
        results.push({ mutation_id: m.mutation_id, status: "skipped", message: "duplicate" });
        continue;
      }

      // Route per entity/op
      try {
        switch (m.entity) {
          case "price_alert":
            await applyPriceAlert(db, m);
            break;
          case "shop_ticket_status":
            await applyShopTicketStatus(db, m);
            break;
          case "shop_ticket":
            // (rare) client-created tickets offline -> server create
            await applyShopTicketCreate(db, m);
            break;
          default:
            throw new Error(`Unsupported entity: ${m.entity}`);
        }
        await db.run(
          `INSERT INTO outbox_log (mutation_id,user_id,entity,op,status,message,created_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?)`,
          m.mutation_id, m.user_id, m.entity, m.op, "applied", null, now, now
        );
        results.push({ mutation_id: m.mutation_id, status: "applied" });
      } catch (e: any) {
        await db.run(
          `INSERT INTO outbox_log (mutation_id,user_id,entity,op,status,message,created_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?)`,
          m.mutation_id, m.user_id, m.entity, m.op, "error", String(e.message || e), now, now
        );
        results.push({ mutation_id: m.mutation_id, status: "error", message: String(e.message || e) });
      }
    }
    await db.exec("COMMIT");
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  }

  return { ok: true, results };
}

// ----- entity appliers -----

async function applyPriceAlert(db: Database, m: ClientMutation) {
  const d = m.data || {};
  if (m.op === "delete") {
    if (!d.id) throw new Error("id required for delete");
    await db.run(`DELETE FROM price_alerts WHERE id=? AND user_id=?`, d.id, m.user_id);
    return;
  }

  // insert or update
  const id = d.id;
  const now = new Date().toISOString();
  const row = await db.get(`SELECT updated_at FROM price_alerts WHERE id=? AND user_id=?`, id, m.user_id);
  if (!row) {
    if (m.op !== "insert") throw new Error("price_alert not found");
    await db.run(
      `INSERT INTO price_alerts
       (id,user_id,crop,market_key,variety,size,target_min,target_max,unit,active,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      id, m.user_id, d.crop, d.market_key ?? null, d.variety ?? null, d.size ?? null,
      d.target_min, d.target_max, d.unit, d.active ? 1 : 0, now, now
    );
  } else {
    // conflict check (client may send client_updated_at)
    const clientUpdated: string | undefined = d.updated_at;
    if (clientUpdated && clientUpdated <= row.updated_at) {
      // server wins
      return;
    }
    await db.run(
      `UPDATE price_alerts
       SET crop=?, market_key=?, variety=?, size=?, target_min=?, target_max=?,
           unit=?, active=?, updated_at=?
       WHERE id=? AND user_id=?`,
      d.crop, d.market_key ?? null, d.variety ?? null, d.size ?? null,
      d.target_min, d.target_max, d.unit, d.active ? 1 : 0, now, id, m.user_id
    );
  }
}

async function applyShopTicketStatus(db: Database, m: ClientMutation) {
  // Allow only cancel from client (others come from Shop Counter flow)
  const d = m.data || {};
  if (!d.id || !d.status) throw new Error("id and status required");
  if (!["canceled"].includes(d.status)) throw new Error("unsupported status (client can only cancel)");

  const row = await db.get(`SELECT status, updated_at FROM shop_tickets WHERE id=? AND user_id=?`, d.id, m.user_id);
  if (!row) throw new Error("ticket not found");

  // if already fulfilled, ignore
  if (row.status === "fulfilled") return;

  // conflict check: client must be newer than server
  const clientUpdated: string | undefined = d.updated_at;
  if (clientUpdated && clientUpdated <= row.updated_at) return;

  const now = new Date().toISOString();
  await db.run(`UPDATE shop_tickets SET status='canceled', updated_at=? WHERE id=?`, now, d.id);
}

async function applyShopTicketCreate(db: Database, m: ClientMutation) {
  // Optional: allow client to create ticket while offline; server assigns timestamps
  const d = m.data || {};
  if (!d.id || !d.crop || !d.diagnosis_key || !Array.isArray(d.recommended_classes)) {
    throw new Error("invalid shop_ticket payload");
  }
  const exists = await db.get(`SELECT id FROM shop_tickets WHERE id=?`, d.id);
  if (exists) return; // idempotent
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO shop_tickets
     (id,user_id,crop,diagnosis_key,severity,recommended_classes,dosage_note,rai,status,shop_id,
      created_at,expires_at,updated_at,hmac_sig)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    d.id, m.user_id, d.crop, d.diagnosis_key, d.severity ?? null,
    JSON.stringify(d.recommended_classes), d.dosage_note ?? null, d.rai ?? null,
    "issued", d.shop_id ?? null, now, d.expires_at ?? now, now, d.hmac_sig ?? null
  );
}
