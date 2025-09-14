export type Crop = "rice" | "durian";

export type PriceUnit = "USD/MT" | "THB/kg";
export type Currency = "USD" | "THB";
export type PriceSource = "trea" | "talaadthai" | "usda" | "manual";
export type BuyerType = "exporter" | "packhouse" | "mill" | "coop" | "trader";
export type VerifiedSource = "trea" | "doa" | "gacc" | "manual";

export type NormalizedQuote = {
  crop: Crop;
  variety?: string;
  grade?: string;
  size?: string;
  unit: PriceUnit;
  price_min: number;
  price_max: number;
  currency: Currency;
  source: PriceSource;
  market_key?: string;          // e.g., "talaadthai_pathumthani" (null for FOB)
  observed_at: string;          // ISO (UTC)
  raw_text?: string;            // original scraped text for audit
};

export type Buyer = {
  id?: number;
  crop: Crop;
  name_th?: string;
  name_en: string;
  type: BuyerType;
  province?: string;
  district?: string;
  address?: string;
  phone?: string;
  line_id?: string;
  website?: string;
  email?: string;
  verified_source: VerifiedSource;
  last_checked_at: string;
  created_at?: string;
  updated_at?: string;
};

export type Market = {
  id?: number;
  key: string;
  name: string;
  location_code?: string;
};

export type PriceAlert = {
  id?: number;
  user_id: string;
  crop: Crop;
  variety?: string;
  grade?: string;
  size?: string;
  market_key?: string;
  target_price_min: number;
  target_price_max: number;
  unit: PriceUnit;
  currency: Currency;
  is_active: boolean;
  created_at: string;
  triggered_at?: string;
};

// Simple helpers
export const nowIso = () => new Date().toISOString();

export function toKey(s: string | undefined | null): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "");
}

export function parsePriceRange(s: string): [number, number] {
  // Accept "610-620" or "610 – 620" or "620" or "80-100 บาท/กก."
  const clean = s.replace(/[^\d\-–.]/g, "");
  if (!clean) return [NaN, NaN];
  
  const parts = clean.split(/[-–]/);
  if (parts.length === 1) {
    const v = Number(parts[0]);
    return [v, v];
  }
  
  const a = Number(parts[0]);
  const b = Number(parts[1]);
  return [Math.min(a, b), Math.max(a, b)];
}

export function normalizeVariety(varietyText: string, crop: Crop): string {
  const text = varietyText.toLowerCase().trim();
  
  if (crop === "rice") {
    if (/mali|hom mali|jasmine/i.test(text)) return "hom_mali";
    if (/glutinous|sticky/i.test(text)) return "glutinous";
    if (/brown|red/i.test(text)) return "brown_rice";
    return toKey(text);
  }
  
  if (crop === "durian") {
    if (/monthong|หมอนทอง/i.test(text)) return "monthong";
    if (/chanee|ชะนี/i.test(text)) return "chanee";
    if (/kanyao|ก้านยาว/i.test(text)) return "kanyao";
    if (/kradum|กระดุม/i.test(text)) return "kradum";
    return toKey(text);
  }
  
  return toKey(text);
}

export function normalizeSize(sizeText: string, crop: Crop): string {
  const text = sizeText.toLowerCase().trim();
  
  if (crop === "durian") {
    if (/large|l|ใหญ่/i.test(text)) return "L";
    if (/medium|m|กลาง/i.test(text)) return "M";
    if (/small|s|เล็ก/i.test(text)) return "S";
    if (/\d+-\d+/.test(text)) return text; // Keep numeric ranges like "80-100"
    return toKey(text);
  }
  
  return toKey(text);
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  exchangeRate: number = 1
): number {
  if (from === to) return amount;
  
  // Default exchange rates (should be fetched from API in production)
  const rates: Record<string, number> = {
    "USD_THB": 35.0,  // 1 USD = 35 THB (example)
    "THB_USD": 1/35.0
  };
  
  const rateKey = `${from}_${to}`;
  const rate = rates[rateKey] || exchangeRate;
  
  return amount * rate;
}

export function formatPrice(price: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${price.toFixed(2)}`;
  }
  if (currency === "THB") {
    return `฿${price.toFixed(0)}`;
  }
  return `${price.toFixed(2)} ${currency}`;
}

export function formatPriceRange(min: number, max: number, currency: Currency): string {
  if (min === max) {
    return formatPrice(min, currency);
  }
  return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
}

export function getSourceDisplayName(source: PriceSource): string {
  const names: Record<PriceSource, string> = {
    "trea": "TREA",
    "talaadthai": "ตลาดไท",
    "usda": "USDA",
    "manual": "Manual"
  };
  return names[source] || source;
}

export function getBuyerTypeDisplayName(type: BuyerType): string {
  const names: Record<BuyerType, string> = {
    "exporter": "ผู้ส่งออก",
    "packhouse": "โรงบรรจุ",
    "mill": "โรงสี",
    "coop": "สหกรณ์",
    "trader": "พ่อค้า"
  };
  return names[type] || type;
}

export function getVerifiedSourceDisplayName(source: VerifiedSource): string {
  const names: Record<VerifiedSource, string> = {
    "trea": "TREA",
    "doa": "กรมวิชาการเกษตร",
    "gacc": "GACC",
    "manual": "Manual"
  };
  return names[source] || source;
}

export function isRecentUpdate(observedAt: string, maxHours: number = 24): boolean {
  const observed = new Date(observedAt);
  const now = new Date();
  const diffHours = (now.getTime() - observed.getTime()) / (1000 * 60 * 60);
  return diffHours <= maxHours;
}

export function getUpdateStatus(observedAt: string): {
  status: "fresh" | "stale" | "outdated";
  hoursAgo: number;
  message: string;
} {
  const observed = new Date(observedAt);
  const now = new Date();
  const diffHours = (now.getTime() - observed.getTime()) / (1000 * 60 * 60);
  
  if (diffHours <= 6) {
    return {
      status: "fresh",
      hoursAgo: Math.round(diffHours),
      message: `อัปเดตล่าสุด ${Math.round(diffHours)} ชั่วโมงที่แล้ว`
    };
  }
  
  if (diffHours <= 24) {
    return {
      status: "stale",
      hoursAgo: Math.round(diffHours),
      message: `อัปเดต ${Math.round(diffHours)} ชั่วโมงที่แล้ว`
    };
  }
  
  return {
    status: "outdated",
    hoursAgo: Math.round(diffHours),
    message: `อัปเดตล่าสุด ${Math.round(diffHours / 24)} วันที่แล้ว`
  };
}
