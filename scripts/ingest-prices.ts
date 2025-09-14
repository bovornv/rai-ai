#!/usr/bin/env ts-node

/**
 * Price and Buyer Data Ingestion Script
 * 
 * This script fetches price data from various sources and buyer directory information.
 * It's designed to be run via cron jobs for automated data collection.
 * 
 * Usage:
 *   npm run prices:ingest                    # Run all ingesters
 *   npm run prices:ingest -- --source=trea  # Run specific source
 *   npm run prices:ingest -- --crop=rice    # Run for specific crop
 *   npm run prices:ingest -- --dry-run      # Test without saving
 * 
 * Cron examples:
 *   # TREA rice prices (weekly)
 *   0 9 * * 1 /path/to/npm run prices:ingest -- --source=trea
 *   
 *   # TalaadThai durian prices (twice daily)
 *   0 7,13 * * * /path/to/npm run prices:ingest -- --source=talaadthai
 *   
 *   # All sources (daily)
 *   0 6 * * * /path/to/npm run prices:ingest
 */

import { openDb, getDbStats, cleanupOldData } from "../src/lib/db";
import { ingestTrea } from "../src/lib/prices/sources/trea";
import { ingestTalaadThai } from "../src/lib/prices/sources/talaadthai";
import { ingestTreaMembers } from "../src/lib/buyers/sources/trea-members";
import { ingestDoaPackhouses } from "../src/lib/buyers/sources/doa-packhouses";

interface IngestOptions {
  source?: string;
  crop?: string;
  dryRun: boolean;
  verbose: boolean;
  cleanup: boolean;
  daysToKeep: number;
}

interface IngestResult {
  source: string;
  success: boolean;
  count: number;
  error?: string;
  duration: number;
}

class PriceIngester {
  private options: IngestOptions;
  private results: IngestResult[] = [];

  constructor(options: IngestOptions) {
    this.options = options;
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    
    console.log("🚀 Starting price and buyer data ingestion...");
    console.log(`Options:`, this.options);
    
    if (this.options.dryRun) {
      console.log("🔍 DRY RUN MODE - No data will be saved");
    }

    try {
      const db = await openDb(process.env.PRICES_DB_PATH || "data/app.db");
      
      // Run price ingesters
      if (!this.options.source || this.options.source === "trea") {
        if (!this.options.crop || this.options.crop === "rice") {
          await this.runIngester("trea", () => ingestTrea(db));
        }
      }

      if (!this.options.source || this.options.source === "talaadthai") {
        if (!this.options.crop || this.options.crop === "durian") {
          await this.runIngester("talaadthai", () => ingestTalaadThai(db));
        }
      }

      // Run buyer ingesters
      if (!this.options.source || this.options.source === "trea-members") {
        if (!this.options.crop || this.options.crop === "rice") {
          await this.runIngester("trea-members", () => ingestTreaMembers(db));
        }
      }

      if (!this.options.source || this.options.source === "doa-packhouses") {
        if (!this.options.crop || this.options.crop === "durian") {
          await this.runIngester("doa-packhouses", () => ingestDoaPackhouses(db));
        }
      }

      // Cleanup old data if requested
      if (this.options.cleanup) {
        console.log(`🧹 Cleaning up data older than ${this.options.daysToKeep} days...`);
        const deletedCount = await cleanupOldData(db, this.options.daysToKeep);
        console.log(`✅ Cleaned up ${deletedCount} old records`);
      }

      // Show database statistics
      const stats = await getDbStats(db);
      console.log("📊 Database statistics:", stats);

      await db.close();
      
      // Print summary
      this.printSummary();
      
      const totalDuration = Date.now() - startTime;
      console.log(`⏱️  Total execution time: ${totalDuration}ms`);
      
    } catch (error) {
      console.error("❌ Ingestion failed:", error);
      process.exit(1);
    }
  }

  private async runIngester(name: string, ingester: () => Promise<number>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`\n📥 Running ${name} ingester...`);
      
      let count = 0;
      if (!this.options.dryRun) {
        count = await ingester();
      } else {
        console.log(`🔍 [DRY RUN] Would run ${name} ingester`);
        count = 0;
      }
      
      const duration = Date.now() - startTime;
      this.results.push({
        source: name,
        success: true,
        count,
        duration
      });
      
      console.log(`✅ ${name}: ${count} records processed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.results.push({
        source: name,
        success: false,
        count: 0,
        error: errorMessage,
        duration
      });
      
      console.error(`❌ ${name} failed:`, errorMessage);
      
      if (this.options.verbose) {
        console.error("Full error:", error);
      }
    }
  }

  private printSummary(): void {
    console.log("\n📋 Ingestion Summary");
    console.log("==================");
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${this.results.length}`);
    console.log(`❌ Failed: ${failed.length}/${this.results.length}`);
    
    if (successful.length > 0) {
      console.log("\nSuccessful ingesters:");
      successful.forEach(result => {
        console.log(`  • ${result.source}: ${result.count} records (${result.duration}ms)`);
      });
    }
    
    if (failed.length > 0) {
      console.log("\nFailed ingesters:");
      failed.forEach(result => {
        console.log(`  • ${result.source}: ${result.error} (${result.duration}ms)`);
      });
    }
    
    const totalRecords = successful.reduce((sum, r) => sum + r.count, 0);
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`\n📊 Total: ${totalRecords} records processed in ${totalDuration}ms`);
    
    if (failed.length > 0) {
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): IngestOptions {
  const args = process.argv.slice(2);
  const options: IngestOptions = {
    dryRun: false,
    verbose: false,
    cleanup: false,
    daysToKeep: 30
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith("--source=")) {
      options.source = arg.split("=")[1];
    } else if (arg.startsWith("--crop=")) {
      options.crop = arg.split("=")[1];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--cleanup") {
      options.cleanup = true;
    } else if (arg.startsWith("--days=")) {
      options.daysToKeep = parseInt(arg.split("=")[1]);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Price and Buyer Data Ingestion Script

Usage:
  npm run prices:ingest [options]

Options:
  --source=<name>     Run specific source (trea, talaadthai, trea-members, doa-packhouses)
  --crop=<name>       Run for specific crop (rice, durian)
  --dry-run          Test run without saving data
  --verbose, -v      Show detailed error information
  --cleanup          Clean up old data after ingestion
  --days=<number>    Days to keep data (default: 30)
  --help, -h         Show this help message

Examples:
  npm run prices:ingest
  npm run prices:ingest -- --source=trea --crop=rice
  npm run prices:ingest -- --dry-run --verbose
  npm run prices:ingest -- --cleanup --days=7

Cron Examples:
  # TREA rice prices (weekly on Monday at 9 AM)
  0 9 * * 1 /path/to/npm run prices:ingest -- --source=trea

  # TalaadThai durian prices (twice daily at 7 AM and 1 PM)
  0 7,13 * * * /path/to/npm run prices:ingest -- --source=talaadthai

  # All sources (daily at 6 AM)
  0 6 * * * /path/to/npm run prices:ingest

Environment Variables:
  PRICES_DB_PATH      Database file path (default: data/app.db)
  NODE_ENV           Environment (development, production)
`);
}

// Main execution
async function main(): Promise<void> {
  const options = parseArgs();
  const ingester = new PriceIngester(options);
  await ingester.run();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
