#!/usr/bin/env ts-node

/**
 * Fetch USD->THB daily exchange rates and store in fx_rates table.
 * 
 * This script fetches daily USD to THB exchange rates from exchangerate.host
 * and stores them in the fx_rates table for currency conversion.
 * 
 * Usage:
 *   npm run fx:today
 *   ts-node scripts/fetch-fx.ts
 *   ts-node scripts/fetch-fx.ts --date=2024-01-15
 *   ts-node scripts/fetch-fx.ts --backfill --from=2024-01-01 --to=2024-01-31
 */

import { openDb } from "../src/lib/db";
import { upsertFxRate } from "../src/lib/fx/repo";
import minimist from "minimist";

const FX_URL = (day: string) => `https://api.exchangerate.host/${day}?base=USD&symbols=THB`;
const USER_AGENT = "RaiAI/1.0 (+contact: ops@yourdomain.example)";

interface FxResponse {
  success: boolean;
  rates: {
    THB: number;
  };
  date: string;
}

async function fetchUsdThb(dayISO: string): Promise<number> {
  const url = FX_URL(dayISO.slice(0, 10));
  console.log(`📡 Fetching USD->THB rate for ${dayISO.slice(0, 10)}...`);
  
  const res = await fetch(url, { 
    headers: { 
      "User-Agent": USER_AGENT,
      "Accept": "application/json"
    } 
  });
  
  if (!res.ok) {
    throw new Error(`FX API HTTP ${res.status}: ${res.statusText}`);
  }
  
  const data: FxResponse = await res.json();
  
  if (!data.success) {
    throw new Error(`FX API error: ${JSON.stringify(data)}`);
  }
  
  const rate = data?.rates?.THB;
  if (typeof rate !== "number" || rate <= 0) {
    throw new Error(`Invalid THB rate: ${rate}`);
  }
  
  return rate;
}

async function fetchAndStoreRate(db: any, dayISO: string): Promise<void> {
  try {
    const rate = await fetchUsdThb(dayISO);
    await upsertFxRate(db, dayISO, "USD", "THB", rate);
    console.log(`✅ USD->THB ${dayISO.slice(0, 10)}: ${rate.toFixed(4)}`);
  } catch (error) {
    console.error(`❌ Failed to fetch rate for ${dayISO.slice(0, 10)}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

async function backfillRates(db: any, fromDate: string, toDate: string): Promise<void> {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const current = new Date(from);
  
  console.log(`📅 Backfilling rates from ${fromDate} to ${toDate}...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  while (current <= to) {
    const dayISO = current.toISOString();
    
    try {
      await fetchAndStoreRate(db, dayISO);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`⚠️  Skipping ${dayISO.slice(0, 10)} due to error`);
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
    
    // Rate limiting - be nice to the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Backfill complete: ${successCount} successful, ${errorCount} errors`);
}

async function main() {
  const argv = minimist(process.argv.slice(2));
  
  const db = await openDb(process.env.PRICES_DB_PATH || "data/app.db");
  
  try {
    if (argv.backfill && argv.from && argv.to) {
      // Backfill mode
      await backfillRates(db, argv.from, argv.to);
    } else if (argv.date) {
      // Specific date
      await fetchAndStoreRate(db, argv.date);
    } else {
      // Today (default)
      const today = new Date().toISOString();
      await fetchAndStoreRate(db, today);
    }
    
    console.log("🎉 FX rate fetching completed successfully!");
    
  } catch (error) {
    console.error("💥 FX rate fetching failed:", error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Additional utility functions for manual rate management
export async function getLatestRate(db: any): Promise<number | null> {
  const { getFxRate } = await import("../src/lib/fx/repo");
  return await getFxRate(db, "USD", "THB");
}

export async function listRates(db: any, limit = 10): Promise<void> {
  const rates = await db.all(`
    SELECT day, base, quote, rate 
    FROM fx_rates 
    ORDER BY day DESC 
    LIMIT ?
  `, limit);
  
  console.log("\n📈 Recent FX rates:");
  console.table(rates);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
}
