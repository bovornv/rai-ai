import { Database } from "sqlite";

export async function upsertFxRate(db: Database, dayISO: string, base: string, quote: string, rate: number) {
  await db.run(
    `INSERT OR REPLACE INTO fx_rates (day, base, quote, rate) VALUES (?, ?, ?, ?)`,
    dayISO.slice(0, 10), base.toUpperCase(), quote.toUpperCase(), rate
  );
}

/** Get the latest rate at or before the given day (YYYY-MM-DD or full ISO). */
export async function getFxRate(db: Database, base: string, quote: string, atISO?: string): Promise<number | null> {
  base = base.toUpperCase(); 
  quote = quote.toUpperCase();
  const day = (atISO ?? new Date().toISOString()).slice(0, 10);

  // Try same day
  let row = await db.get<{ rate: number }>(
    `SELECT rate FROM fx_rates WHERE day = ? AND base = ? AND quote = ?`,
    day, base, quote
  );
  if (row?.rate) return row.rate;

  // Fallback: latest before that day
  row = await db.get<{ rate: number }>(
    `SELECT rate FROM fx_rates WHERE base=? AND quote=? AND day <= ? ORDER BY day DESC LIMIT 1`,
    base, quote, day
  );
  return row?.rate ?? null;
}

/** Get all available currency pairs for a given day */
export async function getAvailableFxRates(db: Database, dayISO?: string): Promise<{ base: string; quote: string; rate: number }[]> {
  const day = (dayISO ?? new Date().toISOString()).slice(0, 10);
  
  const rows = await db.all<{ base: string; quote: string; rate: number }>(
    `SELECT base, quote, rate FROM fx_rates WHERE day = ? ORDER BY base, quote`,
    day
  );
  
  return rows;
}

/** Get FX rate history for a currency pair */
export async function getFxRateHistory(
  db: Database, 
  base: string, 
  quote: string, 
  fromDay?: string, 
  toDay?: string
): Promise<{ day: string; rate: number }[]> {
  base = base.toUpperCase();
  quote = quote.toUpperCase();
  
  let whereClause = "base = ? AND quote = ?";
  const params: any[] = [base, quote];
  
  if (fromDay) {
    whereClause += " AND day >= ?";
    params.push(fromDay.slice(0, 10));
  }
  
  if (toDay) {
    whereClause += " AND day <= ?";
    params.push(toDay.slice(0, 10));
  }
  
  const rows = await db.all<{ day: string; rate: number }>(
    `SELECT day, rate FROM fx_rates WHERE ${whereClause} ORDER BY day`,
    ...params
  );
  
  return rows;
}

/** Check if FX rate exists for a given day and currency pair */
export async function hasFxRate(db: Database, base: string, quote: string, dayISO?: string): Promise<boolean> {
  const rate = await getFxRate(db, base, quote, dayISO);
  return rate !== null && rate > 0;
}

/** Get the latest available date for FX rates */
export async function getLatestFxDate(db: Database): Promise<string | null> {
  const row = await db.get<{ day: string }>(
    `SELECT MAX(day) as day FROM fx_rates`
  );
  return row?.day ?? null;
}

/** Get FX rate statistics */
export async function getFxStats(db: Database): Promise<{
  total_rates: number;
  currency_pairs: number;
  date_range: { from: string; to: string };
  latest_date: string | null;
}> {
  const stats = await db.get<{
    total_rates: number;
    currency_pairs: number;
    min_day: string;
    max_day: string;
    latest_day: string;
  }>(`
    SELECT 
      COUNT(*) as total_rates,
      COUNT(DISTINCT base || '_' || quote) as currency_pairs,
      MIN(day) as min_day,
      MAX(day) as max_day,
      MAX(day) as latest_day
    FROM fx_rates
  `);
  
  return {
    total_rates: stats?.total_rates || 0,
    currency_pairs: stats?.currency_pairs || 0,
    date_range: {
      from: stats?.min_day || '',
      to: stats?.max_day || ''
    },
    latest_date: stats?.latest_day || null
  };
}
