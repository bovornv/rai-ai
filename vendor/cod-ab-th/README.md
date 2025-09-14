# COD-AB Thailand Administrative Boundaries

## Dataset Source
- **Source**: Humanitarian Data Exchange (HDX)
- **Dataset**: Thailand Administrative Boundaries
- **URL**: https://data.humdata.org/dataset/cod-ab-tha
- **License**: Creative Commons Attribution for Intergovernmental Organisations

## Files
- `tha_adm1.geojson` - Provinces (ADM1) - ~77 provinces including Bangkok
- `tha_adm2.geojson` - Amphoes/Districts (ADM2) - ~900+ districts
- `tha_adm3.geojson` - Tambons/Subdistricts (ADM3) - ~7000+ subdistricts

## Usage
These files are used to seed the SQLite database for the Thailand areas API.

## Updates
To update the data:
1. Download new files from HDX
2. Replace the GeoJSON files in this directory
3. Run `npm run db:areas:reseed` to rebuild the database

## TIS-1099 Codes
The PCODE fields in these files correspond to TIS-1099 administrative codes used by the Thai government.
