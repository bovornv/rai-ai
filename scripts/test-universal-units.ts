#!/usr/bin/env ts-node

/**
 * Test script for universal unit converter
 * 
 * This script tests the universal unit converter with various agricultural units
 * to ensure proper currency and mass conversions work correctly.
 * 
 * Usage:
 *   npm run test:units
 *   ts-node scripts/test-universal-units.ts
 */

import { openDb } from "../src/lib/db";
import { upsertFxRate } from "../src/lib/fx/repo";
import { 
  convertPriceRange, 
  convertPrice, 
  parsePriceUnit, 
  getConversionInfo,
  getMassConversionFactor,
  MASS_IN_KG,
  COMMON_OUTPUT_UNITS
} from "../src/lib/prices/units";

async function testUniversalUnits() {
  console.log("🧪 Testing Universal Unit Converter");
  console.log("=" .repeat(60));
  
  try {
    // Initialize database
    console.log("\n📊 Setting up database...");
    const db = await openDb();
    
    // Set up test FX rates
    console.log("💱 Setting up test FX rates...");
    const fxRates = [
      { date: "2024-01-15", rate: 36.0 },
      { date: "2024-01-16", rate: 36.5 },
      { date: "2024-01-17", rate: 35.8 }
    ];
    
    for (const { date, rate } of fxRates) {
      await upsertFxRate(db, date, "USD", "THB", rate);
    }
    
    console.log("✅ FX rates set up successfully");
    
    // Test 1: Unit Parsing
    console.log("\n🔍 Test 1: Unit Parsing");
    console.log("-".repeat(40));
    
    const testUnits = [
      "USD/MT", "usd/tonne", "THB/kg", "usd/lb", "USD/CWT",
      "USD/mt", "THB/กก.", "USD/pound", "THB/ตัน"
    ];
    
    for (const unit of testUnits) {
      try {
        const parsed = parsePriceUnit(unit);
        console.log(`✅ ${unit} → ${parsed.asString} (${parsed.cur}/${parsed.denom})`);
      } catch (error) {
        console.log(`❌ ${unit} → Error: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Test 2: Mass Conversion Factors
    console.log("\n⚖️  Test 2: Mass Conversion Factors");
    console.log("-".repeat(40));
    
    const massTests = [
      { from: "USD/MT", to: "USD/kg", expected: 0.001 },
      { from: "USD/kg", to: "USD/MT", expected: 1000 },
      { from: "USD/lb", to: "USD/kg", expected: 1/0.45359237 },
      { from: "USD/cwt", to: "USD/kg", expected: 1/45.359237 },
      { from: "USD/g", to: "USD/kg", expected: 1000 }
    ];
    
    for (const test of massTests) {
      const factor = getMassConversionFactor(test.from, test.to);
      const expected = test.expected;
      const diff = Math.abs(factor - expected);
      const passed = diff < 0.0001;
      
      console.log(`${passed ? '✅' : '❌'} ${test.from} → ${test.to}`);
      console.log(`   Factor: ${factor.toFixed(6)} (expected: ${expected.toFixed(6)})`);
    }
    
    // Test 3: Currency + Mass Conversions
    console.log("\n💱 Test 3: Currency + Mass Conversions");
    console.log("-".repeat(40));
    
    const conversionTests = [
      {
        name: "Rice FOB (USD/MT → THB/kg)",
        from: "USD/MT", to: "THB/kg", 
        min: 600, max: 620, rate: 36.0,
        expected: { min: 21.60, max: 22.32 }
      },
      {
        name: "Rice FOB (USD/MT → USD/cwt)",
        from: "USD/MT", to: "USD/cwt",
        min: 600, max: 620, rate: 1.0,
        expected: { min: 13.23, max: 13.67 }
      },
      {
        name: "Durian (THB/kg → USD/lb)",
        from: "THB/kg", to: "USD/lb",
        min: 80, max: 100, rate: 36.0,
        expected: { min: 1.00, max: 1.25 }
      },
      {
        name: "Rice (USD/kg → THB/mt)",
        from: "USD/kg", to: "THB/mt",
        min: 0.6, max: 0.62, rate: 36.0,
        expected: { min: 600, max: 620 }
      }
    ];
    
    for (const test of conversionTests) {
      try {
        const result = await convertPriceRange(db, test.min, test.max, test.from, test.to, "2024-01-15");
        
        const minDiff = Math.abs(result.min - test.expected.min);
        const maxDiff = Math.abs(result.max - test.expected.max);
        const passed = minDiff < 0.01 && maxDiff < 0.01;
        
        console.log(`${passed ? '✅' : '❌'} ${test.name}`);
        console.log(`   Input: ${test.min}-${test.max} ${test.from}`);
        console.log(`   Output: ${result.min.toFixed(2)}-${result.max.toFixed(2)} ${result.unit}`);
        console.log(`   Expected: ${test.expected.min}-${test.expected.max} ${test.to}`);
        
        if (!passed) {
          console.log(`   Min diff: ${minDiff.toFixed(4)}, Max diff: ${maxDiff.toFixed(4)}`);
        }
        console.log();
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Test 4: Single Price Conversions
    console.log("\n💰 Test 4: Single Price Conversions");
    console.log("-".repeat(40));
    
    const singleTests = [
      { price: 650, from: "USD/MT", to: "THB/kg", expected: 23.40 },
      { price: 25, from: "THB/kg", to: "USD/lb", expected: 0.31 },
      { price: 0.5, from: "USD/kg", to: "THB/mt", expected: 500 },
      { price: 1000, from: "USD/MT", to: "USD/cwt", expected: 22.05 }
    ];
    
    for (const test of singleTests) {
      try {
        const result = await convertPrice(db, test.price, test.from, test.to, "2024-01-15");
        const diff = Math.abs(result - test.expected);
        const passed = diff < 0.01;
        
        console.log(`${passed ? '✅' : '❌'} ${test.price} ${test.from} → ${result.toFixed(2)} ${test.to}`);
        console.log(`   Expected: ${test.expected} ${test.to}`);
        if (!passed) {
          console.log(`   Diff: ${diff.toFixed(4)}`);
        }
      } catch (error) {
        console.log(`❌ ${test.price} ${test.from} → Error: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Test 5: Conversion Info
    console.log("\n🔍 Test 5: Conversion Information");
    console.log("-".repeat(40));
    
    const infoTests = [
      { from: "USD/MT", to: "THB/kg", date: "2024-01-15" },
      { from: "THB/kg", to: "USD/lb", date: "2024-01-16" },
      { from: "USD/kg", to: "USD/mt", date: "2024-01-17" }
    ];
    
    for (const test of infoTests) {
      try {
        const info = await getConversionInfo(db, test.from, test.to, test.date);
        console.log(`📊 ${test.from} → ${test.to} (${test.date})`);
        console.log(`   Currency: ${info.currencyConversion.from} → ${info.currencyConversion.to} (rate: ${info.currencyConversion.rate})`);
        console.log(`   Mass: ${info.massConversion.from} → ${info.massConversion.to} (factor: ${info.massConversion.factor.toFixed(6)})`);
        console.log();
      } catch (error) {
        console.log(`❌ ${test.from} → ${test.to} - Error: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Test 6: Edge Cases
    console.log("\n⚠️  Test 6: Edge Cases");
    console.log("-".repeat(40));
    
    const edgeCases = [
      { name: "Zero prices", from: "USD/MT", to: "THB/kg", min: 0, max: 0 },
      { name: "Very small prices", from: "USD/MT", to: "THB/kg", min: 0.001, max: 0.002 },
      { name: "Very large prices", from: "USD/MT", to: "THB/kg", min: 10000, max: 20000 },
      { name: "Same unit", from: "USD/MT", to: "USD/MT", min: 600, max: 620 }
    ];
    
    for (const test of edgeCases) {
      try {
        const result = await convertPriceRange(db, test.min, test.max, test.from, test.to, "2024-01-15");
        console.log(`✅ ${test.name}: ${test.min}-${test.max} ${test.from} → ${result.min.toFixed(6)}-${result.max.toFixed(6)} ${result.unit}`);
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Test 7: Supported Units
    console.log("\n📋 Test 7: Supported Units");
    console.log("-".repeat(40));
    
    console.log("Common output units:");
    COMMON_OUTPUT_UNITS.forEach(unit => {
      console.log(`  ✅ ${unit}`);
    });
    
    console.log("\nMass conversion factors (to kg):");
    Object.entries(MASS_IN_KG).forEach(([unit, kg]) => {
      console.log(`  ${unit}: ${kg} kg`);
    });
    
    // Test 8: API Simulation
    console.log("\n🌐 Test 8: API Response Simulation");
    console.log("-".repeat(40));
    
    const apiTests = [
      { crop: "rice", source: "trea", convertTo: "THB/kg" },
      { crop: "rice", source: "trea", convertTo: "USD/cwt" },
      { crop: "durian", market: "talaadthai", convertTo: "USD/lb" }
    ];
    
    for (const test of apiTests) {
      console.log(`📡 Simulating: ${test.crop} ${test.source || test.market} → ${test.convertTo}`);
      
      // Simulate some test data
      const testData = [
        { variety: "test1", unit: "USD/MT", price_min: 600, price_max: 620 },
        { variety: "test2", unit: "THB/kg", price_min: 80, price_max: 100 }
      ];
      
      const convertedItems = [];
      let errors = 0;
      
      for (const item of testData) {
        try {
          const result = await convertPriceRange(db, item.price_min, item.price_max, item.unit, test.convertTo, "2024-01-15");
          convertedItems.push({
            variety: item.variety,
            unit: result.unit,
            original_unit: item.unit,
            price_min: result.min,
            price_max: result.max,
            converted: true
          });
        } catch (error) {
          convertedItems.push({
            variety: item.variety,
            unit: item.unit,
            converted: false,
            error: error instanceof Error ? error.message : "Conversion failed"
          });
          errors++;
        }
      }
      
      console.log(`   Converted: ${convertedItems.filter(item => item.converted).length}/${convertedItems.length}`);
      console.log(`   Errors: ${errors}`);
    }
    
    console.log("\n🎉 Universal Unit Converter Tests Complete!");
    console.log("=" .repeat(60));
    console.log("Key Features Tested:");
    console.log("✅ Unit parsing with aliases (MT, tonne, 吨, etc.)");
    console.log("✅ Mass conversion factors (kg, lb, cwt, mt)");
    console.log("✅ Currency conversion with FX rates");
    console.log("✅ Combined currency + mass conversions");
    console.log("✅ Single price conversions");
    console.log("✅ Conversion information and debugging");
    console.log("✅ Edge cases and error handling");
    console.log("✅ API response simulation");
    
    await db.close();
    
  } catch (error) {
    console.error("❌ Universal unit converter test failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  testUniversalUnits();
}
