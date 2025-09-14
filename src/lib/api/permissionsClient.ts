import { PermissionRecord } from "../../hooks/usePermissions";
const API = process.env.EXPO_PUBLIC_API_BASE || "https://your.api";

export async function postRequestLocation(): Promise<PermissionRecord> {
  const res = await fetch(`${API}/api/permissions/location`, { method: "POST" });
  return await res.json();
}
export async function getPermissionStatus(): Promise<PermissionRecord | null> {
  const res = await fetch(`${API}/api/permissions/status`);
  if (!res.ok) return null;
  return await res.json();
}
