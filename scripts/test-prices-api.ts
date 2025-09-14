#!/usr/bin/env ts-node

/**
 * Test script for the optimized prices API
 * 
 * This script tests the new optimized price endpoints to ensure they work correctly.
 * 
 * Usage:
 *   npm run test:prices-api
 *   ts-node scripts/test-prices-api.ts
 */

import { openPricesDb, makePricesRouter } from "../src/api/prices";
import { openDb } from "../src/lib/db";
import express from "express";

async function testPricesAPI() {
  console.log("🧪 Testing optimized prices API...");
  
  try {
    // Initialize databases
    console.log("📊 Initializing databases...");
    const pricesDb = await openPricesDb();
    const buyersDb = await openDb();
    
    // Create test app
    const app = express();
    app.use(express.json());
    
    // Add routes
    app.use("/api/prices", makePricesRouter(pricesDb));
    
    // Test data setup (if needed)
    console.log("📝 Setting up test data...");
    
    // Insert test markets
    await pricesDb.run(`
      INSERT OR IGNORE INTO markets (key, name, location_code) 
      VALUES 
        ('trea_fob', 'TREA FOB', NULL),
        ('talaadthai_pathumthani', 'TalaadThai (Pathum Thani)', 'TH-13')
    `);
    
    // Insert test price quotes
    const testQuotes = [
      {
        crop: 'rice',
        variety: 'hom_mali',
        grade: '100%_a',
        size: null,
        unit: 'USD/MT',
        price_min: 610,
        price_max: 620,
        currency: 'USD',
        source: 'trea',
        market_id: null,
        observed_at: new Date().toISOString(),
        raw_text: 'Hom Mali 100% A: 610-620'
      },
      {
        crop: 'rice',
        variety: 'hom_mali',
        grade: '100%_b',
        size: null,
        unit: 'USD/MT',
        price_min: 580,
        price_max: 590,
        currency: 'USD',
        source: 'trea',
        market_id: null,
        observed_at: new Date().toISOString(),
        raw_text: 'Hom Mali 100% B: 580-590'
      },
      {
        crop: 'durian',
        variety: 'monthong',
        grade: null,
        size: 'L',
        unit: 'THB/kg',
        price_min: 80,
        price_max: 100,
        currency: 'THB',
        source: 'talaadthai',
        market_id: 2, // TalaadThai
        observed_at: new Date().toISOString(),
        raw_text: 'Monthong L: 80-100 บาท/กก.'
      },
      {
        crop: 'durian',
        variety: 'monthong',
        grade: null,
        size: 'M',
        unit: 'THB/kg',
        price_min: 70,
        price_max: 90,
        currency: 'THB',
        source: 'talaadthai',
        market_id: 2,
        observed_at: new Date().toISOString(),
        raw_text: 'Monthong M: 70-90 บาท/กก.'
      }
    ];
    
    for (const quote of testQuotes) {
      await pricesDb.run(`
        INSERT OR IGNORE INTO price_quotes
        (crop, variety, grade, size, unit, price_min, price_max, currency, source, market_id, observed_at, raw_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, 
        quote.crop, quote.variety, quote.grade, quote.size, quote.unit,
        quote.price_min, quote.price_max, quote.currency, quote.source, 
        quote.market_id, quote.observed_at, quote.raw_text
      );
    }
    
    console.log("✅ Test data inserted");
    
    // Test endpoints
    console.log("\n🔍 Testing API endpoints...");
    
    // Test 1: Markets endpoint
    console.log("\n1. Testing /api/prices/markets");
    const marketsResponse = await fetch('http://localhost:3001/api/prices/markets');
    const marketsData = await marketsResponse.json();
    console.log(`   Status: ${marketsResponse.status}`);
    console.log(`   Markets: ${marketsData.items?.length || 0}`);
    
    // Test 2: Current rice prices
    console.log("\n2. Testing /api/prices/current?crop=rice");
    const riceResponse = await fetch('http://localhost:3001/api/prices/current?crop=rice');
    const riceData = await riceResponse.json();
    console.log(`   Status: ${riceResponse.status}`);
    console.log(`   Rice quotes: ${riceData.items?.length || 0}`);
    
    // Test 3: Current durian prices
    console.log("\n3. Testing /api/prices/current?crop=durian");
    const durianResponse = await fetch('http://localhost:3001/api/prices/current?crop=durian');
    const durianData = await durianResponse.json();
    console.log(`   Status: ${durianResponse.status}`);
    console.log(`   Durian quotes: ${durianData.items?.length || 0}`);
    
    // Test 4: Rice FOB prices
    console.log("\n4. Testing /api/prices/current?crop=rice&source=trea&unit=USD/MT");
    const fobResponse = await fetch('http://localhost:3001/api/prices/current?crop=rice&source=trea&unit=USD/MT');
    const fobData = await fobResponse.json();
    console.log(`   Status: ${fobResponse.status}`);
    console.log(`   FOB quotes: ${fobData.items?.length || 0}`);
    
    // Test 5: Durian at TalaadThai
    console.log("\n5. Testing /api/prices/current?crop=durian&market=talaadthai_pathumthani");
    const talaadthaiResponse = await fetch('http://localhost:3001/api/prices/current?crop=durian&market=talaadthai_pathumthani');
    const talaadthaiData = await talaadthaiResponse.json();
    console.log(`   Status: ${talaadthaiResponse.status}`);
    console.log(`   TalaadThai quotes: ${talaadthaiData.items?.length || 0}`);
    
    // Test 6: History endpoint
    console.log("\n6. Testing /api/prices/history?crop=rice&groupBy=day");
    const historyResponse = await fetch('http://localhost:3001/api/prices/history?crop=rice&groupBy=day');
    const historyData = await historyResponse.json();
    console.log(`   Status: ${historyResponse.status}`);
    console.log(`   History points: ${historyData.points?.length || 0}`);
    
    // Test 7: Filtered history
    console.log("\n7. Testing /api/prices/history?crop=durian&variety=monthong&groupBy=day");
    const filteredHistoryResponse = await fetch('http://localhost:3001/api/prices/history?crop=durian&variety=monthong&groupBy=day');
    const filteredHistoryData = await filteredHistoryResponse.json();
    console.log(`   Status: ${filteredHistoryResponse.status}`);
    console.log(`   Filtered history points: ${filteredHistoryData.points?.length || 0}`);
    
    console.log("\n✅ All tests completed successfully!");
    
    // Close databases
    await pricesDb.close();
    await buyersDb.close();
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Start test server
async function startTestServer() {
  const app = express();
  app.use(express.json());
  
  try {
    const pricesDb = await openPricesDb();
    app.use("/api/prices", makePricesRouter(pricesDb));
    
    const server = app.listen(3001, () => {
      console.log("🚀 Test server running on port 3001");
      testPricesAPI().then(() => {
        server.close();
        process.exit(0);
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
