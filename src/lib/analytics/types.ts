export type AnalyticsEvent = {
  user_id?: string;             // optional for logged-in
  anon_id?: string;             // required if user_id missing
  session_id?: string;
  event_name: string;
  ts: string;                   // ISO
  app_version?: string;
  platform?: "android"|"ios"|"web";
  area_code?: string;           // ADM2 or geohash5; not precise GPS
  props?: Record<string, any>;  // sanitized, PDPA-safe
};

export type EventsIngestRequest =
  | { event: AnalyticsEvent }
  | { events: AnalyticsEvent[] };

export type KpiQuery = {
  from?: string;                // ISO (defaults last 30d)
  to?: string;                  // ISO (exclusive)
  by?: "all" | "platform" | "area"; // simple grouping
};

export type KpiResult = {
  dau: number;
  wau: number;
  mau: number;
  new_users: number;
  activation_rate: number;     // % of new users who did key action (e.g., 'set_reminder' or 'shop_ticket_created') within 7d
  scan_to_action: number;      // % classify_done that led to action (set_reminder OR shop_ticket_created) within 1d
  infer_p50_ms: number;
  infer_p95_ms: number;
  feature_usage: { event_name: string; count: number }[];
};
