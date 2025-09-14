import { openShopDb } from "../api/shop-tickets";
import { expireOldTickets } from "../lib/shop-ticket-service";

// Run every hour to expire old tickets
export async function runTicketExpiry() {
  try {
    console.log("🕐 Running ticket expiry check...");
    
    const db = await openShopDb();
    const expiredCount = await expireOldTickets(db);
    
    if (expiredCount > 0) {
      console.log(`✅ Expired ${expiredCount} old tickets`);
    } else {
      console.log("ℹ️ No tickets to expire");
    }
    
    await db.close();
  } catch (error) {
    console.error("❌ Ticket expiry check failed:", error);
  }
}

// Run immediately if called directly
if (require.main === module) {
  runTicketExpiry().catch(console.error);
}
