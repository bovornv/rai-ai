import { Database } from "sqlite";
import { NormalizedQuote, Buyer, Market, PriceAlert } from "./types";

// Market operations
export async function ensureMarket(
  db: Database, 
  key: string, 
  name: string, 
  location_code?: string
): Promise<number> {
  await db.run(
    `INSERT OR IGNORE INTO markets (key, name, location_code) VALUES (?, ?, ?)`,
    key, name, location_code ?? null
  );
  const row = await db.get(`SELECT id FROM markets WHERE key=?`, key);
  return row?.id as number;
}

export async function getMarket(db: Database, key: string): Promise<Market | null> {
  const row = await db.get(`SELECT * FROM markets WHERE key=?`, key);
  return row as Market | null;
}

export async function getAllMarkets(db: Database): Promise<Market[]> {
  const rows = await db.all(`SELECT * FROM markets ORDER BY name`);
  return rows as Market[];
}

// Price quote operations
export async function upsertQuote(db: Database, q: NormalizedQuote): Promise<void> {
  const marketId = q.market_key
    ? (await db.get(`SELECT id FROM markets WHERE key=?`, q.market_key))?.id ?? null
    : null;

  await db.run(
    `INSERT OR IGNORE INTO price_quotes
     (crop, variety, grade, size, unit, price_min, price_max, currency, source, market_id, observed_at, raw_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    q.crop, q.variety ?? null, q.grade ?? null, q.size ?? null, q.unit,
    q.price_min, q.price_max, q.currency, q.source, marketId, q.observed_at, q.raw_text ?? null
  );
}

export async function upsertMany(db: Database, quotes: NormalizedQuote[]): Promise<void> {
  await db.exec("BEGIN");
  try {
    for (const q of quotes) {
      await upsertQuote(db, q);
    }
    await db.exec("COMMIT");
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  }
}

export async function getLatestQuotes(
  db: Database,
  crop: string,
  marketKey?: string,
  limit = 50
): Promise<NormalizedQuote[]> {
  const whereClause = marketKey 
    ? `WHERE p.crop = ? AND m.key = ?`
    : `WHERE p.crop = ? AND p.market_id IS NULL`;
  
  const params = marketKey ? [crop, marketKey] : [crop];
  
  const rows = await db.all(`
    SELECT p.*, m.key as market_key, m.name as market_name
    FROM price_quotes p
    LEFT JOIN markets m ON p.market_id = m.id
    ${whereClause}
    ORDER BY p.observed_at DESC
    LIMIT ?
  `, ...params, limit);
  
  return rows.map(row => ({
    crop: row.crop,
    variety: row.variety,
    grade: row.grade,
    size: row.size,
    unit: row.unit,
    price_min: row.price_min,
    price_max: row.price_max,
    currency: row.currency,
    source: row.source,
    market_key: row.market_key,
    observed_at: row.observed_at,
    raw_text: row.raw_text
  }));
}

export async function getPriceHistory(
  db: Database,
  crop: string,
  marketKey?: string,
  fromDate?: string,
  toDate?: string,
  groupBy: "hour" | "day" | "week" = "day"
): Promise<NormalizedQuote[]> {
  let whereClause = `WHERE p.crop = ?`;
  const params: any[] = [crop];
  
  if (marketKey) {
    whereClause += ` AND m.key = ?`;
    params.push(marketKey);
  }
  
  if (fromDate) {
    whereClause += ` AND p.observed_at >= ?`;
    params.push(fromDate);
  }
  
  if (toDate) {
    whereClause += ` AND p.observed_at <= ?`;
    params.push(toDate);
  }
  
  const groupByClause = groupBy === "hour" 
    ? "strftime('%Y-%m-%d %H:00:00', p.observed_at)"
    : groupBy === "week"
    ? "strftime('%Y-%W', p.observed_at)"
    : "date(p.observed_at)";
  
  const rows = await db.all(`
    SELECT 
      p.crop,
      p.variety,
      p.grade,
      p.size,
      p.unit,
      MIN(p.price_min) as price_min,
      MAX(p.price_max) as price_max,
      p.currency,
      p.source,
      m.key as market_key,
      ${groupByClause} as observed_at,
      COUNT(*) as quote_count
    FROM price_quotes p
    LEFT JOIN markets m ON p.market_id = m.id
    ${whereClause}
    GROUP BY p.crop, p.variety, p.grade, p.size, p.unit, p.currency, p.source, m.key, ${groupByClause}
    ORDER BY observed_at DESC
  `, ...params);
  
  return rows.map(row => ({
    crop: row.crop,
    variety: row.variety,
    grade: row.grade,
    size: row.size,
    unit: row.unit,
    price_min: row.price_min,
    price_max: row.price_max,
    currency: row.currency,
    source: row.source,
    market_key: row.market_key,
    observed_at: row.observed_at
  }));
}

// Buyer operations
export async function upsertBuyer(db: Database, buyer: Buyer): Promise<number> {
  if (buyer.id) {
    // Update existing buyer
    await db.run(`
      UPDATE buyers SET
        crop = ?, name_th = ?, name_en = ?, type = ?, province = ?, district = ?,
        address = ?, phone = ?, line_id = ?, website = ?, email = ?,
        verified_source = ?, last_checked_at = ?, updated_at = ?
      WHERE id = ?
    `, buyer.crop, buyer.name_th, buyer.name_en, buyer.type, buyer.province, buyer.district,
       buyer.address, buyer.phone, buyer.line_id, buyer.website, buyer.email,
       buyer.verified_source, buyer.last_checked_at, new Date().toISOString(), buyer.id);
    return buyer.id;
  } else {
    // Insert new buyer
    const result = await db.run(`
      INSERT INTO buyers
      (crop, name_th, name_en, type, province, district, address, phone, line_id, website, email, verified_source, last_checked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, buyer.crop, buyer.name_th, buyer.name_en, buyer.type, buyer.province, buyer.district,
       buyer.address, buyer.phone, buyer.line_id, buyer.website, buyer.email,
       buyer.verified_source, buyer.last_checked_at);
    return result.lastID!;
  }
}

export async function getBuyers(
  db: Database,
  crop?: string,
  province?: string,
  type?: string,
  verified_source?: string,
  limit = 100
): Promise<Buyer[]> {
  let whereClause = "WHERE 1=1";
  const params: any[] = [];
  
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
  
  const rows = await db.all(`
    SELECT * FROM buyers
    ${whereClause}
    ORDER BY verified_source DESC, name_en ASC
    LIMIT ?
  `, ...params, limit);
  
  return rows as Buyer[];
}

export async function getBuyerById(db: Database, id: number): Promise<Buyer | null> {
  const row = await db.get(`SELECT * FROM buyers WHERE id = ?`, id);
  return row as Buyer | null;
}

export async function searchBuyers(
  db: Database,
  query: string,
  crop?: string,
  limit = 50
): Promise<Buyer[]> {
  const searchTerm = `%${query}%`;
  let whereClause = `WHERE (name_en LIKE ? OR name_th LIKE ? OR province LIKE ?)`;
  const params: any[] = [searchTerm, searchTerm, searchTerm];
  
  if (crop) {
    whereClause += " AND crop = ?";
    params.push(crop);
  }
  
  const rows = await db.all(`
    SELECT * FROM buyers
    ${whereClause}
    ORDER BY verified_source DESC, name_en ASC
    LIMIT ?
  `, ...params, limit);
  
  return rows as Buyer[];
}

// Price alert operations
export async function createPriceAlert(db: Database, alert: Omit<PriceAlert, "id" | "created_at">): Promise<number> {
  const result = await db.run(`
    INSERT INTO price_alerts
    (user_id, crop, variety, grade, size, market_key, target_price_min, target_price_max, unit, currency, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, alert.user_id, alert.crop, alert.variety, alert.grade, alert.size, alert.market_key,
     alert.target_price_min, alert.target_price_max, alert.unit, alert.currency, alert.is_active);
  
  return result.lastID!;
}

export async function getPriceAlerts(
  db: Database,
  userId?: string,
  isActive = true
): Promise<PriceAlert[]> {
  let whereClause = "WHERE 1=1";
  const params: any[] = [];
  
  if (userId) {
    whereClause += " AND user_id = ?";
    params.push(userId);
  }
  
  if (isActive) {
    whereClause += " AND is_active = ?";
    params.push(isActive);
  }
  
  const rows = await db.all(`
    SELECT * FROM price_alerts
    ${whereClause}
    ORDER BY created_at DESC
  `, ...params);
  
  return rows as PriceAlert[];
}

export async function checkPriceAlerts(db: Database): Promise<PriceAlert[]> {
  // Find alerts that should be triggered based on current prices
  const rows = await db.all(`
    SELECT DISTINCT pa.*
    FROM price_alerts pa
    JOIN price_quotes pq ON pa.crop = pq.crop
    LEFT JOIN markets m ON pa.market_key = m.key
    WHERE pa.is_active = 1
      AND pa.triggered_at IS NULL
      AND (
        (pa.market_key IS NULL AND pq.market_id IS NULL) OR
        (pa.market_key IS NOT NULL AND m.key = pa.market_key)
      )
      AND pq.observed_at >= datetime('now', '-1 day')
      AND (
        (pq.price_min <= pa.target_price_max AND pq.price_max >= pa.target_price_min) OR
        (pq.price_min >= pa.target_price_min AND pq.price_max <= pa.target_price_max)
      )
  `);
  
  return rows as PriceAlert[];
}

export async function triggerPriceAlert(db: Database, alertId: number): Promise<void> {
  await db.run(`
    UPDATE price_alerts 
    SET triggered_at = ?, is_active = 0
    WHERE id = ?
  `, new Date().toISOString(), alertId);
}

// Statistics and analytics
export async function getPriceStats(
  db: Database,
  crop?: string,
  marketKey?: string,
  days = 30
): Promise<{
  total_quotes: number;
  avg_price_min: number;
  avg_price_max: number;
  min_price: number;
  max_price: number;
  price_trend: "up" | "down" | "stable";
  last_updated: string;
}> {
  let whereClause = `WHERE observed_at >= datetime('now', '-${days} days')`;
  const params: any[] = [];
  
  if (crop) {
    whereClause += " AND crop = ?";
    params.push(crop);
  }
  
  if (marketKey) {
    whereClause += " AND m.key = ?";
    params.push(marketKey);
  }
  
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_quotes,
      AVG(price_min) as avg_price_min,
      AVG(price_max) as avg_price_max,
      MIN(price_min) as min_price,
      MAX(price_max) as max_price,
      MAX(observed_at) as last_updated
    FROM price_quotes p
    LEFT JOIN markets m ON p.market_id = m.id
    ${whereClause}
  `, ...params);
  
  // Calculate trend (simplified)
  const trend = await db.get(`
    SELECT 
      AVG(CASE WHEN observed_at >= datetime('now', '-7 days') THEN price_min END) as recent_avg,
      AVG(CASE WHEN observed_at < datetime('now', '-7 days') AND observed_at >= datetime('now', '-14 days') THEN price_min END) as previous_avg
    FROM price_quotes p
    LEFT JOIN markets m ON p.market_id = m.id
    ${whereClause}
  `, ...params);
  
  let priceTrend: "up" | "down" | "stable" = "stable";
  if (trend.recent_avg && trend.previous_avg) {
    const change = (trend.recent_avg - trend.previous_avg) / trend.previous_avg;
    if (change > 0.05) priceTrend = "up";
    else if (change < -0.05) priceTrend = "down";
  }
  
  return {
    total_quotes: stats.total_quotes || 0,
    avg_price_min: stats.avg_price_min || 0,
    avg_price_max: stats.avg_price_max || 0,
    min_price: stats.min_price || 0,
    max_price: stats.max_price || 0,
    price_trend: priceTrend,
    last_updated: stats.last_updated || new Date().toISOString()
  };
}

// Buyer operations
export async function getBuyerStats(db: Database): Promise<any> {
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_buyers,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_buyers,
      COUNT(CASE WHEN crop_type = 'rice' THEN 1 END) as rice_buyers,
      COUNT(CASE WHEN crop_type = 'durian' THEN 1 END) as durian_buyers,
      AVG(CASE WHEN rating IS NOT NULL THEN rating END) as avg_rating
    FROM buyers
  `);
  
  return {
    total_buyers: stats?.total_buyers || 0,
    active_buyers: stats?.active_buyers || 0,
    rice_buyers: stats?.rice_buyers || 0,
    durian_buyers: stats?.durian_buyers || 0,
    avg_rating: stats?.avg_rating || 0
  };
}