export type Entity =
  | "price_alert"
  | "shop_ticket"
  | "shop_ticket_status";

export type MutationOp = "insert" | "update" | "delete";

export type ClientMutation = {
  mutation_id: string;               // ULID/UUID generated client-side
  user_id: string;                   // required for authz
  entity: Entity;
  op: MutationOp;
  data: any;                         // entity payload (see below)
  client_ts?: string;                // optional
};

export type SyncQuery = {
  since?: string;                    // ISO (exclusive lower bound)
  user_id: string;                   // to fetch only this user's private data
  areas?: string;                    // comma-separated ADM2 codes (optional filter for shops)
  crops?: string;                    // comma-separated crop keys (optional)
};

export type SyncBundle = {
  server_time: string;
  next_since: string;                // cursor for next sync
  refs: {
    shops?: any[];
    product_classes?: any[];
  };
  user: {
    price_alerts?: any[];
    shop_tickets?: any[];
  };
};
