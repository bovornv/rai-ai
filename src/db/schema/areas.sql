-- Thailand Administrative Areas Schema (COD-AB + TIS-1099)
-- Based on COD-AB Thailand administrative boundaries

-- Provinces (ADM1)
CREATE TABLE IF NOT EXISTS provinces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,           -- ADM1_PCODE (TIS-1099)
    name_th TEXT NOT NULL,               -- ADM1_TH
    name_en TEXT NOT NULL,               -- ADM1_EN
    centroid_lat REAL NOT NULL,          -- calculated from geometry
    centroid_lon REAL NOT NULL,          -- calculated from geometry
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Amphoes/Districts (ADM2)
CREATE TABLE IF NOT EXISTS amphoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,           -- ADM2_PCODE (TIS-1099)
    name_th TEXT NOT NULL,               -- ADM2_TH
    name_en TEXT NOT NULL,               -- ADM2_EN
    province_code TEXT NOT NULL,         -- ADM1_PCODE (foreign key)
    centroid_lat REAL NOT NULL,          -- calculated from geometry
    centroid_lon REAL NOT NULL,          -- calculated from geometry
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_code) REFERENCES provinces(code)
);

-- Tambons/Subdistricts (ADM3)
CREATE TABLE IF NOT EXISTS tambons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,           -- ADM3_PCODE (TIS-1099)
    name_th TEXT NOT NULL,               -- ADM3_TH
    name_en TEXT NOT NULL,               -- ADM3_EN
    amphoe_code TEXT NOT NULL,           -- ADM2_PCODE (foreign key)
    province_code TEXT NOT NULL,         -- ADM1_PCODE (foreign key)
    centroid_lat REAL NOT NULL,          -- calculated from geometry
    centroid_lon REAL NOT NULL,          -- calculated from geometry
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (amphoe_code) REFERENCES amphoes(code),
    FOREIGN KEY (province_code) REFERENCES provinces(code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provinces_code ON provinces(code);
CREATE INDEX IF NOT EXISTS idx_provinces_name_th ON provinces(name_th);
CREATE INDEX IF NOT EXISTS idx_provinces_name_en ON provinces(name_en);

CREATE INDEX IF NOT EXISTS idx_amphoes_code ON amphoes(code);
CREATE INDEX IF NOT EXISTS idx_amphoes_province_code ON amphoes(province_code);
CREATE INDEX IF NOT EXISTS idx_amphoes_name_th ON amphoes(name_th);
CREATE INDEX IF NOT EXISTS idx_amphoes_name_en ON amphoes(name_en);

CREATE INDEX IF NOT EXISTS idx_tambons_code ON tambons(code);
CREATE INDEX IF NOT EXISTS idx_tambons_amphoe_code ON tambons(amphoe_code);
CREATE INDEX IF NOT EXISTS idx_tambons_province_code ON tambons(province_code);
CREATE INDEX IF NOT EXISTS idx_tambons_name_th ON tambons(name_th);
CREATE INDEX IF NOT EXISTS idx_tambons_name_en ON tambons(name_en);

-- Triggers to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_provinces_updated_at 
    AFTER UPDATE ON provinces
    BEGIN
        UPDATE provinces SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_amphoes_updated_at 
    AFTER UPDATE ON amphoes
    BEGIN
        UPDATE amphoes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_tambons_updated_at 
    AFTER UPDATE ON tambons
    BEGIN
        UPDATE tambons SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
