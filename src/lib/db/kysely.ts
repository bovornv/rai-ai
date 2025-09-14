import { Kysely, SqliteDialect, Generated } from "kysely";
import SQLite from "better-sqlite3";

export interface Markets { 
  id: Generated<number>; 
  key: string; 
  name: string; 
  location_code: string | null; 
}

export interface PriceQuotes {
  id: Generated<number>;
  crop: "rice" | "durian";
  variety: string | null; 
  grade: string | null; 
  size: string | null;
  unit: "USD/MT" | "THB/kg" | string;
  price_min: number; 
  price_max: number;
  currency: "USD" | "THB" | string;
  source: "trea" | "talaadthai" | string;
  market_id: number | null; 
  observed_at: string;
}

export interface Shops {
  id: Generated<number>;
  name_th: string; 
  province_code: string | null; 
  amphoe_code: string | null; 
  tambon_code: string | null;
  address: string | null; 
  phone: string | null; 
  line_id: string | null;
  referral_code: string | null; 
  is_active: 0 | 1; 
  updated_at: string;
}

export interface ProductClasses { 
  id: Generated<number>; 
  key: string; 
  name_th: string; 
  updated_at: string; 
}

export interface ShopTickets {
  id: string; 
  user_id: string; 
  crop: "rice"|"durian"; 
  diagnosis_key: string;
  severity: number | null; 
  recommended_classes: string; 
  dosage_note: string | null; 
  rai: number | null;
  status: "issued"|"scanned"|"fulfilled"|"expired"|"canceled";
  shop_id: number | null; 
  created_at: string; 
  expires_at: string; 
  redeemed_at: string | null;
  hmac_sig: string | null; 
  updated_at: string;
}

export interface PriceAlerts {
  id: string; 
  user_id: string; 
  crop: "rice"|"durian"; 
  market_key: string | null; 
  variety: string | null; 
  size: string | null;
  target_min: number; 
  target_max: number; 
  unit: string; 
  active: 0|1; 
  created_at: string; 
  updated_at: string;
}

export interface OutboxLog {
  mutation_id: string; 
  user_id: string; 
  entity: string; 
  op: string; 
  status: string; 
  message: string | null; 
  created_at: string; 
  updated_at: string;
}

export interface DB {
  markets: Markets;
  price_quotes: PriceQuotes;
  shops: Shops;
  product_classes: ProductClasses;
  shop_tickets: ShopTickets;
  price_alerts: PriceAlerts;
  outbox_log: OutboxLog;
}

export function makeDb(dbPath = process.env.APP_DB_PATH || "data/app.db") {
  const sqlite = new SQLite(dbPath);
  return new Kysely<DB>({ dialect: new SqliteDialect({ database: sqlite }) });
}
