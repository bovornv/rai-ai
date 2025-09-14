# COD-AB Thailand Areas System

This system provides Thailand administrative boundaries (provinces, amphoes, tambons) using COD-AB data with TIS-1099 codes.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Download COD-AB Data
Download the Thailand administrative boundaries from HDX:
- [COD-AB Thailand](https://data.humdata.org/dataset/cod-ab-tha)
- Place the GeoJSON files in `vendor/cod-ab-th/`:
  - `tha_adm1.geojson` (provinces)
  - `tha_adm2.geojson` (amphoes/districts)
  - `tha_adm3.geojson` (tambons/subdistricts)

### 3. Seed Database
```bash
npm run db:areas:seed
```

### 4. Start Server
```bash
npm run api:areas
```

### 5. Test API
```bash
# Get all provinces
curl "http://localhost:3000/api/location/areas?level=province"

# Get amphoes for Bangkok
curl "http://localhost:3000/api/location/areas?level=amphoe&parent=TH-10"

# Get tambons for Phra Nakhon district
curl "http://localhost:3000/api/location/areas?level=tambon&parent=TH-1001"

# Search areas
curl "http://localhost:3000/api/location/areas/search?q=กรุงเทพ"

# Get statistics
curl "http://localhost:3000/api/location/areas/stats"
```

## Project Structure

```
your-project/
├─ vendor/                           # raw source files (never edited)
│  └─ cod-ab-th/
│     ├─ tha_adm1.geojson           # provinces (ADM1)
│     ├─ tha_adm2.geojson           # amphoes/districts (ADM2)
│     ├─ tha_adm3.geojson           # tambons/subdistricts (ADM3)
│     └─ README.md                  # dataset source + version/date
├─ data/                             # app runtime artifacts
│  └─ app.db                        # SQLite after seeding
├─ src/
│  ├─ db/
│  │  └─ schema/
│  │     └─ areas.sql               # database schema
│  ├─ api/
│  │  └─ areas.ts                   # /api/location/areas handler
│  └─ lib/
│     └─ location-service*.ts       # geocode & reverse logic
├─ scripts/
│  └─ seed-codab.ts                 # database seeder
├─ src/config/areas.ts              # configuration
├─ package.json
└─ README.md
```

## API Endpoints

### Areas API
- `GET /api/location/areas?level=province` - Get all provinces
- `GET /api/location/areas?level=amphoe&parent=TH-10` - Get amphoes for province
- `GET /api/location/areas?level=tambon&parent=TH-1001` - Get tambons for amphoe
- `GET /api/location/areas/search?q=กรุงเทพ` - Search areas
- `GET /api/location/areas/stats` - Get statistics
- `GET /api/location/areas/health` - Health check

### Location API
- `GET /api/location/geocode?q=กรุงเทพมหานคร` - Forward geocoding
- `GET /api/location/reverse-geocode?lat=13.7563&lon=100.5018` - Reverse geocoding
- `GET /api/location/health` - Health check

## Database Schema

### Provinces (ADM1)
- `code` - TIS-1099 code (e.g., "TH-10")
- `name_th` - Thai name (e.g., "กรุงเทพมหานคร")
- `name_en` - English name (e.g., "Bangkok")
- `centroid_lat`, `centroid_lon` - Calculated centroids

### Amphoes (ADM2)
- `code` - TIS-1099 code (e.g., "TH-1001")
- `name_th` - Thai name (e.g., "เขตพระนคร")
- `name_en` - English name (e.g., "Phra Nakhon")
- `province_code` - Parent province code
- `centroid_lat`, `centroid_lon` - Calculated centroids

### Tambons (ADM3)
- `code` - TIS-1099 code (e.g., "TH-100101")
- `name_th` - Thai name (e.g., "ตำบลพระบรมมหาราชวัง")
- `name_en` - English name (e.g., "Phra Borom Maha Ratchawang")
- `amphoe_code` - Parent amphoe code
- `province_code` - Parent province code
- `centroid_lat`, `centroid_lon` - Calculated centroids

## NPM Scripts

- `npm run db:areas:seed` - Seed database from COD-AB files
- `npm run db:areas:reseed` - Remove database and reseed
- `npm run api:areas` - Start server for testing

## Configuration

Environment variables (set in `.env.local` or `src/config/areas.ts`):
- `AREAS_DB_PATH` - SQLite database path (default: `./data/app.db`)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `MAPBOX_ACCESS_TOKEN` - Mapbox access token

## Updates

To update the data:
1. Download new COD-AB files from HDX
2. Replace files in `vendor/cod-ab-th/`
3. Run `npm run db:areas:reseed`

## Sanity Checks

Expected counts:
- Provinces: ~77 (includes Bangkok)
- Amphoes: ~900+ districts
- Tambons: ~7000+ subdistricts

For Bangkok (TH-10):
- Amphoes: >40 districts
- Tambons: >100 subdistricts

## Troubleshooting

### Database Issues
- Ensure `data/` directory exists
- Check file permissions
- Verify GeoJSON files are valid

### API Issues
- Check server logs
- Verify database connection
- Test with health endpoints

### Seeding Issues
- Verify GeoJSON file paths
- Check file format and properties
- Ensure required dependencies are installed
