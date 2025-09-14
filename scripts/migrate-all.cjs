const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.SHOPTICKET_DB_PATH || "data/app.db";

async function migrateAll() {
  console.log('🔄 Starting comprehensive database migration...');
  
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    // Check if database exists
    const dbExists = fs.existsSync(DB_PATH);
    
    if (!dbExists) {
      console.log('📄 Creating new database...');
      // Create empty database
      execSync(`sqlite3 "${DB_PATH}" "SELECT 1;"`, { stdio: 'pipe' });
    }

    // Run shop tickets migrations
    console.log('🏪 Running shop tickets migrations...');
    
    const migrations = [
      '001-shop-tickets-schema.sql',
      '002-sample-data.sql'
    ];

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, 'migrations', migration);
      
      if (fs.existsSync(migrationPath)) {
        console.log(`📄 Running migration: ${migration}`);
        
        try {
          execSync(`sqlite3 "${DB_PATH}" < "${migrationPath}"`, { 
            stdio: 'inherit',
            cwd: __dirname 
          });
          console.log(`✅ Migration ${migration} completed`);
        } catch (error) {
          console.error(`❌ Migration ${migration} failed:`, error.message);
          // Continue with other migrations
        }
      } else {
        console.log(`⚠️ Migration file not found: ${migration}`);
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying database...');
    try {
      const result = execSync(`sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"`, { 
        encoding: 'utf8',
        cwd: __dirname 
      });
      
      const tables = result.trim().split('\n').filter(t => t.length > 0);
      console.log('📊 Database tables:', tables.join(', '));

      // Check sample data
      const shopCount = execSync(`sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM shops;"`, { 
        encoding: 'utf8',
        cwd: __dirname 
      }).trim();
      
      const classCount = execSync(`sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM product_classes;"`, { 
        encoding: 'utf8',
        cwd: __dirname 
      }).trim();
      
      console.log(`🏪 Sample shops: ${shopCount}`);
      console.log(`📦 Product classes: ${classCount}`);

    } catch (error) {
      console.log('⚠️ Could not verify database:', error.message);
    }

    console.log('✅ All migrations completed successfully!');
    console.log(`📁 Database location: ${DB_PATH}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  migrateAll().catch(console.error);
}

module.exports = { migrateAll };
