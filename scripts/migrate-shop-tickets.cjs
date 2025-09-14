const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

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
    
    // Execute the entire schema at once
    await db.exec(schema);
    console.log("✅ Schema executed successfully");

    // Verify tables were created
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('shops', 'product_classes', 'shop_tickets', 'ticket_sales')
    `);

    console.log("📊 Created tables:", tables.map(t => t.name).join(", "));

    // Check sample data (only if tables exist)
    try {
      const shopCount = await db.get("SELECT COUNT(*) as count FROM shops");
      const classCount = await db.get("SELECT COUNT(*) as count FROM product_classes");
      
      console.log(`🏪 Sample shops: ${shopCount?.count || 0}`);
      console.log(`📦 Product classes: ${classCount?.count || 0}`);
    } catch (err) {
      console.log("⚠️ Could not check sample data:", err.message);
    }

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

module.exports = { migrateShopTickets };
