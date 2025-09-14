/**
 * TalaadThai wholesale durian prices (Monthong, etc.)
 * Source: public product/price page(s) – HTML blocks show today's range in THB/kg
 * Output: NormalizedQuote[] with unit THB/kg, source="talaadthai", market_key="talaadthai_pathumthani"
 *
 * TODO: Open the TalaadThai durian page in a browser, Inspect, and set:
 *   - TALAADTHAI_URL (Monthong page, or listing)
 *   - CSS selectors inside parseTalaadThaiHtml()
 */
import { NormalizedQuote, nowIso, toKey, normalizeVariety, normalizeSize, parsePriceRange } from "../types";
import { ensureMarket, upsertMany } from "../repo";
import { Database } from "sqlite";
import * as cheerio from "cheerio";

const TALAADTHAI_URL = "https://www.talaadthai.com/price/durian"; // example; confirm exact product URL
const MARKET_KEY = "talaadthai_pathumthani";
const MARKET_NAME = "TalaadThai (Pathum Thani)";

const UA = "RaiAI/1.0 (+contact: ops@yourdomain.example)";

export async function fetchTalaadThaiHtml(): Promise<string> {
  const res = await fetch(TALAADTHAI_URL, { 
    headers: { 
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1"
    } as any 
  });
  
  if (!res.ok) {
    throw new Error(`TalaadThai HTTP ${res.status}: ${res.statusText}`);
  }
  
  return await res.text();
}

function parseTalaadThaiHtml(html: string): NormalizedQuote[] {
  const $ = cheerio.load(html);
  const observedAt = nowIso();

  // TODO: adjust selectors based on actual TalaadThai page structure
  // Look for elements containing variety (e.g., Monthong) + size (L/M/S) + price range "80-100"
  const cards = $(".price-card, .product-card, .item-card, .durian-item, .product-item").toArray();
  
  // If no specific cards found, try looking for any elements with price-like content
  const fallbackElements = cards.length === 0 
    ? $("div, section, article").filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes("monthong") || text.includes("หมอนทอง") || 
               text.includes("durian") || text.includes("ทุเรียน") ||
               (text.includes("บาท") && text.match(/\d+[-–]\d+/));
      }).toArray()
    : cards;

  const out: NormalizedQuote[] = [];
  
  for (const el of fallbackElements) {
    const root = $(el);
    const text = root.text().toLowerCase();

    // Skip if doesn't contain durian-related content
    if (!text.includes("monthong") && !text.includes("หมอนทอง") && 
        !text.includes("durian") && !text.includes("ทุเรียน")) {
      continue;
    }

    // Extract variety
    let varietyText = "";
    const varietySelectors = [
      ".variety", ".title", "h1", "h2", "h3", "h4", ".name", ".product-name"
    ];
    
    for (const selector of varietySelectors) {
      const varietyEl = root.find(selector).first();
      if (varietyEl.length && varietyEl.text().trim()) {
        varietyText = varietyEl.text().trim();
        break;
      }
    }
    
    // Fallback: extract from main text
    if (!varietyText) {
      const monthongMatch = text.match(/(monthong|หมอนทอง|ทุเรียน\s+\w+)/i);
      if (monthongMatch) {
        varietyText = monthongMatch[1];
      }
    }

    if (!varietyText) continue;
    
    const variety = normalizeVariety(varietyText, "durian");

    // Extract size/grade
    let sizeText = "";
    const sizeSelectors = [
      ".size", ".badge", ".grade", ".class", ".category"
    ];
    
    for (const selector of sizeSelectors) {
      const sizeEl = root.find(selector).first();
      if (sizeEl.length && sizeEl.text().trim()) {
        sizeText = sizeEl.text().trim();
        break;
      }
    }
    
    // Fallback: look for size indicators in text
    if (!sizeText) {
      const sizeMatch = text.match(/(large|l|ใหญ่|medium|m|กลาง|small|s|เล็ก|\d+-\d+)/i);
      if (sizeMatch) {
        sizeText = sizeMatch[1];
      }
    }

    const size = normalizeSize(sizeText, "durian");

    // Extract price range
    let priceText = "";
    const priceSelectors = [
      ".price-range", ".price", ".value", ".cost", ".amount"
    ];
    
    for (const selector of priceSelectors) {
      const priceEl = root.find(selector).first();
      if (priceEl.length && priceEl.text().trim()) {
        priceText = priceEl.text().trim();
        break;
      }
    }
    
    // Fallback: look for price patterns in text
    if (!priceText) {
      const priceMatch = text.match(/(\d+[-–]\d+)\s*บาท/);
      if (priceMatch) {
        priceText = priceMatch[1];
      }
    }

    if (!priceText) continue;

    const [min, max] = parsePriceRange(priceText);
    if (!isFinite(min) || !isFinite(max) || min <= 0 || max <= 0) continue;

    // Ensure reasonable price range for durian (THB/kg)
    if (min < 20 || max > 500) continue;

    out.push({
      crop: "durian",
      variety,
      grade: undefined,
      size,
      unit: "THB/kg",
      price_min: min,
      price_max: max,
      currency: "THB",
      source: "talaadthai",
      market_key: MARKET_KEY,
      observed_at: observedAt,
      raw_text: `${varietyText} ${sizeText ? `(${sizeText})` : ''}: ${priceText} บาท/กก.`
    });
  }

  return out;
}

export async function ingestTalaadThai(db: Database): Promise<number> {
  try {
    console.log("🥭 Fetching TalaadThai durian prices...");
    
    // Ensure market exists
    const marketId = await ensureMarket(db, MARKET_KEY, MARKET_NAME, "TH-13"); // Pathum Thani province code
    if (!marketId) {
      throw new Error("Failed to ensure TalaadThai market");
    }

    const html = await fetchTalaadThaiHtml();
    const quotes = parseTalaadThaiHtml(html);
    
    if (!quotes.length) {
      throw new Error("TalaadThai: no quotes parsed");
    }
    
    await upsertMany(db, quotes);
    console.log(`✅ TalaadThai: ${quotes.length} durian price quotes ingested`);
    return quotes.length;
  } catch (error) {
    console.error("❌ TalaadThai ingestion failed:", error);
    throw error;
  }
}

// Additional helper functions for TalaadThai data
export async function getTalaadThaiPriceHistory(db: Database, days = 30): Promise<NormalizedQuote[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const rows = await db.all(`
    SELECT p.*, m.key as market_key
    FROM price_quotes p
    JOIN markets m ON p.market_id = m.id
    WHERE p.source = 'talaadthai' 
      AND p.observed_at >= ?
    ORDER BY p.observed_at DESC
  `, cutoffDate.toISOString());
  
  return rows.map(row => ({
    crop: row.crop,
    variety: row.variety,
    grade: row.grade,
    size: row.size,
    unit: row.unit,
    price_min: row.price_min,
    price_max: row.price_max,
    currency: row.currency,
    source: row.source,
    market_key: row.market_key,
    observed_at: row.observed_at,
    raw_text: row.raw_text
  }));
}

export async function getTalaadThaiLatestPrices(db: Database): Promise<NormalizedQuote[]> {
  const rows = await db.all(`
    SELECT p.*, m.key as market_key
    FROM price_quotes p
    JOIN markets m ON p.market_id = m.id
    WHERE p.source = 'talaadthai'
    ORDER BY p.observed_at DESC 
    LIMIT 20
  `);
  
  return rows.map(row => ({
    crop: row.crop,
    variety: row.variety,
    grade: row.grade,
    size: row.size,
    unit: row.unit,
    price_min: row.price_min,
    price_max: row.price_max,
    currency: row.currency,
    source: row.source,
    market_key: row.market_key,
    observed_at: row.observed_at,
    raw_text: row.raw_text
  }));
}

// Validation function to check if TalaadThai data looks reasonable
export function validateTalaadThaiData(quotes: NormalizedQuote[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (quotes.length === 0) {
    errors.push("No quotes found");
    return { isValid: false, errors, warnings };
  }
  
  // Check for reasonable price ranges
  for (const quote of quotes) {
    if (quote.currency !== "THB") {
      errors.push(`Invalid currency: ${quote.currency}`);
    }
    
    if (quote.unit !== "THB/kg") {
      errors.push(`Invalid unit: ${quote.unit}`);
    }
    
    if (quote.price_min < 20 || quote.price_max > 500) {
      warnings.push(`Unusual price range: ${quote.price_min}-${quote.price_max} THB/kg`);
    }
    
    if (quote.price_min > quote.price_max) {
      errors.push(`Invalid price range: min (${quote.price_min}) > max (${quote.price_max})`);
    }
  }
  
  // Check for common durian varieties
  const varieties = new Set(quotes.map(q => q.variety).filter(Boolean));
  const expectedVarieties = ["monthong", "chanee", "kanyao", "kradum"];
  const hasExpectedVariety = expectedVarieties.some(v => varieties.has(v));
  
  if (!hasExpectedVariety) {
    warnings.push("No common durian varieties found (monthong, chanee, kanyao, kradum)");
  }
  
  // Check for size information
  const sizes = new Set(quotes.map(q => q.size).filter(Boolean));
  if (sizes.size === 0) {
    warnings.push("No size information found");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
