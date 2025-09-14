/**
 * Thai Rice Exporters Association (TREA) – FOB prices
 * Source: TREA price bulletin page (HTML table)
 * Output: NormalizedQuote[] with unit USD/MT, source="trea", market_key=undefined
 *
 * TODO: Open the TREA price page in a browser, Inspect the table, and update:
 *   - TREA_URL
 *   - CSS selectors inside parseTreaHtml()
 *
 * IMPORTANT: Respect robots/ToS; cache; keep a low frequency (weekly/daily).
 */
import { NormalizedQuote, nowIso, toKey, normalizeVariety, parsePriceRange } from "../types";
import { upsertMany } from "../repo";
import { Database } from "sqlite";
import * as cheerio from "cheerio";

const TREA_URL = "https://www.thairiceexporters.or.th/PricesEng.html"; // example; confirm the exact URL used

const UA = "RaiAI/1.0 (+contact: ops@yourdomain.example)";

export async function fetchTreaHtml(): Promise<string> {
  const res = await fetch(TREA_URL, { 
    headers: { 
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1"
    } as any 
  });
  
  if (!res.ok) {
    throw new Error(`TREA HTTP ${res.status}: ${res.statusText}`);
  }
  
  return await res.text();
}

// Parse a typical FOB table like:
// Grade | This Week ($/MT) | Last Week | ...
function parseTreaHtml(html: string): NormalizedQuote[] {
  const $ = cheerio.load(html);
  const observedAt = nowIso();

  // TODO: adjust selectors based on actual TREA page structure
  // Look for tables containing price data
  const tables = $("table").toArray();
  let targetTable = tables[0]; // Default to first table
  
  // Try to find the price table by looking for common indicators
  for (const table of tables) {
    const tableText = $(table).text().toLowerCase();
    if (tableText.includes("fob") || tableText.includes("price") || tableText.includes("grade")) {
      targetTable = table;
      break;
    }
  }

  const rows = $(targetTable).find("tr");
  const out: NormalizedQuote[] = [];

  rows.each((i, tr) => {
    if (i === 0) return; // Skip header row
    
    const tds = $(tr).find("td");
    if (tds.length < 2) return;

    // Extract grade/variety from first column
    const gradeText = $(tds[0]).text().trim();
    if (!gradeText || gradeText.toLowerCase().includes("grade")) return;

    // Look for price in subsequent columns
    let priceText = "";
    let priceColumn = 1;
    
    // Try to find the price column
    for (let j = 1; j < tds.length; j++) {
      const cellText = $(tds[j]).text().trim();
      if (cellText.match(/\d+[-–]\d+/) || cellText.match(/\d+\.\d+/)) {
        priceText = cellText;
        priceColumn = j;
        break;
      }
    }

    if (!priceText) return;

    // Normalize grade & variety
    const variety = normalizeVariety(gradeText, "rice");
    const grade = toKey(gradeText);

    // Parse price range
    const [min, max] = parsePriceRange(priceText);
    if (!isFinite(min) || !isFinite(max) || min <= 0 || max <= 0) return;

    // Ensure reasonable price range for rice FOB (USD/MT)
    if (min < 200 || max > 2000) return;

    out.push({
      crop: "rice",
      variety,
      grade,
      size: undefined,
      unit: "USD/MT",
      price_min: min,
      price_max: max,
      currency: "USD",
      source: "trea",
      market_key: undefined,   // FOB, not a local market
      observed_at: observedAt,
      raw_text: `${gradeText}: ${priceText}`
    });
  });

  return out;
}

export async function ingestTrea(db: Database): Promise<number> {
  try {
    console.log("🌾 Fetching TREA rice prices...");
    const html = await fetchTreaHtml();
    const quotes = parseTreaHtml(html);
    
    if (!quotes.length) {
      throw new Error("TREA: no quotes parsed");
    }
    
    await upsertMany(db, quotes);
    console.log(`✅ TREA: ${quotes.length} rice price quotes ingested`);
    return quotes.length;
  } catch (error) {
    console.error("❌ TREA ingestion failed:", error);
    throw error;
  }
}

// Additional helper functions for TREA data
export async function getTreaPriceHistory(db: Database, days = 30): Promise<NormalizedQuote[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const rows = await db.all(`
    SELECT * FROM price_quotes 
    WHERE source = 'trea' 
      AND observed_at >= ?
    ORDER BY observed_at DESC
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

export async function getTreaLatestPrices(db: Database): Promise<NormalizedQuote[]> {
  const rows = await db.all(`
    SELECT * FROM price_quotes 
    WHERE source = 'trea' 
    ORDER BY observed_at DESC 
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

// Validation function to check if TREA data looks reasonable
export function validateTreaData(quotes: NormalizedQuote[]): {
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
    if (quote.currency !== "USD") {
      errors.push(`Invalid currency: ${quote.currency}`);
    }
    
    if (quote.unit !== "USD/MT") {
      errors.push(`Invalid unit: ${quote.unit}`);
    }
    
    if (quote.price_min < 200 || quote.price_max > 2000) {
      warnings.push(`Unusual price range: ${quote.price_min}-${quote.price_max} USD/MT`);
    }
    
    if (quote.price_min > quote.price_max) {
      errors.push(`Invalid price range: min (${quote.price_min}) > max (${quote.price_max})`);
    }
  }
  
  // Check for common rice varieties
  const varieties = new Set(quotes.map(q => q.variety).filter(Boolean));
  const expectedVarieties = ["hom_mali", "glutinous", "non_glutinous"];
  const hasExpectedVariety = expectedVarieties.some(v => varieties.has(v));
  
  if (!hasExpectedVariety) {
    warnings.push("No common rice varieties found (hom_mali, glutinous, non_glutinous)");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
