import fs from "fs";
import path from "path";

// Mock database interface
interface Database {
  exec(sql: string): Promise<void>;
}

export async function runOutbreakRollup(db: Database) {
  try {
    console.log("[outbreak-rollup] Starting at", new Date().toISOString());
    
    // Read the rollup SQL from schema file
    const schemaPath = path.join(__dirname, "../db/schema/outbreaks.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");
    
    // Extract the rollup portion (after "-- Roll-up job")
    const rollupStart = sql.indexOf("-- Roll-up job");
    if (rollupStart === -1) {
      console.log("[outbreak-rollup] No rollup SQL found in schema file");
      return;
    }
    
    const rollupSql = sql.substring(rollupStart);
    
    // Execute the rollup
    await db.exec(rollupSql);
    
    console.log("[outbreak-rollup] Completed at", new Date().toISOString());
  } catch (error) {
    console.error("[outbreak-rollup] Failed:", error);
    throw error;
  }
}

// Example usage with a mock database
export async function runOutbreakRollupExample() {
  const mockDb: Database = {
    exec: async (sql: string) => {
      console.log("Executing rollup SQL:", sql.substring(0, 200) + "...");
    }
  };
  
  await runOutbreakRollup(mockDb);
}
