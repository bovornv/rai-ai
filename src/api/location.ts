import { Router } from "express";
import { geocodeWithFallback, reverseWithFallback } from "../lib/location-service-fallback";

export const locationRouter = Router();

// API Keys (in production, use environment variables)
const API_KEYS = {
  GOOGLE_MAPS_API_KEY: "AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k",
  MAPBOX_ACCESS_TOKEN: "pk.eyJ1IjoiYm92b3JuIiwiYSI6ImNtZjl3ZWY3dzA3Ym8ycm9lbTQzcmo5ankifQ.LvMa5fl8cpeXL8Za5Vroug"
};

/** GET /api/location/geocode?q=...&lang=th */
locationRouter.get("/geocode", async (req, res) => {
  try {
    const { q: query, lang: language = "th" } = req.query as any;
    
    if (!query) {
      return res.status(400).json({ 
        error: "Query parameter 'q' is required",
        example: "/api/location/geocode?q=กรุงเทพมหานคร&lang=th"
      });
    }

    const results = await geocodeWithFallback(String(query), API_KEYS);

    res.json({
      query,
      language,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Geocoding error:", error);
    res.status(500).json({ 
      error: "Geocoding failed", 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/** GET /api/location/reverse-geocode?lat=..&lon=..&lang=th */
locationRouter.get("/reverse-geocode", async (req, res) => {
  try {
    const { lat, lon, lang: language = "th" } = req.query as any;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: "Parameters 'lat' and 'lon' are required",
        example: "/api/location/reverse-geocode?lat=13.7563&lon=100.5018&lang=th"
      });
    }

    const latNum = parseFloat(String(lat));
    const lonNum = parseFloat(String(lon));
    
    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({ 
        error: "Invalid latitude or longitude values",
        lat, lon
      });
    }

    const results = await reverseWithFallback(latNum, lonNum, API_KEYS);

    res.json({
      lat: latNum,
      lon: lonNum,
      language,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Reverse geocoding error:", error);
    res.status(500).json({ 
      error: "Reverse geocoding failed", 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/** GET /api/location/health */
locationRouter.get("/health", async (req, res) => {
  try {
    res.json({
      status: "healthy",
      providers: ["google", "mapbox"],
      fallback: "Google → Mapbox",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
