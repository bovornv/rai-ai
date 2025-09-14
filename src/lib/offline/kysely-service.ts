import { Kysely } from "kysely";
import { DB } from "../db/kysely";
import { OfflineRepo } from "./kysely-repo";
import { ClientMutation, SyncBundle, SyncQuery } from "./types";

function nowIso() { return new Date().toISOString(); }
function parseList(s?: string) {
  return (s ?? "").split(",").map(x => x.trim()).filter(Boolean);
}

/** GET /api/cache/sync — produce deltas using Kysely */
export async function doSyncKysely(db: Kysely<DB>, q: SyncQuery): Promise<SyncBundle> {
  const repo = new OfflineRepo(db);
  const server_time = nowIso();
  const since = q.since; // exclusive

  // Filters
  const areas = parseList(q.areas);
  const crops = parseList(q.crops);

  // 1) Refs (public tables) — shops + product_classes
  const shops = await repo.getShopsSince(since, areas);
  const product_classes = await repo.getProductClassesSince(since);

  // 2) User-private bundles — price_alerts + shop_tickets
  if (!q.user_id) throw new Error("user_id required for sync");
  const price_alerts = await repo.getPriceAlertsSince(q.user_id, since);
  const shop_tickets = await repo.getShopTicketsSince(q.user_id, since);

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

/** POST /api/cache/queue — accept batch of offline mutations using Kysely */
export async function processQueueKysely(db: Kysely<DB>, list: ClientMutation[]) {
  const repo = new OfflineRepo(db);
  const results: Array<{ mutation_id: string; status: string; message?: string }> = [];
  const now = nowIso();

  await db.transaction().execute(async (trx) => {
    const txRepo = new OfflineRepo(trx);
    
    for (const m of list) {
      // Idempotency: if mutation_id exists, skip
      const exists = await trx.selectFrom("outbox_log")
        .select("status")
        .where("mutation_id", "=", m.mutation_id)
        .executeTakeFirst();
      
      if (exists) {
        results.push({ mutation_id: m.mutation_id, status: "skipped", message: "duplicate" });
        continue;
      }

      // Route per entity/op
      try {
        let action: string;
        switch (m.entity) {
          case "price_alert":
            if (m.op === "delete") {
              await trx.deleteFrom("price_alerts")
                .where("id", "=", m.data.id)
                .where("user_id", "=", m.user_id)
                .execute();
              action = "deleted";
            } else {
              action = await txRepo.upsertPriceAlert(m.user_id, m.data);
            }
            break;
          case "shop_ticket_status":
            action = await txRepo.cancelShopTicket(m.user_id, m.data);
            break;
          case "shop_ticket":
            action = await txRepo.createShopTicket(m.user_id, m.data);
            break;
          default:
            throw new Error(`Unsupported entity: ${m.entity}`);
        }
        
        await txRepo.logOutbox(m.mutation_id, m.user_id, m.entity, m.op, "applied");
        results.push({ mutation_id: m.mutation_id, status: "applied" });
      } catch (e: any) {
        await txRepo.logOutbox(m.mutation_id, m.user_id, m.entity, m.op, "error", String(e.message || e));
        results.push({ mutation_id: m.mutation_id, status: "error", message: String(e.message || e) });
      }
    }
  });

  return { ok: true, results };
}
