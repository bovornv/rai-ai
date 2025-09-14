import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import fs from "fs";
import path from "path";

export async function openDb(dbPath = process.env.PRICES_DB_PATH || "data/app.db") {
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Open database
  const db: Database = await open({ 
    filename: dbPath, 
    driver: sqlite3.Database 
  });

  // Load schema files once on startup (idempotent)
  const schemaDir = path.join("src", "db", "schema");
  const schemaFiles = ["prices.sql", "fx.sql"];
  
  for (const schemaFile of schemaFiles) {
    const schemaPath = path.join(schemaDir, schemaFile);
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      await db.exec(sql);
    }
  }

  return db;
}

export async function closeDb(db: Database) {
  await db.close();
}

export async function initDb(dbPath = process.env.PRICES_DB_PATH || "data/app.db") {
  const db = await openDb(dbPath);
  
  // Run any initialization queries
  await db.exec(`
    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_quotes_crop_obs ON price_quotes(crop, observed_at);
    CREATE INDEX IF NOT EXISTS idx_quotes_market_obs ON price_quotes(market_id, observed_at);
    CREATE INDEX IF NOT EXISTS idx_quotes_source_obs ON price_quotes(source, observed_at);
    CREATE INDEX IF NOT EXISTS idx_buyers_crop ON buyers(crop);
    CREATE INDEX IF NOT EXISTS idx_buyers_province ON buyers(province);
    CREATE INDEX IF NOT EXISTS idx_buyers_type ON buyers(type);
    CREATE INDEX IF NOT EXISTS idx_buyers_verified ON buyers(verified_source);
  `);
  
  return db;
}

export async function resetDb(dbPath = process.env.PRICES_DB_PATH || "data/app.db") {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  return await initDb(dbPath);
}

export async function backupDb(
  sourcePath = process.env.PRICES_DB_PATH || "data/app.db",
  backupPath?: string
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultBackupPath = `data/backup_${timestamp}.db`;
  const targetPath = backupPath || defaultBackupPath;
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    return targetPath;
  }
  
  throw new Error(`Source database not found: ${sourcePath}`);
}

export async function getDbStats(db: Database) {
  const stats = await db.all(`
    SELECT 
      'markets' as table_name, COUNT(*) as count FROM markets
    UNION ALL
    SELECT 'price_quotes', COUNT(*) FROM price_quotes
    UNION ALL
    SELECT 'buyers', COUNT(*) FROM buyers
  `);
  
  return stats.reduce((acc, row) => {
    acc[row.table_name] = row.count;
    return acc;
  }, {} as Record<string, number>);
}

export async function getPriceStats(db: Database, crop?: string) {
  const whereClause = crop ? `WHERE crop = '${crop}'` : '';
  
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_quotes,
      COUNT(DISTINCT crop) as crops,
      COUNT(DISTINCT source) as sources,
      COUNT(DISTINCT market_id) as markets,
      MIN(observed_at) as earliest_quote,
      MAX(observed_at) as latest_quote
    FROM price_quotes
    ${whereClause}
  `);
  
  return stats;
}

export async function getBuyerStats(db: Database, crop?: string) {
  const whereClause = crop ? `WHERE crop = '${crop}'` : '';
  
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_buyers,
      COUNT(DISTINCT crop) as crops,
      COUNT(DISTINCT type) as types,
      COUNT(DISTINCT province) as provinces,
      COUNT(DISTINCT verified_source) as verified_sources
    FROM buyers
    ${whereClause}
  `);
  
  return stats;
}

export async function cleanupOldData(db: Database, daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffIso = cutoffDate.toISOString();
  
  const result = await db.run(`
    DELETE FROM price_quotes 
    WHERE observed_at < ?
  `, cutoffIso);
  
  return result.changes;
}

export async function vacuumDb(db: Database) {
  await db.exec("VACUUM");
}

export async function analyzeDb(db: Database) {
  await db.exec("ANALYZE");
}
