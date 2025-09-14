#!/usr/bin/env ts-node

/**
 * Demo script showing universal unit converter in action
 * 
 * This script demonstrates how the universal unit converter works
 * with various agricultural units and real-world examples.
 * 
 * Usage:
 *   npm run demo:units
 *   ts-node scripts/demo-universal-units.ts
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

async function demoUniversalUnits() {
  console.log("🎬 Universal Unit Converter Demo");
  console.log("=" .repeat(60));
  
  try {
    // Initialize database
    console.log("\n📊 Setting up database...");
    const db = await openDb();
    
    // Set up realistic FX rates
    console.log("💱 Setting up realistic FX rates...");
    const fxRates = [
      { date: "2024-01-15", rate: 36.0 },
      { date: "2024-01-16", rate: 36.5 },
      { date: "2024-01-17", rate: 35.8 }
    ];
    
    for (const { date, rate } of fxRates) {
      await upsertFxRate(db, date, "USD", "THB", rate);
    }
    
    console.log("✅ FX rates set up successfully");
    
    // Demo 1: Rice FOB Prices (Multiple Units)
    console.log("\n🌾 Demo 1: Rice FOB Prices (USD/MT → Multiple Units)");
    console.log("-".repeat(60));
    
    const riceFobPrice = { min: 600, max: 620, unit: "USD/MT" };
    const riceTargets = ["THB/kg", "USD/kg", "USD/lb", "USD/cwt", "THB/mt"];
    
    console.log(`📦 Source: ${riceFobPrice.min}-${riceFobPrice.max} ${riceFobPrice.unit}`);
    console.log("   FX Rate: 1 USD = 36.00 THB");
    console.log();
    
    for (const target of riceTargets) {
      try {
        const result = await convertPriceRange(db, riceFobPrice.min, riceFobPrice.max, riceFobPrice.unit, target, "2024-01-15");
        console.log(`   ${target.padEnd(8)}: ${result.min.toFixed(2)}-${result.max.toFixed(2)} ${result.unit}`);
      } catch (error) {
        console.log(`   ${target.padEnd(8)}: Error - ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Demo 2: Durian Market Prices (Multiple Units)
    console.log("\n🥭 Demo 2: Durian Market Prices (THB/kg → Multiple Units)");
    console.log("-".repeat(60));
    
    const durianPrice = { min: 80, max: 100, unit: "THB/kg" };
    const durianTargets = ["USD/kg", "USD/lb", "USD/mt", "THB/mt"];
    
    console.log(`📦 Source: ${durianPrice.min}-${durianPrice.max} ${durianPrice.unit}`);
    console.log("   FX Rate: 1 USD = 36.00 THB");
    console.log();
    
    for (const target of durianTargets) {
      try {
        const result = await convertPriceRange(db, durianPrice.min, durianPrice.max, durianPrice.unit, target, "2024-01-15");
        console.log(`   ${target.padEnd(8)}: ${result.min.toFixed(2)}-${result.max.toFixed(2)} ${result.unit}`);
      } catch (error) {
        console.log(`   ${target.padEnd(8)}: Error - ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Demo 3: Unit Aliases and Parsing
    console.log("\n🔍 Demo 3: Unit Aliases and Parsing");
    console.log("-".repeat(60));
    
    const unitAliases = [
      "USD/MT", "usd/tonne", "USD/mt", "USD/ton (metric)",
      "THB/kg", "thb/กก.", "THB/kilogram",
      "USD/lb", "usd/pound", "USD/pounds",
      "USD/cwt", "usd/hundredweight"
    ];
    
    console.log("Unit parsing examples:");
    for (const unit of unitAliases) {
      try {
        const parsed = parsePriceUnit(unit);
        console.log(`   ${unit.padEnd(20)} → ${parsed.asString}`);
      } catch (error) {
        console.log(`   ${unit.padEnd(20)} → Error: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Demo 4: Mass Conversion Factors
    console.log("\n⚖️  Demo 4: Mass Conversion Factors");
    console.log("-".repeat(60));
    
    console.log("Mass units (in kg):");
    Object.entries(MASS_IN_KG).forEach(([unit, kg]) => {
      console.log(`   ${unit.padEnd(4)}: ${kg.toFixed(6)} kg`);
    });
    
    console.log("\nConversion factors (to kg):");
    const massUnits = ["g", "kg", "lb", "cwt", "mt"];
    for (const unit of massUnits) {
      const factor = getMassConversionFactor(`${unit}/kg`, "kg/kg");
      console.log(`   1 ${unit} = ${factor.toFixed(6)} kg`);
    }
    
    // Demo 5: Real-World Scenarios
    console.log("\n🌍 Demo 5: Real-World Scenarios");
    console.log("-".repeat(60));
    
    const scenarios = [
      {
        name: "Rice Export (FOB)",
        description: "Thai rice exporter quoting to US buyer",
        from: "USD/MT", to: "USD/cwt",
        price: { min: 650, max: 680 },
        context: "US buyers often think in hundredweight (cwt)"
      },
      {
        name: "Durian Export",
        description: "Thai durian exporter quoting to Chinese buyer",
        from: "THB/kg", to: "USD/lb",
        price: { min: 120, max: 150 },
        context: "Chinese buyers often think in pounds"
      },
      {
        name: "Local Market Display",
        description: "Displaying FOB prices to local farmers",
        from: "USD/MT", to: "THB/kg",
        price: { min: 600, max: 620 },
        context: "Farmers think in baht per kilogram"
      },
      {
        name: "Bulk Trading",
        description: "Large-scale trader comparing prices",
        from: "USD/kg", to: "USD/mt",
        price: { min: 0.6, max: 0.65 },
        context: "Traders think in metric tonnes"
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n📊 ${scenario.name}`);
      console.log(`   ${scenario.description}`);
      console.log(`   Context: ${scenario.context}`);
      
      try {
        const result = await convertPriceRange(db, scenario.price.min, scenario.price.max, scenario.from, scenario.to, "2024-01-15");
        console.log(`   ${scenario.price.min}-${scenario.price.max} ${scenario.from} → ${result.min.toFixed(2)}-${result.max.toFixed(2)} ${result.unit}`);
        
        // Show conversion info
        const info = await getConversionInfo(db, scenario.from, scenario.to, "2024-01-15");
        if (info.currencyConversion.rate) {
          console.log(`   Currency: 1 ${info.currencyConversion.from} = ${info.currencyConversion.rate} ${info.currencyConversion.to}`);
        }
        console.log(`   Mass: 1 ${info.massConversion.from} = ${info.massConversion.factor.toFixed(6)} ${info.massConversion.to}`);
      } catch (error) {
        console.log(`   Error: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Demo 6: API Examples
    console.log("\n🌐 Demo 6: API Examples");
    console.log("-".repeat(60));
    
    const apiExamples = [
      {
        url: "/api/prices/current?crop=rice&source=trea&convertTo=THB/kg",
        description: "Rice FOB prices for Thai farmers"
      },
      {
        url: "/api/prices/current?crop=rice&source=trea&convertTo=USD/cwt",
        description: "Rice FOB prices for US traders"
      },
      {
        url: "/api/prices/current?crop=durian&market=talaadthai&convertTo=USD/lb",
        description: "Durian prices for international buyers"
      },
      {
        url: "/api/prices/history?crop=rice&convertTo=THB/mt&groupBy=day",
        description: "Rice price history in metric tonnes"
      }
    ];
    
    console.log("API endpoint examples:");
    for (const example of apiExamples) {
      console.log(`\n   ${example.url}`);
      console.log(`   → ${example.description}`);
    }
    
    // Demo 7: Conversion Accuracy
    console.log("\n🎯 Demo 7: Conversion Accuracy");
    console.log("-".repeat(60));
    
    const accuracyTests = [
      {
        name: "USD/MT → THB/kg",
        from: "USD/MT", to: "THB/kg",
        price: 1000, rate: 36.0,
        expected: 36.0, // 1000 * 36 / 1000
        description: "1 USD/MT = 36 THB/kg at 36 THB/USD"
      },
      {
        name: "THB/kg → USD/lb",
        from: "THB/kg", to: "USD/lb",
        price: 36, rate: 36.0,
        expected: 0.45359237, // 36 / 36 * 0.45359237
        description: "36 THB/kg = 0.454 USD/lb at 36 THB/USD"
      },
      {
        name: "USD/kg → USD/mt",
        from: "USD/kg", to: "USD/mt",
        price: 0.5, rate: 1.0,
        expected: 500, // 0.5 * 1000
        description: "0.5 USD/kg = 500 USD/mt"
      }
    ];
    
    for (const test of accuracyTests) {
      try {
        const result = await convertPrice(db, test.price, test.from, test.to, "2024-01-15");
        const diff = Math.abs(result - test.expected);
        const passed = diff < 0.0001;
        
        console.log(`${passed ? '✅' : '❌'} ${test.name}`);
        console.log(`   Input: ${test.price} ${test.from}`);
        console.log(`   Output: ${result.toFixed(6)} ${test.to}`);
        console.log(`   Expected: ${test.expected} ${test.to}`);
        console.log(`   ${test.description}`);
        if (!passed) {
          console.log(`   Diff: ${diff.toFixed(6)}`);
        }
        console.log();
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    // Demo 8: Supported Units Summary
    console.log("\n📋 Demo 8: Supported Units Summary");
    console.log("-".repeat(60));
    
    console.log("Supported currencies: USD, THB (extensible)");
    console.log("Supported mass units:");
    Object.entries(MASS_IN_KG).forEach(([unit, kg]) => {
      console.log(`   ${unit.padEnd(4)}: ${kg.toFixed(6)} kg`);
    });
    
    console.log("\nCommon output units:");
    COMMON_OUTPUT_UNITS.forEach(unit => {
      console.log(`   ✅ ${unit}`);
    });
    
    console.log("\nUnit aliases supported:");
    console.log("   MT: mt, tonne, metric_ton, t, ตัน, ton (metric)");
    console.log("   kg: kg, กก., kilogram, kilograms");
    console.log("   lb: lb, lbs, pound, pounds");
    console.log("   cwt: cwt, hundredweight");
    console.log("   g: g, gram, grams");
    
    console.log("\n🎉 Universal Unit Converter Demo Complete!");
    console.log("=" .repeat(60));
    console.log("Key Benefits:");
    console.log("✅ Support for all common agricultural units");
    console.log("✅ Flexible unit aliases (MT, tonne, 吨, etc.)");
    console.log("✅ Accurate currency and mass conversions");
    console.log("✅ Real-time FX rate integration");
    console.log("✅ Extensible to new currencies and units");
    console.log("✅ API-ready with validation and error handling");
    console.log("✅ Perfect for international agricultural trade");
    
    await db.close();
    
  } catch (error) {
    console.error("❌ Universal unit converter demo failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  demoUniversalUnits();
}
