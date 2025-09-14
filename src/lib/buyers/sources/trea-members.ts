/**
 * Thai Rice Exporters Association (TREA) member directory
 * Source: TREA member directory pages (HTML)
 * Output: Buyer[] with crop="rice", type="exporter", verified_source="trea"
 *
 * TODO: Open the TREA member directory page in a browser, Inspect, and update:
 *   - TREA_MEMBERS_URL
 *   - CSS selectors inside parseTreaMembersHtml()
 */
import { Buyer, nowIso, toKey } from "../../prices/types";
import { upsertBuyer } from "../../prices/repo";
import { Database } from "sqlite";
import * as cheerio from "cheerio";

const TREA_MEMBERS_URL = "https://www.thairiceexporters.or.th/Members.html"; // example; confirm exact URL
const TREA_BASE_URL = "https://www.thairiceexporters.or.th";

const UA = "RaiAI/1.0 (+contact: ops@yourdomain.example)";

export async function fetchTreaMembersHtml(): Promise<string> {
  const res = await fetch(TREA_MEMBERS_URL, { 
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
    throw new Error(`TREA Members HTTP ${res.status}: ${res.statusText}`);
  }
  
  return await res.text();
}

function parseTreaMembersHtml(html: string): Buyer[] {
  const $ = cheerio.load(html);
  const observedAt = nowIso();

  // TODO: adjust selectors based on actual TREA members page structure
  // Look for member cards, rows, or list items
  const memberElements = $(".member-card, .member-item, .company-item, .exporter-item, tr, li").toArray();
  
  const buyers: Buyer[] = [];

  for (const el of memberElements) {
    const root = $(el);
    const text = root.text().trim();

    // Skip if doesn't contain company-related content
    if (!text || text.length < 10) continue;

    // Extract company name (English)
    let nameEn = "";
    const nameSelectors = [
      ".company-name", ".member-name", ".exporter-name", "h3", "h4", ".title", ".name"
    ];
    
    for (const selector of nameSelectors) {
      const nameEl = root.find(selector).first();
      if (nameEl.length && nameEl.text().trim()) {
        nameEn = nameEl.text().trim();
        break;
      }
    }
    
    // Fallback: use first text content if no specific name element
    if (!nameEn) {
      const firstText = root.contents().filter(function() {
        return this.nodeType === 3; // Text node
      }).first().text().trim();
      
      if (firstText && firstText.length > 3 && firstText.length < 100) {
        nameEn = firstText;
      }
    }

    if (!nameEn) continue;

    // Extract Thai name (if available)
    let nameTh = "";
    const thaiSelectors = [
      ".thai-name", ".name-th", ".company-name-th", ".member-name-th"
    ];
    
    for (const selector of thaiSelectors) {
      const thaiEl = root.find(selector).first();
      if (thaiEl.length && thaiEl.text().trim()) {
        nameTh = thaiEl.text().trim();
        break;
      }
    }

    // Extract contact information
    let phone = "";
    let email = "";
    let website = "";
    let address = "";
    let province = "";

    // Look for phone numbers
    const phoneMatch = text.match(/(\+66\s*)?\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
    }

    // Look for email addresses
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      email = emailMatch[0];
    }

    // Look for websites
    const websiteMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (websiteMatch) {
      website = websiteMatch[0];
    }

    // Look for addresses (simplified)
    const addressMatch = text.match(/(\d+[^,]*,\s*[^,]*,\s*[^,]*)/);
    if (addressMatch) {
      address = addressMatch[0];
      
      // Try to extract province from address
      const provinceMatch = address.match(/(Bangkok|Chiang Mai|Khon Kaen|Ubon Ratchathani|Nakhon Ratchasima|Surat Thani|Songkhla|Pattani|Yala|Narathiwat)/i);
      if (provinceMatch) {
        province = provinceMatch[1];
      }
    }

    // Create buyer object
    const buyer: Buyer = {
      crop: "rice",
      name_th: nameTh || undefined,
      name_en: nameEn,
      type: "exporter",
      province: province || undefined,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      website: website || undefined,
      verified_source: "trea",
      last_checked_at: observedAt
    };

    buyers.push(buyer);
  }

  return buyers;
}

export async function ingestTreaMembers(db: Database): Promise<number> {
  try {
    console.log("🌾 Fetching TREA member directory...");
    
    const html = await fetchTreaMembersHtml();
    const buyers = parseTreaMembersHtml(html);
    
    if (!buyers.length) {
      throw new Error("TREA Members: no buyers parsed");
    }
    
    let successCount = 0;
    for (const buyer of buyers) {
      try {
        await upsertBuyer(db, buyer);
        successCount++;
      } catch (error) {
        console.warn(`Failed to upsert buyer ${buyer.name_en}:`, error);
      }
    }
    
    console.log(`✅ TREA Members: ${successCount}/${buyers.length} rice exporters ingested`);
    return successCount;
  } catch (error) {
    console.error("❌ TREA Members ingestion failed:", error);
    throw error;
  }
}

// Additional helper functions for TREA members
export async function getTreaMembers(db: Database): Promise<Buyer[]> {
  const rows = await db.all(`
    SELECT * FROM buyers 
    WHERE crop = 'rice' AND verified_source = 'trea'
    ORDER BY name_en ASC
  `);
  
  return rows as Buyer[];
}

export async function searchTreaMembers(db: Database, query: string): Promise<Buyer[]> {
  const searchTerm = `%${query}%`;
  const rows = await db.all(`
    SELECT * FROM buyers 
    WHERE crop = 'rice' 
      AND verified_source = 'trea'
      AND (name_en LIKE ? OR name_th LIKE ? OR province LIKE ?)
    ORDER BY name_en ASC
  `, searchTerm, searchTerm, searchTerm);
  
  return rows as Buyer[];
}

// Validation function to check if TREA members data looks reasonable
export function validateTreaMembersData(buyers: Buyer[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (buyers.length === 0) {
    errors.push("No buyers found");
    return { isValid: false, errors, warnings };
  }
  
  // Check for required fields
  for (const buyer of buyers) {
    if (!buyer.name_en || buyer.name_en.trim().length < 3) {
      errors.push(`Invalid company name: ${buyer.name_en}`);
    }
    
    if (buyer.crop !== "rice") {
      errors.push(`Invalid crop: ${buyer.crop}`);
    }
    
    if (buyer.type !== "exporter") {
      errors.push(`Invalid type: ${buyer.type}`);
    }
    
    if (buyer.verified_source !== "trea") {
      errors.push(`Invalid verified source: ${buyer.verified_source}`);
    }
  }
  
  // Check for contact information completeness
  const withPhone = buyers.filter(b => b.phone).length;
  const withEmail = buyers.filter(b => b.email).length;
  const withWebsite = buyers.filter(b => b.website).length;
  const withAddress = buyers.filter(b => b.address).length;
  
  if (withPhone / buyers.length < 0.3) {
    warnings.push(`Low phone number coverage: ${withPhone}/${buyers.length}`);
  }
  
  if (withEmail / buyers.length < 0.2) {
    warnings.push(`Low email coverage: ${withEmail}/${buyers.length}`);
  }
  
  if (withWebsite / buyers.length < 0.1) {
    warnings.push(`Low website coverage: ${withWebsite}/${buyers.length}`);
  }
  
  if (withAddress / buyers.length < 0.2) {
    warnings.push(`Low address coverage: ${withAddress}/${buyers.length}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
