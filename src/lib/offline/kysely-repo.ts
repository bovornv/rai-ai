import { Kysely, sql } from "kysely";
import { DB } from "../db/kysely";

export class OfflineRepo {
  constructor(private db: Kysely<DB>) {}

  // ---- Refs (delta by updated_at) ----
  async getShopsSince(since?: string, areaCodes: string[] = []) {
    let q = this.db.selectFrom("shops")
      .select(["id","name_th","province_code","amphoe_code","tambon_code","address","phone","line_id","referral_code","updated_at"])
      .where("is_active","=",1);
    if (since) q = q.where("updated_at",">",since);
    if (areaCodes.length) {
      q = q.where(eb => eb.or([
        eb("province_code","in",areaCodes),
        eb("amphoe_code","in",areaCodes),
        eb("tambon_code","in",areaCodes)
      ]));
    }
    return q.orderBy("updated_at").limit(2000).execute();
  }

  async getProductClassesSince(since?: string) {
    let q = this.db.selectFrom("product_classes").select(["key","name_th","updated_at"]);
    if (since) q = q.where("updated_at",">",since);
    return q.orderBy("updated_at").limit(2000).execute();
  }

  // ---- User bundles ----
  async getPriceAlertsSince(user_id: string, since?: string) {
    let q = this.db.selectFrom("price_alerts")
      .select(["id","crop","market_key","variety","size","target_min","target_max","unit","active","created_at","updated_at"])
      .where("user_id","=",user_id);
    if (since) q = q.where("updated_at",">",since);
    return q.orderBy("updated_at").limit(2000).execute();
  }

  async getShopTicketsSince(user_id: string, since?: string) {
    let q = this.db.selectFrom("shop_tickets")
      .select(["id","crop","diagnosis_key","severity","rai","status","created_at","expires_at","updated_at","shop_id"])
      .where("user_id","=",user_id);
    if (since) q = q.where("updated_at",">",since);
    return q.orderBy("updated_at").limit(2000).execute();
  }

  // ---- Mutations (conflict: server-wins unless client newer) ----
  async upsertPriceAlert(user_id: string, d: any) {
    const row = await this.db.selectFrom("price_alerts")
      .select(["updated_at"]).where("id","=",d.id).where("user_id","=",user_id).executeTakeFirst();
    const now = new Date().toISOString();
    if (!row) {
      await this.db.insertInto("price_alerts").values({
        id: d.id, user_id, crop: d.crop, market_key: d.market_key ?? null,
        variety: d.variety ?? null, size: d.size ?? null,
        target_min: d.target_min, target_max: d.target_max, unit: d.unit,
        active: d.active ? 1 : 0, created_at: now, updated_at: now
      }).onConflict((oc)=>oc.doNothing()).execute();
      return "inserted";
    }
    if (d.updated_at && d.updated_at <= row.updated_at) return "skipped";
    await this.db.updateTable("price_alerts").set({
      crop: d.crop, market_key: d.market_key ?? null, variety: d.variety ?? null, size: d.size ?? null,
      target_min: d.target_min, target_max: d.target_max, unit: d.unit, active: d.active ? 1 : 0, updated_at: now
    }).where("id","=",d.id).where("user_id","=",user_id).execute();
    return "updated";
  }

  async cancelShopTicket(user_id: string, d: any) {
    const row = await this.db.selectFrom("shop_tickets")
      .select(["status","updated_at"]).where("id","=",d.id).where("user_id","=",user_id).executeTakeFirst();
    if (!row) throw new Error("ticket not found");
    if (row.status === "fulfilled") return "skipped";
    if (d.updated_at && d.updated_at <= row.updated_at) return "skipped";
    await this.db.updateTable("shop_tickets")
      .set({ status: "canceled", updated_at: new Date().toISOString() })
      .where("id","=",d.id).execute();
    return "updated";
  }

  async createShopTicket(user_id: string, d: any) {
    await this.db.insertInto("shop_tickets").values({
      id: d.id, user_id, crop: d.crop, diagnosis_key: d.diagnosis_key,
      severity: d.severity ?? null, recommended_classes: JSON.stringify(d.recommended_classes || []),
      dosage_note: d.dosage_note ?? null, rai: d.rai ?? null, status: "issued",
      shop_id: d.shop_id ?? null, created_at: new Date().toISOString(),
      expires_at: d.expires_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(), hmac_sig: d.hmac_sig ?? null
    }).onConflict((oc)=>oc.doNothing()).execute();
    return "inserted";
  }

  async logOutbox(mutation_id: string, user_id: string, entity: string, op: string, status: string, message?: string) {
    const now = new Date().toISOString();
    await this.db.insertInto("outbox_log").values({
      mutation_id, user_id, entity, op, status, message: message ?? null, created_at: now, updated_at: now
    }).onConflict((oc)=>oc.doUpdateSet({ status, message: sql`excluded.message`, updated_at: now})).execute();
  }
}
