import { Router } from "express";
import { openDb } from "../lib/db";
import { 
  getBuyers, 
  getBuyerById, 
  searchBuyers,
  getBuyerStats 
} from "../lib/prices/repo";
import { 
  Crop, 
  BuyerType, 
  VerifiedSource,
  getBuyerTypeDisplayName,
  getVerifiedSourceDisplayName
} from "../lib/prices/types";

export const buyersRouter = Router();

/**
 * GET /api/buyers
 * Get buyers directory with optional filtering
 */
buyersRouter.get("/", async (req, res) => {
  try {
    const { 
      crop, 
      province, 
      type, 
      verified_source, 
      search,
      limit = "100",
      offset = "0"
    } = req.query;
    
    if (crop && !["rice", "durian"].includes(crop as string)) {
      return res.status(400).json({
        error: "Invalid crop parameter. Must be 'rice' or 'durian'"
      });
    }

    if (type && !["exporter", "packhouse", "mill", "coop", "trader"].includes(type as string)) {
      return res.status(400).json({
        error: "Invalid type parameter. Must be 'exporter', 'packhouse', 'mill', 'coop', or 'trader'"
      });
    }

    if (verified_source && !["trea", "doa", "gacc", "manual"].includes(verified_source as string)) {
      return res.status(400).json({
        error: "Invalid verified_source parameter. Must be 'trea', 'doa', 'gacc', or 'manual'"
      });
    }

    const db = await openDb();
    
    let buyers: any[];
    if (search) {
      buyers = await searchBuyers(
        db, 
        search as string, 
        crop as Crop, 
        parseInt(limit as string)
      );
    } else {
      buyers = await getBuyers(
        db,
        crop as Crop,
        province as string,
        type as BuyerType,
        verified_source as VerifiedSource,
        parseInt(limit as string)
      );
    }

    // Apply offset
    const offsetNum = parseInt(offset as string);
    const limitedBuyers = buyers.slice(offsetNum, offsetNum + parseInt(limit as string));

    // Format buyers for response
    const formattedBuyers = limitedBuyers.map(buyer => ({
      id: buyer.id,
      crop: buyer.crop,
      name: {
        th: buyer.name_th,
        en: buyer.name_en
      },
      type: {
        key: buyer.type,
        display: getBuyerTypeDisplayName(buyer.type)
      },
      location: {
        province: buyer.province,
        district: buyer.district,
        address: buyer.address
      },
      contact: {
        phone: buyer.phone,
        email: buyer.email,
        website: buyer.website,
        line_id: buyer.line_id
      },
      verification: {
        source: buyer.verified_source,
        display: getVerifiedSourceDisplayName(buyer.verified_source),
        last_checked: buyer.last_checked_at
      },
      created_at: buyer.created_at,
      updated_at: buyer.updated_at
    }));

    // Get statistics
    const stats = await getBuyerStats(db, crop as Crop);

    res.json({
      buyers: formattedBuyers,
      pagination: {
        limit: parseInt(limit as string),
        offset: offsetNum,
        total: buyers.length,
        has_more: buyers.length > offsetNum + parseInt(limit as string)
      },
      filters: {
        crop: crop || "all",
        province: province || "all",
        type: type || "all",
        verified_source: verified_source || "all",
        search: search || null
      },
      statistics: {
        total_buyers: stats.total_buyers,
        crops: stats.crops,
        types: stats.types,
        provinces: stats.provinces,
        verified_sources: stats.verified_sources
      },
      updated_at: new Date().toISOString()
    });

    await db.close();
  } catch (error) {
    console.error("Buyers API error:", error);
    res.status(500).json({
      error: "Failed to fetch buyers",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/buyers/:id
 * Get specific buyer by ID
 */
buyersRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = parseInt(id);
    
    if (isNaN(buyerId)) {
      return res.status(400).json({
        error: "Invalid buyer ID"
      });
    }

    const db = await openDb();
    const buyer = await getBuyerById(db, buyerId);

    if (!buyer) {
      return res.status(404).json({
        error: "Buyer not found"
      });
    }

    const formattedBuyer = {
      id: buyer.id,
      crop: buyer.crop,
      name: {
        th: buyer.name_th,
        en: buyer.name_en
      },
      type: {
        key: buyer.type,
        display: getBuyerTypeDisplayName(buyer.type)
      },
      location: {
        province: buyer.province,
        district: buyer.district,
        address: buyer.address
      },
      contact: {
        phone: buyer.phone,
        email: buyer.email,
        website: buyer.website,
        line_id: buyer.line_id
      },
      verification: {
        source: buyer.verified_source,
        display: getVerifiedSourceDisplayName(buyer.verified_source),
        last_checked: buyer.last_checked_at
      },
      created_at: buyer.created_at,
      updated_at: buyer.updated_at
    };

    res.json({
      buyer: formattedBuyer,
      updated_at: new Date().toISOString()
    });

    await db.close();
  } catch (error) {
    console.error("Buyer detail API error:", error);
    res.status(500).json({
      error: "Failed to fetch buyer details",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/buyers/stats
 * Get buyer directory statistics
 */
buyersRouter.get("/stats", async (req, res) => {
  try {
    const { crop } = req.query;
    
    const db = await openDb();
    const stats = await getBuyerStats(db, crop as Crop);

    // Get additional statistics
    const typeStats = await db.all(`
      SELECT 
        type,
        COUNT(*) as count
      FROM buyers
      ${crop ? `WHERE crop = '${crop}'` : ''}
      GROUP BY type
      ORDER BY count DESC
    `);

    const provinceStats = await db.all(`
      SELECT 
        province,
        COUNT(*) as count
      FROM buyers
      WHERE province IS NOT NULL
      ${crop ? `AND crop = '${crop}'` : ''}
      GROUP BY province
      ORDER BY count DESC
      LIMIT 10
    `);

    const verificationStats = await db.all(`
      SELECT 
        verified_source,
        COUNT(*) as count
      FROM buyers
      ${crop ? `WHERE crop = '${crop}'` : ''}
      GROUP BY verified_source
      ORDER BY count DESC
    `);

    res.json({
      overview: {
        total_buyers: stats.total_buyers,
        crops: stats.crops,
        types: stats.types,
        provinces: stats.provinces,
        verified_sources: stats.verified_sources
      },
      by_type: typeStats.map(stat => ({
        type: stat.type,
        display: getBuyerTypeDisplayName(stat.type),
        count: stat.count
      })),
      by_province: provinceStats.map(stat => ({
        province: stat.province,
        count: stat.count
      })),
      by_verification: verificationStats.map(stat => ({
        source: stat.verified_source,
        display: getVerifiedSourceDisplayName(stat.verified_source),
        count: stat.count
      })),
      updated_at: new Date().toISOString()
    });

    await db.close();
  } catch (error) {
    console.error("Buyer stats API error:", error);
    res.status(500).json({
      error: "Failed to fetch buyer statistics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/buyers/search
 * Search buyers with advanced filters
 */
buyersRouter.get("/search", async (req, res) => {
  try {
    const { 
      q, 
      crop, 
      province, 
      type, 
      verified_source,
      has_phone,
      has_email,
      has_website,
      limit = "50"
    } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: "Missing search query parameter 'q'"
      });
    }

    const db = await openDb();
    
    // Build search query with additional filters
    let whereClause = `WHERE (name_en LIKE ? OR name_th LIKE ? OR province LIKE ?)`;
    const params: any[] = [`%${q}%`, `%${q}%`, `%${q}%`];
    
    if (crop) {
      whereClause += " AND crop = ?";
      params.push(crop);
    }
    
    if (province) {
      whereClause += " AND province = ?";
      params.push(province);
    }
    
    if (type) {
      whereClause += " AND type = ?";
      params.push(type);
    }
    
    if (verified_source) {
      whereClause += " AND verified_source = ?";
      params.push(verified_source);
    }
    
    if (has_phone === "true") {
      whereClause += " AND phone IS NOT NULL AND phone != ''";
    }
    
    if (has_email === "true") {
      whereClause += " AND email IS NOT NULL AND email != ''";
    }
    
    if (has_website === "true") {
      whereClause += " AND website IS NOT NULL AND website != ''";
    }

    const buyers = await db.all(`
      SELECT * FROM buyers
      ${whereClause}
      ORDER BY verified_source DESC, name_en ASC
      LIMIT ?
    `, ...params, parseInt(limit as string));

    const formattedBuyers = buyers.map(buyer => ({
      id: buyer.id,
      crop: buyer.crop,
      name: {
        th: buyer.name_th,
        en: buyer.name_en
      },
      type: {
        key: buyer.type,
        display: getBuyerTypeDisplayName(buyer.type)
      },
      location: {
        province: buyer.province,
        district: buyer.district,
        address: buyer.address
      },
      contact: {
        phone: buyer.phone,
        email: buyer.email,
        website: buyer.website,
        line_id: buyer.line_id
      },
      verification: {
        source: buyer.verified_source,
        display: getVerifiedSourceDisplayName(buyer.verified_source),
        last_checked: buyer.last_checked_at
      },
      created_at: buyer.created_at,
      updated_at: buyer.updated_at
    }));

    res.json({
      query: q,
      filters: {
        crop: crop || "all",
        province: province || "all",
        type: type || "all",
        verified_source: verified_source || "all",
        has_phone: has_phone === "true",
        has_email: has_email === "true",
        has_website: has_website === "true"
      },
      results: formattedBuyers,
      total: formattedBuyers.length,
      updated_at: new Date().toISOString()
    });

    await db.close();
  } catch (error) {
    console.error("Buyer search API error:", error);
    res.status(500).json({
      error: "Failed to search buyers",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/buyers/provinces
 * Get list of provinces with buyer counts
 */
buyersRouter.get("/provinces", async (req, res) => {
  try {
    const { crop } = req.query;
    
    const db = await openDb();
    
    const provinces = await db.all(`
      SELECT 
        province,
        COUNT(*) as buyer_count,
        COUNT(DISTINCT type) as type_count
      FROM buyers
      WHERE province IS NOT NULL
      ${crop ? `AND crop = '${crop}'` : ''}
      GROUP BY province
      ORDER BY buyer_count DESC
    `);

    res.json({
      provinces: provinces.map(province => ({
        name: province.province,
        buyer_count: province.buyer_count,
        type_count: province.type_count
      })),
      total_provinces: provinces.length,
      updated_at: new Date().toISOString()
    });

    await db.close();
  } catch (error) {
    console.error("Buyer provinces API error:", error);
    res.status(500).json({
      error: "Failed to fetch provinces",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
