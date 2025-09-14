import { Hour, RecentRain, SprayVerdict, SprayVerdictLevel } from "./types";
import { remoteConfigService } from "../services/remoteConfigService";

export type SprayProfile = {
  WIND_OK_MS: number;
  WIND_CAUTION_MS: number;
  POP_HIGH: number;
  POP_MED: number;
  RAIN_SOON_MM: number;
  RAIN_NOW_MM: number;
  RECENT_WET_MM: number;
  RH_WET: number;
  DRY_BUFFER_H: number;
  HORIZON_HOURS: number;
};

export const defaultProfileRice: SprayProfile = {
  HORIZON_HOURS: 12,
  WIND_OK_MS: 4.0,
  WIND_CAUTION_MS: 6.0,
  POP_HIGH: 0.6,
  POP_MED: 0.3,
  RAIN_SOON_MM: 0.5,
  RAIN_NOW_MM: 0.1,
  RECENT_WET_MM: 1.0,
  RH_WET: 90,
  DRY_BUFFER_H: 2,
};

export const defaultProfileDurian: SprayProfile = {
  ...defaultProfileRice,
  WIND_OK_MS: 3.5,
  WIND_CAUTION_MS: 5.5,
};

export function sprayWindowDecision(
  hours: Hour[],
  recent: RecentRain | undefined,
  crop: 'rice' | 'durian' = 'rice',
  uncertaintyPenalty = false
): SprayVerdict {
  // Get profile from remote config
  const profile = remoteConfigService.getSprayProfile(crop);
  const next12 = (hours ?? []).slice(0, profile.HORIZON_HOURS);
  if (next12.length < 3) {
    return verdict("CAUTION", "ข้อมูลพยากรณ์ไม่พอ", "Data insufficient", 0.3);
  }

  const now = next12[0];
  if ((now.rain_mm ?? 0) >= profile.RAIN_NOW_MM) {
    return verdict("DON'T", "ฝนตกอยู่ เลี่ยงฉีดพ่น", "Raining now", 1.0);
  }
  if ((recent?.rain_mm_last3h ?? 0) >= profile.RECENT_WET_MM) {
    return verdict("DON'T", "ใบยังเปียก (เพิ่งมีฝน)", "Leaf wet from recent rain", 1.0);
  }

  const next3 = next12.slice(0, 3);
  const maxWind3 = Math.max(
    ...next3.map(h => h.wind_ms ?? 0),
    ...next3.map(h => h.gust_ms ?? 0)
  );
  if (maxWind3 > profile.WIND_CAUTION_MS) {
    return verdict("DON'T", "ลมแรงเกินไป (>6 m/s)", "Wind too strong", 1.0);
  }
  const windySoon = maxWind3 > profile.WIND_OK_MS;

  const next6 = next12.slice(0, 6);
  const rainWithin6mm = sum(next6.map(h => h.rain_mm ?? approxRainFromPOP(h.pop)));
  const highPOPWithin6 = next6.some(h => (h.pop ?? 0) >= profile.POP_HIGH);
  if (rainWithin6mm >= profile.RAIN_SOON_MM || highPOPWithin6) {
    return verdict("DON'T", "คาดว่ามีฝนภายใน 6 ชม.", "Rain expected within 6h", 1.0);
  }

  const dryBufferOK = next12.slice(0, profile.DRY_BUFFER_H).every(h =>
    (h.rain_mm ?? 0) <= 0 && (h.pop ?? 0) < 0.2
  );
  if (!dryBufferOK) {
    return verdict("DON'T", "ไม่มีช่วงแห้งพอหลังฉีด", "No dry buffer after spray", 1.0);
  }

  const veryHumid = (now.rh ?? 0) >= profile.RH_WET;
  let level: SprayVerdictLevel = (windySoon || veryHumid) ? "CAUTION" : "GOOD";

  if (uncertaintyPenalty && level === "GOOD") {
    level = "CAUTION";
  }

  // Find next safe hour
  const nextSafeHour = findNextSafeHour(next12, profile);

  if (level === "GOOD") {
    return verdict("GOOD", "ฉีดพ่นได้ ✅", "Good to spray", 0.9, nextSafeHour);
  }
  return verdict("CAUTION",
    windySoon ? "ลมเริ่มแรง ระวังละอองฟุ้ง" : "ความชื้นสูง การแห้งตัวช้า",
    windySoon ? "Wind increasing" : "High humidity",
    0.8,
    nextSafeHour
  );
}

function approxRainFromPOP(pop?: number) { 
  return (pop ?? 0) * 1.0; 
}

function sum(a: number[]) { 
  return a.reduce((x, y) => x + y, 0); 
}

function findNextSafeHour(hours: Hour[], profile: SprayProfile): string | undefined {
  // Look for first 2-hour block with low wind & no rain
  for (let i = 0; i < hours.length - 1; i++) {
    const block = hours.slice(i, i + 2);
    const maxWind = Math.max(...block.map(h => h.wind_ms ?? 0), ...block.map(h => h.gust_ms ?? 0));
    const hasRain = block.some(h => (h.rain_mm ?? 0) > 0 || (h.pop ?? 0) > profile.POP_MED);
    
    if (maxWind <= profile.WIND_OK_MS && !hasRain) {
      return block[0].timeISO;
    }
  }
  return undefined;
}

function verdict(
  level: SprayVerdictLevel, 
  reason_th: string, 
  reason_en: string, 
  confidence: number = 0.8,
  next_safe_hour?: string
): SprayVerdict {
  return { level, reason_th, reason_en, confidence, next_safe_hour };
}
