# Price & Buyer Directory System

A comprehensive system for collecting, storing, and serving Thailand rice and durian price data along with buyer directory information.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run prices:server
# This will create the database and schema automatically
```

### 3. Ingest Data
```bash
# Run all ingesters
npm run prices:ingest

# Run specific sources
npm run prices:trea          # Rice prices from TREA
npm run prices:talaadthai    # Durian prices from TalaadThai
npm run prices:buyers        # Buyer directories
```

### 4. Start API Server
```bash
npm run prices:server
```

## 📊 Data Sources

### Price Data Sources

| Source | Crop | Data Type | Frequency | Unit | Description |
|--------|------|-----------|-----------|------|-------------|
| **TREA** | Rice | FOB Export Prices | Weekly | USD/MT | Thai Rice Exporters Association |
| **TalaadThai** | Durian | Wholesale Prices | Daily | THB/kg | Thailand's largest wholesale market |
| **USDA** | Rice | Reference Prices | Monthly | USD/MT | USDA Foreign Agricultural Service |

### Buyer Directory Sources

| Source | Crop | Type | Verification | Description |
|--------|------|------|-------------|-------------|
| **TREA Members** | Rice | Exporters | TREA | Official member directory |
| **DOA Packhouses** | Durian | Packhouses | DOA/GACC | Department of Agriculture approved facilities |

## 🗄️ Database Schema

### Markets Table
```sql
CREATE TABLE markets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,               -- e.g., "talaadthai_pathumthani"
  name TEXT NOT NULL,                     -- e.g., "TalaadThai (Pathum Thani)"
  location_code TEXT                      -- Province code
);
```

### Price Quotes Table
```sql
CREATE TABLE price_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop TEXT NOT NULL,                     -- "rice" | "durian"
  variety TEXT,                           -- e.g., "hom_mali", "monthong"
  grade TEXT,                             -- e.g., "100%B", "export"
  size TEXT,                              -- e.g., "L", "M", "80-100"
  unit TEXT NOT NULL,                     -- "USD/MT" | "THB/kg"
  price_min REAL NOT NULL,
  price_max REAL NOT NULL,
  currency TEXT NOT NULL,                 -- "USD" | "THB"
  source TEXT NOT NULL,                   -- "trea" | "talaadthai"
  market_id INTEGER,                      -- FK to markets
  observed_at TEXT NOT NULL,              -- ISO datetime (UTC)
  raw_text TEXT,                          -- Original scraped text
  UNIQUE(crop, variety, grade, size, unit, source, market_id, observed_at)
);
```

### Buyers Table
```sql
CREATE TABLE buyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop TEXT NOT NULL,                     -- "rice" | "durian"
  name_th TEXT,                           -- Thai name
  name_en TEXT,                           -- English name
  type TEXT NOT NULL,                     -- "exporter" | "packhouse" | "mill" | "coop"
  province TEXT,                          -- Province name
  district TEXT,                          -- District name
  address TEXT,                           -- Full address
  phone TEXT,                             -- Phone number
  line_id TEXT,                           -- LINE ID
  website TEXT,                           -- Website URL
  email TEXT,                             -- Email address
  verified_source TEXT,                   -- "trea" | "doa" | "gacc" | "manual"
  last_checked_at TEXT,                   -- ISO datetime (UTC)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## 🔌 API Endpoints

### Price Endpoints

#### GET /api/prices/current
Get current prices for a specific crop and optional market.

**Parameters:**
- `crop` (required): "rice" | "durian"
- `market` (optional): Market key
- `limit` (optional): Number of results (default: 50)

**Example:**
```bash
curl "http://localhost:3000/api/prices/current?crop=rice&market=trea_fob"
```

**Response:**
```json
{
  "crop": "rice",
  "market": {
    "id": 1,
    "key": "trea_fob",
    "name": "TREA FOB",
    "location_code": null
  },
  "quotes": [
    {
      "variety": "hom_mali",
      "size": null,
      "quotes": [
        {
          "crop": "rice",
          "variety": "hom_mali",
          "grade": "100%_a",
          "size": null,
          "unit": "USD/MT",
          "price_min": 610,
          "price_max": 620,
          "currency": "USD",
          "source": "trea",
          "market_key": null,
          "observed_at": "2024-01-15T09:00:00.000Z",
          "raw_text": "Hom Mali 100% A: 610-620"
        }
      ]
    }
  ],
  "stats": {
    "total_quotes": 15,
    "avg_price_min": 580.5,
    "avg_price_max": 595.2,
    "min_price": 520,
    "max_price": 650,
    "price_trend": "up",
    "last_updated": "2024-01-15T09:00:00.000Z"
  },
  "sources": [
    {
      "name": "TREA",
      "key": "trea",
      "last_update": "2024-01-15T09:00:00.000Z"
    }
  ],
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

#### GET /api/prices/history
Get historical price data with optional grouping.

**Parameters:**
- `crop` (required): "rice" | "durian"
- `market` (optional): Market key
- `from` (optional): Start date (ISO string)
- `to` (optional): End date (ISO string)
- `group_by` (optional): "hour" | "day" | "week" (default: "day")
- `limit` (optional): Number of results (default: 100)

**Example:**
```bash
curl "http://localhost:3000/api/prices/history?crop=durian&group_by=day&limit=30"
```

#### GET /api/prices/stats
Get price statistics for a specific crop and market.

**Parameters:**
- `crop` (required): "rice" | "durian"
- `market` (optional): Market key
- `days` (optional): Number of days to analyze (default: 30)

### Buyer Endpoints

#### GET /api/buyers
Get buyers directory with optional filtering.

**Parameters:**
- `crop` (optional): "rice" | "durian"
- `province` (optional): Province name
- `type` (optional): "exporter" | "packhouse" | "mill" | "coop" | "trader"
- `verified_source` (optional): "trea" | "doa" | "gacc" | "manual"
- `search` (optional): Search query
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```bash
curl "http://localhost:3000/api/buyers?crop=rice&province=Bangkok&type=exporter"
```

#### GET /api/buyers/:id
Get specific buyer by ID.

#### GET /api/buyers/search
Advanced search with multiple filters.

#### GET /api/buyers/stats
Get buyer directory statistics.

## 🤖 Data Ingestion

### Manual Ingestion
```bash
# Run all ingesters
npm run prices:ingest

# Run specific sources
npm run prices:trea
npm run prices:talaadthai
npm run prices:buyers

# Dry run (test without saving)
npm run prices:ingest -- --dry-run

# Verbose output
npm run prices:ingest -- --verbose

# Cleanup old data
npm run prices:ingest -- --cleanup --days=7
```

### Automated Ingestion (Cron)

#### Rice Prices (TREA) - Weekly
```bash
# Every Monday at 9 AM
0 9 * * 1 /path/to/npm run prices:ingest -- --source=trea
```

#### Durian Prices (TalaadThai) - Twice Daily
```bash
# Every day at 7 AM and 1 PM
0 7,13 * * * /path/to/npm run prices:ingest -- --source=talaadthai
```

#### Buyer Directories - Monthly
```bash
# First day of every month at 6 AM
0 6 1 * * /path/to/npm run prices:ingest -- --source=trea-members,doa-packhouses
```

#### All Sources - Daily
```bash
# Every day at 6 AM
0 6 * * * /path/to/npm run prices:ingest
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
PRICES_DB_PATH=data/app.db

# Server
PORT=3000
NODE_ENV=production

# Scraping (optional)
USER_AGENT="RaiAI/1.0 (+contact: ops@yourdomain.example)"
REQUEST_TIMEOUT=30000
```

### Database Configuration
The system uses SQLite for simplicity and portability. For production, consider:
- Regular backups
- Database optimization (VACUUM, ANALYZE)
- Monitoring disk space
- Consider PostgreSQL for high-volume scenarios

## 📈 Monitoring & Maintenance

### Health Check
```bash
curl http://localhost:3000/health
```

### Database Statistics
```bash
# Check database stats
curl http://localhost:3000/api/prices/stats?crop=rice
curl http://localhost:3000/api/buyers/stats
```

### Data Validation
The system includes built-in validation for:
- Price ranges (reasonable values)
- Currency consistency
- Required fields
- Data freshness

### Cleanup
```bash
# Clean up old data (older than 30 days)
npm run prices:ingest -- --cleanup --days=30
```

## 🚨 Troubleshooting

### Common Issues

1. **Scraping Failures**
   - Check website structure changes
   - Verify CSS selectors
   - Check rate limiting
   - Review error logs

2. **Database Issues**
   - Check disk space
   - Verify file permissions
   - Run database integrity check

3. **API Errors**
   - Check database connection
   - Verify input parameters
   - Review error logs

### Debug Mode
```bash
# Run with verbose output
npm run prices:ingest -- --verbose --dry-run
```

### Logs
Check console output for:
- Ingestion progress
- Error messages
- Performance metrics
- Data validation warnings

## 🔒 Security & Compliance

### Data Privacy
- No personal data stored
- Public price information only
- Respectful scraping practices

### Rate Limiting
- Built-in delays between requests
- Respectful User-Agent headers
- Error handling and retries

### Terms of Service
- Respect website ToS
- Monitor for changes
- Implement proper error handling

## 🚀 Production Deployment

### Server Setup
1. Install Node.js and npm
2. Clone repository
3. Install dependencies
4. Set up environment variables
5. Initialize database
6. Set up cron jobs
7. Configure monitoring

### Monitoring
- Health check endpoint
- Database statistics
- Error logging
- Performance metrics

### Backup Strategy
- Regular database backups
- Source code versioning
- Configuration backup
- Disaster recovery plan

## 📚 API Documentation

### OpenAPI/Swagger
The API endpoints are designed to be self-documenting. Consider adding:
- OpenAPI specification
- Interactive documentation
- Rate limiting documentation
- Authentication (if needed)

### SDK/Client Libraries
Consider creating client libraries for:
- JavaScript/TypeScript
- Python
- Mobile apps

## 🤝 Contributing

### Adding New Sources
1. Create new scraper in `src/lib/prices/sources/` or `src/lib/buyers/sources/`
2. Follow existing patterns
3. Add validation
4. Update CLI script
5. Add tests
6. Update documentation

### Data Format
Ensure new sources follow the normalized data format:
- Consistent field names
- Proper data types
- Required fields
- Validation rules

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to provide Thailand farmers with real-time price data and buyer contacts!** 🌾🥭📊
