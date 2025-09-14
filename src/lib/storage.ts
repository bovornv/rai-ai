import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({ id: "rai-permissions" });

export const kv = {
  getJSON<T>(key: string): T | null {
    const raw = storage.getString(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  setJSON(key: string, val: unknown) {
    storage.set(key, JSON.stringify(val));
  },
  getString(key: string) { return storage.getString(key) ?? null; },
  setString(key: string, val: string) { storage.set(key, val); },
  delete(key: string) { storage.delete(key); }
};
