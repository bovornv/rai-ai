#!/usr/bin/env ts-node

/**
 * COD-AB Thailand Areas Seeder
 * 
 * Seeds SQLite database with Thailand administrative boundaries from COD-AB GeoJSON files.
 * 
 * Usage:
 *   ts-node scripts/seed-codab.ts --db data/app.db --adm1 vendor/cod-ab-th/tha_adm1.geojson --adm2 vendor/cod-ab-th/tha_adm2.geojson --adm3 vendor/cod-ab-th/tha_adm3.geojson
 */

import { Database } from 'sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { centroid } from '@turf/centroid';
import { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import minimist from 'minimist';

interface CODABFeature extends Feature<Polygon | MultiPolygon> {
  properties: {
    ADM1_PCODE?: string;
    ADM1_TH?: string;
    ADM1_EN?: string;
    ADM2_PCODE?: string;
    ADM2_TH?: string;
    ADM2_EN?: string;
    ADM3_PCODE?: string;
    ADM3_TH?: string;
    ADM3_EN?: string;
    [key: string]: any;
  };
}

interface CODABCollection extends FeatureCollection<Polygon | MultiPolygon> {
  features: CODABFeature[];
}

class CODABSeeder {
  private db: Database;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
  }

  async initialize(): Promise<void> {
    console.log(`🗄️  Initializing database: ${this.dbPath}`);
    
    // Read and execute schema
    const schemaPath = join(process.cwd(), 'src/db/schema/areas.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    await this.runQuery(schema);
    console.log('✅ Database schema created');
  }

  async seedProvinces(geojsonPath: string): Promise<void> {
    console.log(`🌍 Seeding provinces from: ${geojsonPath}`);
    
    const geojson: CODABCollection = JSON.parse(readFileSync(geojsonPath, 'utf-8'));
    let count = 0;

    for (const feature of geojson.features) {
      const props = feature.properties;
      
      if (!props.ADM1_PCODE || !props.ADM1_TH || !props.ADM1_EN) {
        console.warn(`⚠️  Skipping province with missing data:`, props);
        continue;
      }

      // Calculate centroid
      const centroidPoint = centroid(feature);
      const [lon, lat] = centroidPoint.geometry.coordinates;

      await this.runQuery(`
        INSERT OR REPLACE INTO provinces (code, name_th, name_en, centroid_lat, centroid_lon)
        VALUES (?, ?, ?, ?, ?)
      `, [props.ADM1_PCODE, props.ADM1_TH, props.ADM1_EN, lat, lon]);

      count++;
    }

    console.log(`✅ Seeded ${count} provinces`);
  }

  async seedAmphoes(geojsonPath: string): Promise<void> {
    console.log(`🏘️  Seeding amphoes from: ${geojsonPath}`);
    
    const geojson: CODABCollection = JSON.parse(readFileSync(geojsonPath, 'utf-8'));
    let count = 0;

    for (const feature of geojson.features) {
      const props = feature.properties;
      
      if (!props.ADM2_PCODE || !props.ADM2_TH || !props.ADM2_EN || !props.ADM1_PCODE) {
        console.warn(`⚠️  Skipping amphoe with missing data:`, props);
        continue;
      }

      // Calculate centroid
      const centroidPoint = centroid(feature);
      const [lon, lat] = centroidPoint.geometry.coordinates;

      await this.runQuery(`
        INSERT OR REPLACE INTO amphoes (code, name_th, name_en, province_code, centroid_lat, centroid_lon)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [props.ADM2_PCODE, props.ADM2_TH, props.ADM2_EN, props.ADM1_PCODE, lat, lon]);

      count++;
    }

    console.log(`✅ Seeded ${count} amphoes`);
  }

  async seedTambons(geojsonPath: string): Promise<void> {
    console.log(`🏠 Seeding tambons from: ${geojsonPath}`);
    
    const geojson: CODABCollection = JSON.parse(readFileSync(geojsonPath, 'utf-8'));
    let count = 0;

    for (const feature of geojson.features) {
      const props = feature.properties;
      
      if (!props.ADM3_PCODE || !props.ADM3_TH || !props.ADM3_EN || !props.ADM2_PCODE || !props.ADM1_PCODE) {
        console.warn(`⚠️  Skipping tambon with missing data:`, props);
        continue;
      }

      // Calculate centroid
      const centroidPoint = centroid(feature);
      const [lon, lat] = centroidPoint.geometry.coordinates;

      await this.runQuery(`
        INSERT OR REPLACE INTO tambons (code, name_th, name_en, amphoe_code, province_code, centroid_lat, centroid_lon)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [props.ADM3_PCODE, props.ADM3_TH, props.ADM3_EN, props.ADM2_PCODE, props.ADM1_PCODE, lat, lon]);

      count++;
    }

    console.log(`✅ Seeded ${count} tambons`);
  }

  async runStats(): Promise<void> {
    console.log('\n📊 Database Statistics:');
    
    const provinceCount = await this.getCount('provinces');
    const amphoeCount = await this.getCount('amphoes');
    const tambonCount = await this.getCount('tambons');

    console.log(`   Provinces: ${provinceCount}`);
    console.log(`   Amphoes: ${amphoeCount}`);
    console.log(`   Tambons: ${tambonCount}`);

    // Sample data
    const sampleProvince = await this.runQuery('SELECT * FROM provinces LIMIT 1');
    if (sampleProvince.length > 0) {
      console.log(`\n📋 Sample Province:`, sampleProvince[0]);
    }
  }

  private async runQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  private async getCount(table: string): Promise<number> {
    const result = await this.runQuery(`SELECT COUNT(*) as count FROM ${table}`);
    return result[0].count;
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close(() => {
        console.log('🔒 Database connection closed');
        resolve();
      });
    });
  }
}

// Main execution
async function main() {
  const args = minimist(process.argv.slice(2));
  
  const dbPath = args.db || 'data/app.db';
  const adm1Path = args.adm1 || 'vendor/cod-ab-th/tha_adm1.geojson';
  const adm2Path = args.adm2 || 'vendor/cod-ab-th/tha_adm2.geojson';
  const adm3Path = args.adm3 || 'vendor/cod-ab-th/tha_adm3.geojson';

  console.log('🌾 COD-AB Thailand Areas Seeder');
  console.log('================================');
  console.log(`Database: ${dbPath}`);
  console.log(`ADM1: ${adm1Path}`);
  console.log(`ADM2: ${adm2Path}`);
  console.log(`ADM3: ${adm3Path}`);
  console.log('');

  const seeder = new CODABSeeder(dbPath);

  try {
    await seeder.initialize();
    await seeder.seedProvinces(adm1Path);
    await seeder.seedAmphoes(adm2Path);
    await seeder.seedTambons(adm3Path);
    await seeder.runStats();
    
    console.log('\n🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await seeder.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { CODABSeeder };
