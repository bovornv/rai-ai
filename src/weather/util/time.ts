// Time utilities for weather caching

export function ttlMinutesFresh(iso: string, ttlMin: number): boolean {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return (Date.now() - t) <= ttlMin * 60_000;
}

export function nowISO() { 
  return new Date().toISOString(); 
}

export function isOffline(): boolean {
  return !navigator.onLine;
}
