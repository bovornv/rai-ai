const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const DB_PATH = process.env.SHOPTICKET_DB_PATH || "data/app.db";

// Ensure migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

// Migration files to run in order
const migrations = [
  '001-shop-tickets-schema.sql',
  '002-sample-data.sql'
];

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  for (const migration of migrations) {
    const migrationPath = path.join(MIGRATIONS_DIR, migration);
    
    if (fs.existsSync(migrationPath)) {
      console.log(`📄 Running migration: ${migration}`);
      
      try {
        // Use sqlite3 command line tool to run the migration
        execSync(`sqlite3 "${DB_PATH}" < "${migrationPath}"`, { 
          stdio: 'inherit',
          cwd: __dirname 
        });
        console.log(`✅ Migration ${migration} completed`);
      } catch (error) {
        console.error(`❌ Migration ${migration} failed:`, error.message);
        process.exit(1);
      }
    } else {
      console.log(`⚠️ Migration file not found: ${migration}`);
    }
  }
  
  console.log('✅ All migrations completed successfully!');
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

module.exports = { runMigrations };
