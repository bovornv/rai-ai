const Database = require('sqlite3').Database;
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.SHOPTICKET_DB_PATH || "data/app.db";

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Migration SQL files
const migrations = [
  {
    name: '001-shop-tickets-schema',
    sql: `
-- shops & staff
CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_th TEXT NOT NULL,
  province_code TEXT, 
  amphoe_code TEXT, 
  tambon_code TEXT,
  address TEXT, 
  phone TEXT, 
  line_id TEXT,
  referral_code TEXT UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- product classes (neutral, not brand-biased)
CREATE TABLE IF NOT EXISTS product_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name_th TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- tickets
CREATE TABLE IF NOT EXISTS shop_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  crop TEXT NOT NULL,
  diagnosis_key TEXT NOT NULL,
  severity INTEGER,
  recommended_classes TEXT NOT NULL,
  dosage_note TEXT,
  rai REAL,
  status TEXT NOT NULL,
  shop_id INTEGER,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  redeemed_at TEXT,
  hmac_sig TEXT NOT NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- what was actually sold (recorded at counter)
CREATE TABLE IF NOT EXISTS ticket_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  shop_id INTEGER NOT NULL,
  item_desc TEXT NOT NULL,
  class_key TEXT,
  qty REAL, 
  unit TEXT,
  price_thb REAL,
  total_thb REAL NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES shop_tickets(id),
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user ON shop_tickets(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON shop_tickets(status, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_expires ON shop_tickets(expires_at);
CREATE INDEX IF NOT EXISTS idx_sales_shop ON ticket_sales(shop_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_ticket ON ticket_sales(ticket_id);
CREATE INDEX IF NOT EXISTS idx_shops_referral ON shops(referral_code);
CREATE INDEX IF NOT EXISTS idx_shops_province ON shops(province_code, is_active);
`
  },
  {
    name: '002-sample-data',
    sql: `
-- Insert default product classes
INSERT OR IGNORE INTO product_classes (key, name_th, name_en, description) VALUES
('fungicide_triazole', 'ยาฆ่าเชื้อราไตรอะโซล', 'Triazole Fungicide', 'ยาฆ่าเชื้อราประเภทไตรอะโซล'),
('fungicide_strobilurin', 'ยาฆ่าเชื้อราสโตรบิลูริน', 'Strobilurin Fungicide', 'ยาฆ่าเชื้อราประเภทสโตรบิลูริน'),
('insecticide_neonicotinoid', 'ยาฆ่าแมลงนีโอนิโคตินอยด์', 'Neonicotinoid Insecticide', 'ยาฆ่าแมลงประเภทนีโอนิโคตินอยด์'),
('insecticide_pyrethroid', 'ยาฆ่าแมลงไพรีทรอยด์', 'Pyrethroid Insecticide', 'ยาฆ่าแมลงประเภทไพรีทรอยด์'),
('fertilizer_npk', 'ปุ๋ย NPK', 'NPK Fertilizer', 'ปุ๋ยเคมี NPK'),
('fertilizer_organic', 'ปุ๋ยอินทรีย์', 'Organic Fertilizer', 'ปุ๋ยอินทรีย์'),
('ppe_n95', 'หน้ากาก N95', 'N95 Mask', 'หน้ากากป้องกันฝุ่นละออง N95'),
('ppe_gloves', 'ถุงมือ', 'Gloves', 'ถุงมือป้องกันสารเคมี'),
('ppe_goggles', 'แว่นตา', 'Safety Goggles', 'แว่นตาป้องกันสารเคมี'),
('sprayer_equipment', 'อุปกรณ์ฉีดพ่น', 'Sprayer Equipment', 'อุปกรณ์ฉีดพ่นสารเคมี');

-- Insert sample shops for MVP
INSERT OR IGNORE INTO shops (name_th, province_code, amphoe_code, tambon_code, address, phone, line_id, referral_code) VALUES
('ร้านเกษตรกรไทย', '30', '3001', '300101', '123 ถนนเกษตร ต.ในเมือง อ.เมือง จ.นครราชสีมา 30000', '044-123-456', '@kasetthai', 'KASET001'),
('ศูนย์เกษตรชุมชน', '30', '3002', '300201', '456 ถนนชุมชน ต.ปากช่อง อ.ปากช่อง จ.นครราชสีมา 30130', '044-234-567', '@community', 'COMM002'),
('ร้านปุ๋ยและยา', '30', '3003', '300301', '789 ถนนเกษตร ต.สีคิ้ว อ.สีคิ้ว จ.นครราชสีมา 30140', '044-345-678', '@fertilizer', 'FERT003');
`
  }
];

async function runMigrations() {
  console.log('🔄 Starting database migration...');
  console.log('📁 Database path:', DB_PATH);

  return new Promise((resolve, reject) => {
    const db = new Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Failed to open database:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Database opened successfully');
    });

    let completed = 0;
    const total = migrations.length;

    function runNextMigration() {
      if (completed >= total) {
        // Verify tables
        db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
          if (err) {
            console.error('❌ Failed to verify tables:', err.message);
            reject(err);
            return;
          }
          
          console.log('📊 Database tables:', tables.map(t => t.name).join(', '));
          
          // Check sample data
          db.get("SELECT COUNT(*) as count FROM shops", (err, result) => {
            if (err) {
              console.log('⚠️ Could not count shops');
            } else {
              console.log(`🏪 Sample shops: ${result.count}`);
            }
            
            db.get("SELECT COUNT(*) as count FROM product_classes", (err, result) => {
              if (err) {
                console.log('⚠️ Could not count product classes');
              } else {
                console.log(`📦 Product classes: ${result.count}`);
              }
              
              db.close((err) => {
                if (err) {
                  console.error('❌ Failed to close database:', err.message);
                  reject(err);
                } else {
                  console.log('✅ All migrations completed successfully!');
                  resolve();
                }
              });
            });
          });
        });
        return;
      }

      const migration = migrations[completed];
      console.log(`📄 Running migration: ${migration.name}`);

      db.exec(migration.sql, (err) => {
        if (err) {
          console.error(`❌ Migration ${migration.name} failed:`, err.message);
          reject(err);
          return;
        }
        
        console.log(`✅ Migration ${migration.name} completed`);
        completed++;
        runNextMigration();
      });
    }

    runNextMigration();
  });
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

module.exports = { runMigrations };
