#!/usr/bin/env ts-node

/**
 * Test script for currency conversion functionality
 * 
 * This script tests the currency conversion system to ensure USD/MT to THB/kg
 * conversion works correctly with real FX rates.
 * 
 * Usage:
 *   npm run test:currency
 *   ts-node scripts/test-currency-conversion.ts
 */

import { openDb } from "../src/lib/db";
import { upsertFxRate, getFxRate } from "../src/lib/fx/repo";
import { convertRange, convertPrice, getConversionInfo } from "../src/lib/prices/convert";

async function testCurrencyConversion() {
  console.log("🧪 Testing currency conversion system...");
  
  try {
    // Initialize database
    console.log("📊 Initializing database...");
    const db = await openDb();
    
    // Set up test FX rates
    console.log("💱 Setting up test FX rates...");
    const testRates = [
      { date: "2024-01-15", rate: 35.50 },
      { date: "2024-01-16", rate: 35.75 },
      { date: "2024-01-17", rate: 35.25 },
      { date: "2024-01-18", rate: 35.80 },
      { date: "2024-01-19", rate: 35.60 }
    ];
    
    for (const { date, rate } of testRates) {
      await upsertFxRate(db, date, "USD", "THB", rate);
    }
    
    console.log("✅ Test FX rates inserted");
    
    // Test 1: Basic conversion
    console.log("\n1. Testing basic USD/MT to THB/kg conversion...");
    const result1 = await convertRange(db, 600, 620, "USD/MT", "THB/kg", "2024-01-15");
    console.log(`   USD/MT 600-620 → THB/kg ${result1.min.toFixed(2)}-${result1.max.toFixed(2)}`);
    console.log(`   Expected: ~21.13-21.83 (600*35.50/1000 = 21.30)`);
    
    // Test 2: Reverse conversion
    console.log("\n2. Testing THB/kg to USD/MT conversion...");
    const result2 = await convertRange(db, 20, 25, "THB/kg", "USD/MT", "2024-01-16");
    console.log(`   THB/kg 20-25 → USD/MT ${result2.min.toFixed(1)}-${result2.max.toFixed(1)}`);
    console.log(`   Expected: ~559.4-699.3 (20*1000/35.75 = 559.4)`);
    
    // Test 3: Same currency, different units
    console.log("\n3. Testing USD/MT to USD/kg conversion...");
    const result3 = await convertRange(db, 600, 620, "USD/MT", "USD/MT", "2024-01-17");
    console.log(`   USD/MT 600-620 → USD/MT ${result3.min}-${result3.max} (no change)`);
    
    // Test 4: Single price conversion
    console.log("\n4. Testing single price conversion...");
    const singlePrice = await convertPrice(db, 650, "USD/MT", "THB/kg", "2024-01-18");
    console.log(`   USD/MT 650 → THB/kg ${singlePrice.toFixed(2)}`);
    console.log(`   Expected: ~23.25 (650*35.80/1000 = 23.27)`);
    
    // Test 5: Conversion info
    console.log("\n5. Testing conversion info...");
    const info = await getConversionInfo(db, "USD/MT", "THB/kg", "2024-01-19");
    console.log(`   From: ${info.fromUnit}`);
    console.log(`   To: ${info.targetUnit}`);
    console.log(`   Currency: ${info.currencyConversion.from} → ${info.currencyConversion.to} (rate: ${info.currencyConversion.rate})`);
    console.log(`   Denominator: ${info.denominatorConversion.from} → ${info.denominatorConversion.to} (factor: ${info.denominatorConversion.factor})`);
    
    // Test 6: Missing FX rate handling
    console.log("\n6. Testing missing FX rate handling...");
    try {
      await convertRange(db, 600, 620, "USD/MT", "THB/kg", "2020-01-01");
      console.log("   ❌ Should have failed with missing FX rate");
    } catch (error) {
      console.log(`   ✅ Correctly failed with missing FX rate: ${error instanceof Error ? error.message : error}`);
    }
    
    // Test 7: FX rate lookup
    console.log("\n7. Testing FX rate lookup...");
    const rate1 = await getFxRate(db, "USD", "THB", "2024-01-15");
    const rate2 = await getFxRate(db, "USD", "THB", "2024-01-20"); // Should fallback to latest
    const rate3 = await getFxRate(db, "USD", "THB", "2020-01-01"); // Should return null
    
    console.log(`   Rate for 2024-01-15: ${rate1} (expected: 35.50)`);
    console.log(`   Rate for 2024-01-20 (fallback): ${rate2} (expected: 35.60)`);
    console.log(`   Rate for 2020-01-01 (missing): ${rate3} (expected: null)`);
    
    // Test 8: Edge cases
    console.log("\n8. Testing edge cases...");
    
    // Zero prices
    const zeroResult = await convertRange(db, 0, 0, "USD/MT", "THB/kg", "2024-01-15");
    console.log(`   Zero prices: ${zeroResult.min}-${zeroResult.max}`);
    
    // Very small prices
    const smallResult = await convertRange(db, 0.1, 0.2, "USD/MT", "THB/kg", "2024-01-15");
    console.log(`   Small prices: ${smallResult.min.toFixed(4)}-${smallResult.max.toFixed(4)}`);
    
    // Very large prices
    const largeResult = await convertRange(db, 1000, 2000, "USD/MT", "THB/kg", "2024-01-15");
    console.log(`   Large prices: ${largeResult.min.toFixed(2)}-${largeResult.max.toFixed(2)}`);
    
    console.log("\n✅ All currency conversion tests passed!");
    
    // Close database
    await db.close();
    
  } catch (error) {
    console.error("❌ Currency conversion test failed:", error);
    process.exit(1);
  }
}

// Test API endpoints with conversion
async function testApiConversion() {
  console.log("\n🌐 Testing API endpoints with conversion...");
  
  try {
    // Test current prices with conversion
    console.log("\n1. Testing /api/prices/current with conversion...");
    
    const response1 = await fetch('http://localhost:3001/api/prices/current?crop=rice&convertTo=THB/kg');
    const data1 = await response1.json();
    console.log(`   Status: ${response1.status}`);
    console.log(`   Converted items: ${data1.items?.filter((item: any) => item.converted).length || 0}`);
    console.log(`   Conversion errors: ${data1.conversionErrors || 0}`);
    
    // Test history with conversion
    console.log("\n2. Testing /api/prices/history with conversion...");
    
    const response2 = await fetch('http://localhost:3001/api/prices/history?crop=rice&convertTo=THB/kg&groupBy=day');
    const data2 = await response2.json();
    console.log(`   Status: ${response2.status}`);
    console.log(`   Converted points: ${data2.points?.filter((point: any) => point.converted).length || 0}`);
    console.log(`   Conversion errors: ${data2.conversionErrors || 0}`);
    
    // Test specific variety conversion
    console.log("\n3. Testing specific variety conversion...");
    
    const response3 = await fetch('http://localhost:3001/api/prices/current?crop=durian&variety=monthong&convertTo=THB/kg');
    const data3 = await response3.json();
    console.log(`   Status: ${response3.status}`);
    console.log(`   Monthong prices: ${data3.items?.length || 0}`);
    
    console.log("\n✅ API conversion tests completed!");
    
  } catch (error) {
    console.error("❌ API conversion test failed:", error);
  }
}

// Start test server and run tests
async function startTestServer() {
  const app = require("express")();
  app.use(require("express").json());
  
  try {
    const { makePricesRouter, openPricesDb } = await import("../src/api/prices");
    const pricesDb = await openPricesDb();
    app.use("/api/prices", makePricesRouter(pricesDb));
    
    const server = app.listen(3001, () => {
      console.log("🚀 Test server running on port 3001");
      
      // Run tests
      testCurrencyConversion().then(() => {
        testApiConversion().then(() => {
          server.close();
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error("❌ Failed to start test server:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startTestServer();
}
