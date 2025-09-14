import { Router } from "express";
import { Database } from "sqlite3";
import { join } from "path";

export const areasRouter = Router();

// Database connection
const dbPath = process.env.AREAS_DB_PATH || 'data/app.db';
let db: Database;

// Initialize database connection
function initDB(): Database {
  if (!db) {
    db = new Database(dbPath);
    console.log(`🗄️  Connected to areas database: ${dbPath}`);
  }
  return db;
}

// Helper function to run queries
function runQuery(sql: string, params: any[] = []): Promise<any[]> {
  const database = initDB();
  return new Promise((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Types
interface Area {
  code: string;
  name_th: string;
  name_en: string;
  centroid_lat: number;
  centroid_lon: number;
}

interface AreasResponse {
  level: 'province' | 'amphoe' | 'tambon';
  parent?: string;
  areas: Area[];
  total: number;
  timestamp: string;
}

/** GET /api/location/areas?level=province&parent=...&search=... */
areasRouter.get("/areas", async (req, res) => {
  try {
    const { level, parent, search } = req.query as any;
    
    if (!level || !['province', 'amphoe', 'tambon'].includes(level)) {
      return res.status(400).json({ 
        error: "Parameter 'level' is required and must be 'province', 'amphoe', or 'tambon'",
        example: "/api/location/areas?level=province"
      });
    }

    let sql: string;
    let params: any[] = [];

    switch (level) {
      case 'province':
        sql = `
          SELECT code, name_th, name_en, centroid_lat, centroid_lon
          FROM provinces
          ${search ? 'WHERE name_th LIKE ? OR name_en LIKE ?' : ''}
          ORDER BY name_th
        `;
        if (search) {
          const searchTerm = `%${search}%`;
          params = [searchTerm, searchTerm];
        }
        break;

      case 'amphoe':
        if (!parent) {
          return res.status(400).json({ 
            error: "Parameter 'parent' is required for amphoe level",
            example: "/api/location/areas?level=amphoe&parent=TH-10"
          });
        }
        sql = `
          SELECT code, name_th, name_en, centroid_lat, centroid_lon
          FROM amphoes
          WHERE province_code = ?
          ${search ? 'AND (name_th LIKE ? OR name_en LIKE ?)' : ''}
          ORDER BY name_th
        `;
        params = [parent];
        if (search) {
          const searchTerm = `%${search}%`;
          params.push(searchTerm, searchTerm);
        }
        break;

      case 'tambon':
        if (!parent) {
          return res.status(400).json({ 
            error: "Parameter 'parent' is required for tambon level",
            example: "/api/location/areas?level=tambon&parent=TH-1001"
          });
        }
        sql = `
          SELECT code, name_th, name_en, centroid_lat, centroid_lon
          FROM tambons
          WHERE amphoe_code = ?
          ${search ? 'AND (name_th LIKE ? OR name_en LIKE ?)' : ''}
          ORDER BY name_th
        `;
        params = [parent];
        if (search) {
          const searchTerm = `%${search}%`;
          params.push(searchTerm, searchTerm);
        }
        break;

      default:
        return res.status(400).json({ error: "Invalid level parameter" });
    }

    const areas = await runQuery(sql, params);

    const response: AreasResponse = {
      level: level as 'province' | 'amphoe' | 'tambon',
      parent,
      areas,
      total: areas.length,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    console.error("Areas lookup error:", error);
    res.status(500).json({ 
      error: "Areas lookup failed", 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/** GET /api/location/areas/search?q=...&level=... */
areasRouter.get("/areas/search", async (req, res) => {
  try {
    const { q: query, level } = req.query as any;
    
    if (!query) {
      return res.status(400).json({ 
        error: "Query parameter 'q' is required",
        example: "/api/location/areas/search?q=กรุงเทพ&level=province"
      });
    }

    const searchTerm = `%${query}%`;
    let sql: string;
    let params: any[] = [];

    if (level === 'province' || !level) {
      sql = `
        SELECT 'province' as level, code, name_th, name_en, centroid_lat, centroid_lon
        FROM provinces
        WHERE name_th LIKE ? OR name_en LIKE ?
        ORDER BY name_th
        LIMIT 20
      `;
      params = [searchTerm, searchTerm];
    } else if (level === 'amphoe') {
      sql = `
        SELECT 'amphoe' as level, code, name_th, name_en, centroid_lat, centroid_lon
        FROM amphoes
        WHERE name_th LIKE ? OR name_en LIKE ?
        ORDER BY name_th
        LIMIT 20
      `;
      params = [searchTerm, searchTerm];
    } else if (level === 'tambon') {
      sql = `
        SELECT 'tambon' as level, code, name_th, name_en, centroid_lat, centroid_lon
        FROM tambons
        WHERE name_th LIKE ? OR name_en LIKE ?
        ORDER BY name_th
        LIMIT 20
      `;
      params = [searchTerm, searchTerm];
    } else {
      return res.status(400).json({ 
        error: "Invalid level parameter. Must be 'province', 'amphoe', or 'tambon'"
      });
    }

    const results = await runQuery(sql, params);

    res.json({
      query,
      level: level || 'all',
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Area search error:", error);
    res.status(500).json({ 
      error: "Area search failed", 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/** GET /api/location/areas/stats */
areasRouter.get("/areas/stats", async (req, res) => {
  try {
    const [provinceCount, amphoeCount, tambonCount] = await Promise.all([
      runQuery('SELECT COUNT(*) as count FROM provinces'),
      runQuery('SELECT COUNT(*) as count FROM amphoes'),
      runQuery('SELECT COUNT(*) as count FROM tambons')
    ]);

    res.json({
      provinces: provinceCount[0].count,
      amphoes: amphoeCount[0].count,
      tambons: tambonCount[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    res.status(500).json({ 
      error: "Stats lookup failed", 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/** GET /api/location/areas/health */
areasRouter.get("/areas/health", async (req, res) => {
  try {
    // Test database connection
    await runQuery('SELECT 1');
    
    res.json({
      status: "healthy",
      database: dbPath,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: "unhealthy",
      error: error.message,
      database: dbPath,
      timestamp: new Date().toISOString()
    });
  }
});
