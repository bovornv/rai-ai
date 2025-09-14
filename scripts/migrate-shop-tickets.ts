#!/usr/bin/env ts-node

import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.SHOPTICKET_DB_PATH || "data/app.db";

async function migrateShopTickets() {
  console.log("🔄 Starting shop tickets migration...");
  
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = await open({ 
    filename: DB_PATH, 
    driver: sqlite3.Database 
  });

  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, "../src/db/schema/shop-tickets.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        await db.exec(statement);
        console.log("✅ Executed:", statement.substring(0, 50) + "...");
      }
    }

    // Verify tables were created
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('shops', 'product_classes', 'shop_tickets', 'ticket_sales')
    `);

    console.log("📊 Created tables:", tables.map(t => t.name).join(", "));

    // Check sample data
    const shopCount = await db.get("SELECT COUNT(*) as count FROM shops");
    const classCount = await db.get("SELECT COUNT(*) as count FROM product_classes");
    
    console.log(`🏪 Sample shops: ${shopCount?.count || 0}`);
    console.log(`📦 Product classes: ${classCount?.count || 0}`);

    console.log("✅ Shop tickets migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateShopTickets().catch(console.error);
}

export { migrateShopTickets };
