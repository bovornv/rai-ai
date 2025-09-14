// Thailand Areas Configuration
export const AreasConfig = {
  // Database path
  DB_PATH: process.env.AREAS_DB_PATH || './data/app.db',
  
  // API Keys
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k',
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYm92b3JuIiwiYSI6ImNtZjl3ZWY3dzA3Ym8ycm9lbTQzcmo5ankifQ.LvMa5fl8cpeXL8Za5Vroug',
  
  // Development settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',
  
  // File paths
  ADM1_PATH: 'vendor/cod-ab-th/tha_adm1.geojson',
  ADM2_PATH: 'vendor/cod-ab-th/tha_adm2.geojson',
  ADM3_PATH: 'vendor/cod-ab-th/tha_adm3.geojson',
};
