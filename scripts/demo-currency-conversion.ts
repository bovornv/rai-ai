#!/usr/bin/env ts-node

/**
 * Demo script showing currency conversion in action
 * 
 * This script demonstrates how the currency conversion system works
 * by setting up test data and showing real conversions.
 * 
 * Usage:
 *   npm run demo:currency
 *   ts-node scripts/demo-currency-conversion.ts
 */

import { openDb } from "../src/lib/db";
import { upsertFxRate } from "../src/lib/fx/repo";
import { convertRange, convertPrice, getConversionInfo } from "../src/lib/prices/convert";

async function demoCurrencyConversion() {
  console.log("🎬 Currency Conversion Demo");
  console.log("=" .repeat(50));
  
  try {
    // Initialize database
    console.log("\n📊 Setting up database...");
    const db = await openDb();
    
    // Set up realistic FX rates
    console.log("💱 Setting up realistic FX rates...");
    const fxRates = [
      { date: "2024-01-15", rate: 35.50 },
      { date: "2024-01-16", rate: 35.75 },
      { date: "2024-01-17", rate: 35.25 },
      { date: "2024-01-18", rate: 35.80 },
      { date: "2024-01-19", rate: 35.60 }
    ];
    
    for (const { date, rate } of fxRates) {
      await upsertFxRate(db, date, "USD", "THB", rate);
    }
    
    console.log("✅ FX rates set up successfully");
    
    // Demo 1: Rice FOB Prices
    console.log("\n🌾 Demo 1: Rice FOB Prices (USD/MT → THB/kg)");
    console.log("-".repeat(50));
    
    const ricePrices = [
      { variety: "Hom Mali 100% A", price: "610-620", unit: "USD/MT" },
      { variety: "Hom Mali 100% B", price: "580-590", unit: "USD/MT" },
      { variety: "Jasmine 100%", price: "550-570", unit: "USD/MT" }
    ];
    
    for (const rice of ricePrices) {
      const [min, max] = rice.price.split("-").map(Number);
      const result = await convertRange(db, min, max, "USD/MT", "THB/kg", "2024-01-15");
      
      console.log(`📦 ${rice.variety}`);
      console.log(`   Source: ${rice.price} ${rice.unit}`);
      console.log(`   Converted: ${result.min.toFixed(2)}-${result.max.toFixed(2)} ${result.unit}`);
      console.log(`   Rate: 1 USD = 35.50 THB`);
      console.log(`   Calculation: ${min}-${max} × 35.50 ÷ 1000 = ${result.min.toFixed(2)}-${result.max.toFixed(2)}`);
      console.log();
    }
    
    // Demo 2: Durian Market Prices
    console.log("🥭 Demo 2: Durian Market Prices (THB/kg → THB/kg)");
    console.log("-".repeat(50));
    
    const durianPrices = [
      { variety: "Monthong L", price: "80-100", unit: "THB/kg" },
      { variety: "Monthong M", price: "70-90", unit: "THB/kg" },
      { variety: "Chani L", price: "60-80", unit: "THB/kg" }
    ];
    
    for (const durian of durianPrices) {
      const [min, max] = durian.price.split("-").map(Number);
      const result = await convertRange(db, min, max, "THB/kg", "THB/kg", "2024-01-15");
      
      console.log(`📦 ${durian.variety}`);
      console.log(`   Source: ${durian.price} ${durian.unit}`);
      console.log(`   Converted: ${result.min}-${result.max} ${result.unit} (no change needed)`);
      console.log();
    }
    
    // Demo 3: Historical Price Conversion
    console.log("📈 Demo 3: Historical Price Conversion");
    console.log("-".repeat(50));
    
    const historicalPrices = [
      { date: "2024-01-15", price: 600, rate: 35.50 },
      { date: "2024-01-16", price: 610, rate: 35.75 },
      { date: "2024-01-17", price: 595, rate: 35.25 },
      { date: "2024-01-18", price: 620, rate: 35.80 },
      { date: "2024-01-19", price: 605, rate: 35.60 }
    ];
    
    console.log("Rice FOB Price History (USD/MT → THB/kg):");
    console.log("Date       | USD/MT | Rate   | THB/kg  | Change");
    console.log("-----------|--------|--------|---------|--------");
    
    for (const day of historicalPrices) {
      const converted = await convertPrice(db, day.price, "USD/MT", "THB/kg", day.date);
      const change = day.price - historicalPrices[0].price;
      const changePercent = ((day.price - historicalPrices[0].price) / historicalPrices[0].price * 100).toFixed(1);
      
      console.log(`${day.date} | ${day.price.toString().padStart(6)} | ${day.rate.toFixed(2)} | ${converted.toFixed(2).padStart(7)} | ${change >= 0 ? '+' : ''}${changePercent}%`);
    }
    
    // Demo 4: Conversion Info
    console.log("\n🔍 Demo 4: Conversion Information");
    console.log("-".repeat(50));
    
    const info = await getConversionInfo(db, "USD/MT", "THB/kg", "2024-01-15");
    console.log("Conversion Details:");
    console.log(`  From Unit: ${info.fromUnit}`);
    console.log(`  To Unit: ${info.targetUnit}`);
    console.log(`  Currency: ${info.currencyConversion.from} → ${info.currencyConversion.to}`);
    console.log(`  FX Rate: 1 ${info.currencyConversion.from} = ${info.currencyConversion.rate} ${info.currencyConversion.to}`);
    console.log(`  Denominator: ${info.denominatorConversion.from} → ${info.denominatorConversion.to}`);
    console.log(`  Factor: ${info.denominatorConversion.factor} (MT to kg)`);
    console.log(`  Date: ${info.fxDate}`);
    
    // Demo 5: API Simulation
    console.log("\n🌐 Demo 5: API Response Simulation");
    console.log("-".repeat(50));
    
    const apiResponse = {
      crop: "rice",
      market: "trea_fob",
      count: 3,
      convertTo: "THB/kg",
      conversionErrors: 0,
      items: []
    };
    
    for (const rice of ricePrices) {
      const [min, max] = rice.price.split("-").map(Number);
      const result = await convertRange(db, min, max, "USD/MT", "THB/kg", "2024-01-15");
      
      apiResponse.items.push({
        variety: rice.variety,
        unit: result.unit,
        original_unit: "USD/MT",
        price_min: result.min,
        price_max: result.max,
        converted: true,
        source: "trea",
        observed_at: "2024-01-15T09:00:00.000Z"
      });
    }
    
    console.log("API Response (simulated):");
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Demo 6: Error Handling
    console.log("\n⚠️  Demo 6: Error Handling");
    console.log("-".repeat(50));
    
    try {
      await convertRange(db, 600, 620, "USD/MT", "THB/kg", "2020-01-01");
      console.log("❌ Should have failed with missing FX rate");
    } catch (error) {
      console.log("✅ Correctly handled missing FX rate:");
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }
    
    console.log("\n🎉 Currency Conversion Demo Complete!");
    console.log("=" .repeat(50));
    console.log("Key Benefits:");
    console.log("✅ Farmers see prices in familiar THB/kg units");
    console.log("✅ Historical accuracy with proper FX rates");
    console.log("✅ Graceful error handling for missing rates");
    console.log("✅ Transparent conversion with source units");
    console.log("✅ Real-time conversion for live data");
    
    await db.close();
    
  } catch (error) {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  demoCurrencyConversion();
}
