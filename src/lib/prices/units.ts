import { Database } from "sqlite";
import { getFxRate } from "../fx/repo";

/**
 * Supported currencies + mass units
 * - Currencies: ISO 4217 strings, e.g., "USD", "THB"
 * - Mass units (denominator): "kg", "g", "lb", "cwt" (US), "mt" (metric tonne)
 *
 * Aliases normalized to:
 *   kg: "kg"
 *   g : "g"
 *   lb: "lb" | "lbs" | "pound" | "pounds"
 *   cwt: "cwt" (US hundredweight, 100 lb)
 *   mt: "mt" | "tonne" | "metric_ton" | "t" | "ตัน" | "ton (metric)" | "MT"
 *
 * Notes:
 * - We adopt **metric tonne (mt = 1,000 kg)**.
 * - US cwt = 45.359237 kg; 1 lb = 0.45359237 kg.
 */

export type Currency = string; // e.g., "USD" | "THB"
export type Denom = "kg" | "g" | "lb" | "cwt" | "mt";
export type PriceUnit = `${Currency}/${Denom}`;

export const MASS_IN_KG: Record<Denom, number> = {
  g:   0.001,
  kg:  1,
  lb:  0.45359237,
  cwt: 45.359237,      // 100 lb (US)
  mt:  1000,           // metric tonne
};

const CURRENCY_RE = /^[A-Z]{3}$/;

export function normalizeDenomToken(raw: string): Denom {
  const s = raw.trim().toLowerCase();
  if (["kg", "กก.", "กก", "kilogram", "kilograms"].includes(s)) return "kg";
  if (["g", "gram", "grams"].includes(s)) return "g";
  if (["lb", "lbs", "pound", "pounds"].includes(s)) return "lb";
  if (["cwt", "hundredweight"].includes(s)) return "cwt";
  if (["mt", "t", "tonne", "metric_ton", "metric-ton", "ตัน", "ton (metric)"].includes(s)) return "mt";
  throw new Error(`Unsupported mass unit: ${raw}`);
}

/** Accepts "USD/MT", "usd/tonne", "THB/kg", "usd/lb", "USD/CWT" etc. */
export function parsePriceUnit(u: string): { cur: Currency; denom: Denom; asString: PriceUnit } {
  const s = u.replace(/\s+/g, "").toUpperCase();
  if (!s.includes("/")) throw new Error(`Invalid unit: ${u}`);
  const [cur, denomRaw] = s.split("/");
  if (!CURRENCY_RE.test(cur)) throw new Error(`Invalid currency: ${cur}`);
  const denom = normalizeDenomToken(denomRaw);
  const asString = `${cur}/${denom}` as PriceUnit;
  return { cur, denom, asString };
}

/** Pretty-print a normalized unit back to "CUR/denom" (lowercase denom). */
export function formatUnit(cur: Currency, denom: Denom): PriceUnit {
  return `${cur}/${denom}` as PriceUnit;
}

/** Convert (min,max, unitFrom) → target unit (with FX + mass conversion) */
export async function convertPriceRange(
  db: Database,
  min: number,
  max: number,
  unitFrom: string,      // e.g., "USD/MT"
  unitTo: string,        // e.g., "THB/kg"
  fxDateISO?: string     // use observed_at or bucket time for FX lookup
): Promise<{ min: number; max: number; unit: PriceUnit }> {
  const from = parsePriceUnit(unitFrom);
  const to   = parsePriceUnit(unitTo);

  // 1) Currency conversion (if needed)
  let vMin = min;
  let vMax = max;
  if (from.cur !== to.cur) {
    const rate = await getFxRate(db, from.cur, to.cur, fxDateISO);
    if (!rate || rate <= 0) throw new Error(`FX rate missing: ${from.cur}->${to.cur} (${fxDateISO ?? "latest"})`);
    vMin *= rate;
    vMax *= rate;
  }

  // 2) Denominator conversion (mass)
  if (from.denom !== to.denom) {
    const fromKg = MASS_IN_KG[from.denom];
    const toKg   = MASS_IN_KG[to.denom];
    const factor = fromKg / toKg; // e.g., USD/MT → USD/kg = divide by 1000 (1000/1)
    vMin = vMin * (toKg / fromKg); // equivalently divide by 1000 when mt→kg
    vMax = vMax * (toKg / fromKg);
  }

  return { min: vMin, max: vMax, unit: formatUnit(to.cur, to.denom) };
}

/** Rounds for display (kg/lb/g: 2 decimals; mt/cwt: 1 decimal by default). */
export function roundForDisplay(x: number, unit: string) {
  const { denom } = parsePriceUnit(unit);
  const decimals = (denom === "kg" || denom === "lb" || denom === "g") ? 2 : 1;
  const p = Math.pow(10, decimals);
  return Math.round(x * p) / p;
}

/** List of commonly used output units you can whitelist in the API. */
export const COMMON_OUTPUT_UNITS: PriceUnit[] = [
  "THB/kg", "THB/mt",
  "USD/mt", "USD/kg", "USD/lb", "USD/cwt",
];

/** Convert a single price value */
export async function convertPrice(
  db: Database,
  price: number,
  unitFrom: string,
  unitTo: string,
  fxDateISO?: string
): Promise<number> {
  const result = await convertPriceRange(db, price, price, unitFrom, unitTo, fxDateISO);
  return roundForDisplay(result.min, result.unit);
}

/** Get conversion info for debugging */
export async function getConversionInfo(
  db: Database,
  unitFrom: string,
  unitTo: string,
  fxDateISO?: string
): Promise<{
  fromUnit: PriceUnit;
  toUnit: PriceUnit;
  currencyConversion: { from: Currency; to: Currency; rate: number | null };
  massConversion: { from: Denom; to: Denom; factor: number };
  fxDate: string;
}> {
  const from = parsePriceUnit(unitFrom);
  const to = parsePriceUnit(unitTo);
  
  const rate = await getFxRate(db, from.cur, to.cur, fxDateISO);
  
  const fromKg = MASS_IN_KG[from.denom];
  const toKg = MASS_IN_KG[to.denom];
  const factor = toKg / fromKg;
  
  return {
    fromUnit: from.asString,
    toUnit: to.asString,
    currencyConversion: {
      from: from.cur,
      to: to.cur,
      rate
    },
    massConversion: {
      from: from.denom,
      to: to.denom,
      factor
    },
    fxDate: fxDateISO ?? new Date().toISOString()
  };
}

/** Validate if conversion is possible */
export async function canConvert(
  db: Database,
  unitFrom: string,
  unitTo: string,
  fxDateISO?: string
): Promise<{ possible: boolean; reason?: string }> {
  try {
    const from = parsePriceUnit(unitFrom);
    const to = parsePriceUnit(unitTo);
    
    if (from.cur !== to.cur) {
      const rate = await getFxRate(db, from.cur, to.cur, fxDateISO);
      if (!rate || rate <= 0) {
        return { 
          possible: false, 
          reason: `FX rate missing: ${from.cur}->${to.cur} (${fxDateISO ?? "latest"})` 
        };
      }
    }
    
    return { possible: true };
  } catch (error) {
    return { 
      possible: false, 
      reason: error instanceof Error ? error.message : "Invalid unit format" 
    };
  }
}

/** Get supported conversion units */
export function getSupportedUnits(): PriceUnit[] {
  return COMMON_OUTPUT_UNITS;
}

/** Check if a unit is supported */
export function isSupportedUnit(unit: string): unit is PriceUnit {
  try {
    const parsed = parsePriceUnit(unit);
    return COMMON_OUTPUT_UNITS.includes(parsed.asString);
  } catch {
    return false;
  }
}

/** Get mass conversion factor between two units */
export function getMassConversionFactor(fromUnit: string, toUnit: string): number {
  const from = parsePriceUnit(fromUnit);
  const to = parsePriceUnit(toUnit);
  
  const fromKg = MASS_IN_KG[from.denom];
  const toKg = MASS_IN_KG[to.denom];
  
  return toKg / fromKg;
}

/** Get currency conversion rate */
export async function getCurrencyRate(
  db: Database,
  fromCurrency: Currency,
  toCurrency: Currency,
  fxDateISO?: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1;
  return await getFxRate(db, fromCurrency, toCurrency, fxDateISO);
}
