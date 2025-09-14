import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCursor, setCursor } from "./cursor";
import { popBatch, prepend, getOutbox } from "./outbox";

const API = process.env.EXPO_PUBLIC_API_URL || "https://your.api";

async function syncOnce(user_id: string, params: { areas?: string[]; crops?: string[] }) {
  const since = encodeURIComponent(getCursor());
  const url = `${API}/api/cache/sync?user_id=${encodeURIComponent(user_id)}&since=${since}` +
              `${params.areas?.length ? `&areas=${params.areas.join(",")}` : ""}` +
              `${params.crops?.length ? `&crops=${params.crops.join(",")}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`sync ${res.status}`);
  return res.json() as Promise<{
    server_time: string; next_since: string;
    refs: { shops?: any[]; product_classes?: any[] };
    user: { price_alerts?: any[]; shop_tickets?: any[] };
  }>;
}

async function pushOutbox() {
  const batch = popBatch(25);
  if (!batch.length) return { pushed: 0, results: [] as any[] };
  const res = await fetch(`${API}/api/cache/queue`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mutations: batch })
  });
  if (!res.ok) { prepend(batch); throw new Error(`queue ${res.status}`); }
  const j = await res.json();
  // on partial error, requeue failures
  const failed = (j.results as any[]).filter(x => x.status !== "applied").map((_, i) => batch[i]);
  if (failed.length) prepend(failed);
  return { pushed: batch.length - failed.length, results: j.results };
}

/** Call in app focus or pull-to-refresh */
export function useOfflineSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { user_id: string; areas?: string[]; crops?: string[] }) => {
      // 1) push outbox first
      try { await pushOutbox(); } catch {}
      // 2) pull deltas
      const bundle = await syncOnce(args.user_id, { areas: args.areas, crops: args.crops });
      // 3) merge into local stores (you likely use realm/sqlite/mmkv per entity)
      // Replace with your repo-layer upserts:
      //   upsertMany('shops', bundle.refs.shops)
      //   upsertMany('product_classes', bundle.refs.product_classes)
      //   upsertMany('price_alerts', bundle.user.price_alerts)
      //   upsertMany('shop_tickets', bundle.user.shop_tickets)
      setCursor(bundle.next_since);
      // 4) invalidate queries if needed
      qc.invalidateQueries({ queryKey: ["price_alerts"] });
      qc.invalidateQueries({ queryKey: ["shop_tickets"] });
      return bundle;
    }
  });
}

/** Fire-and-forget manual flush (e.g., NetworkStatus ONLINE) */
export function useOutboxFlush() {
  return useMutation({ mutationFn: () => pushOutbox() });
}

/** Helper: enqueue common mutations */
export async function enqueuePriceAlertUpsert(m: {
  user_id: string; id: string; crop: "rice"|"durian"; market_key?: string; variety?: string; size?: string;
  target_min: number; target_max: number; unit: string; active: boolean; updated_at: string;
}) {
  const body = {
    mutation_id: undefined, user_id: m.user_id, entity: "price_alert" as const, op: "update" as const,
    data: { ...m }
  };
  const { queueMutation } = await import("./outbox"); queueMutation(body as any);
}
