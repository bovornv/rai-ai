/**
 * Department of Agriculture (DOA) registered fruit packing houses
 * Source: DOA official lists (XLS/PDF) for durian packhouses approved for export
 * Output: Buyer[] with crop="durian", type="packhouse", verified_source="doa"
 *
 * TODO: Download DOA packhouse lists and update:
 *   - DOA_PACKHOUSES_URL (or local file path)
 *   - parseDoaPackhousesData() function for the actual file format
 */
import { Buyer, nowIso, toKey } from "../../prices/types";
import { upsertBuyer } from "../../prices/repo";
import { Database } from "sqlite";
import * as fs from "fs";
import * as path from "path";

// For now, using a mock data structure - replace with actual DOA data parsing
const DOA_PACKHOUSES_DATA = [
  {
    name_th: "บริษัท ฟรุต เอ็กซ์ปอร์ต จำกัด",
    name_en: "Fruit Export Co., Ltd.",
    province: "Chonburi",
    district: "Mueang Chonburi",
    address: "123/45 Moo 5, Tambon Bang Saen, Amphoe Mueang, Chonburi 20130",
    phone: "038-123-456",
    email: "info@fruitexport.co.th",
    website: "https://fruitexport.co.th",
    gacc_approved: true
  },
  {
    name_th: "สหกรณ์การเกษตรทุเรียน จำกัด",
    name_en: "Durian Agricultural Cooperative",
    province: "Chanthaburi",
    district: "Khlung",
    address: "456/78 Moo 2, Tambon Khlung, Amphoe Khlung, Chanthaburi 22110",
    phone: "039-234-567",
    email: "coop@durian.co.th",
    website: "https://duriancoop.co.th",
    gacc_approved: true
  },
  {
    name_th: "บริษัท ทุเรียน พรีเมียม จำกัด",
    name_en: "Durian Premium Co., Ltd.",
    province: "Rayong",
    district: "Ban Khai",
    address: "789/12 Moo 3, Tambon Ban Khai, Amphoe Ban Khai, Rayong 21120",
    phone: "038-345-678",
    email: "premium@durianpremium.co.th",
    gacc_approved: false
  }
];

export async function fetchDoaPackhousesData(): Promise<any[]> {
  // TODO: Replace with actual DOA data fetching
  // This could be:
  // 1. Downloading XLS/PDF from DOA website
  // 2. Parsing the file format
  // 3. Converting to structured data
  
  // For now, return mock data
  return DOA_PACKHOUSES_DATA;
}

function parseDoaPackhousesData(data: any[]): Buyer[] {
  const observedAt = nowIso();
  const buyers: Buyer[] = [];

  for (const item of data) {
    const buyer: Buyer = {
      crop: "durian",
      name_th: item.name_th || undefined,
      name_en: item.name_en,
      type: "packhouse",
      province: item.province || undefined,
      district: item.district || undefined,
      address: item.address || undefined,
      phone: item.phone || undefined,
      email: item.email || undefined,
      website: item.website || undefined,
      verified_source: item.gacc_approved ? "gacc" : "doa",
      last_checked_at: observedAt
    };

    buyers.push(buyer);
  }

  return buyers;
}

export async function ingestDoaPackhouses(db: Database): Promise<number> {
  try {
    console.log("🥭 Fetching DOA packhouse directory...");
    
    const data = await fetchDoaPackhousesData();
    const buyers = parseDoaPackhousesData(data);
    
    if (!buyers.length) {
      throw new Error("DOA Packhouses: no buyers parsed");
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
    
    console.log(`✅ DOA Packhouses: ${successCount}/${buyers.length} durian packhouses ingested`);
    return successCount;
  } catch (error) {
    console.error("❌ DOA Packhouses ingestion failed:", error);
    throw error;
  }
}

// Helper function to parse XLS files (if DOA provides XLS)
export async function parseXlsFile(filePath: string): Promise<any[]> {
  // TODO: Implement XLS parsing
  // You can use libraries like 'xlsx' or 'exceljs'
  // For now, return empty array
  console.log(`TODO: Parse XLS file: ${filePath}`);
  return [];
}

// Helper function to parse PDF files (if DOA provides PDF)
export async function parsePdfFile(filePath: string): Promise<any[]> {
  // TODO: Implement PDF parsing
  // You can use libraries like 'pdf-parse' or 'pdf2pic'
  // For now, return empty array
  console.log(`TODO: Parse PDF file: ${filePath}`);
  return [];
}

// Additional helper functions for DOA packhouses
export async function getDoaPackhouses(db: Database): Promise<Buyer[]> {
  const rows = await db.all(`
    SELECT * FROM buyers 
    WHERE crop = 'durian' AND verified_source IN ('doa', 'gacc')
    ORDER BY verified_source DESC, name_en ASC
  `);
  
  return rows as Buyer[];
}

export async function getGaccApprovedPackhouses(db: Database): Promise<Buyer[]> {
  const rows = await db.all(`
    SELECT * FROM buyers 
    WHERE crop = 'durian' AND verified_source = 'gacc'
    ORDER BY name_en ASC
  `);
  
  return rows as Buyer[];
}

export async function searchDoaPackhouses(db: Database, query: string): Promise<Buyer[]> {
  const searchTerm = `%${query}%`;
  const rows = await db.all(`
    SELECT * FROM buyers 
    WHERE crop = 'durian' 
      AND verified_source IN ('doa', 'gacc')
      AND (name_en LIKE ? OR name_th LIKE ? OR province LIKE ?)
    ORDER BY verified_source DESC, name_en ASC
  `, searchTerm, searchTerm, searchTerm);
  
  return rows as Buyer[];
}

// Validation function to check if DOA packhouses data looks reasonable
export function validateDoaPackhousesData(buyers: Buyer[]): {
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
    
    if (buyer.crop !== "durian") {
      errors.push(`Invalid crop: ${buyer.crop}`);
    }
    
    if (buyer.type !== "packhouse") {
      errors.push(`Invalid type: ${buyer.type}`);
    }
    
    if (!["doa", "gacc"].includes(buyer.verified_source)) {
      errors.push(`Invalid verified source: ${buyer.verified_source}`);
    }
  }
  
  // Check for GACC approval coverage
  const gaccApproved = buyers.filter(b => b.verified_source === "gacc").length;
  if (gaccApproved / buyers.length < 0.5) {
    warnings.push(`Low GACC approval coverage: ${gaccApproved}/${buyers.length}`);
  }
  
  // Check for contact information completeness
  const withPhone = buyers.filter(b => b.phone).length;
  const withEmail = buyers.filter(b => b.email).length;
  const withAddress = buyers.filter(b => b.address).length;
  
  if (withPhone / buyers.length < 0.5) {
    warnings.push(`Low phone number coverage: ${withPhone}/${buyers.length}`);
  }
  
  if (withEmail / buyers.length < 0.3) {
    warnings.push(`Low email coverage: ${withEmail}/${buyers.length}`);
  }
  
  if (withAddress / buyers.length < 0.4) {
    warnings.push(`Low address coverage: ${withAddress}/${buyers.length}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
