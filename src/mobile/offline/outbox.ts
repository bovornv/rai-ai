import 'react-native-get-random-values';
import { ulid } from "ulid";
import { MMKV } from "react-native-mmkv";
export const mmkv = new MMKV();

export type Mutation = {
  mutation_id: string;
  user_id: string;
  entity: "price_alert"|"shop_ticket"|"shop_ticket_status";
  op: "insert"|"update"|"delete";
  data: any;
  client_ts: string;
};

const KEY = "offline.outbox";

export function getOutbox(): Mutation[] {
  const raw = mmkv.getString(KEY); if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
export function setOutbox(list: Mutation[]) { mmkv.set(KEY, JSON.stringify(list)); }
export function queueMutation(m: Omit<Mutation,"mutation_id"|"client_ts"> & Partial<Pick<Mutation,"mutation_id"|"client_ts">>) {
  const list = getOutbox();
  list.push({ ...m, mutation_id: m.mutation_id ?? ulid(), client_ts: m.client_ts ?? new Date().toISOString() });
  setOutbox(list);
}
export function popBatch(n=25) {
  const list = getOutbox();
  const batch = list.slice(0,n);
  setOutbox(list.slice(n));
  return batch;
}
export function prepend(list: Mutation[]) {
  const cur = getOutbox();
  setOutbox([...list, ...cur]);
}
