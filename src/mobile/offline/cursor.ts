import { MMKV } from "react-native-mmkv";
const kv = new MMKV();
const KEY = "offline.cursor";
export const getCursor = () => kv.getString(KEY) ?? "";
export const setCursor = (c: string) => kv.set(KEY, c);
