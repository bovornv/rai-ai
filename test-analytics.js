// Simple test to check if analytics modules work
import { openAnalyticsDb } from './src/lib/analytics/db.js';

console.log('Testing analytics...');

try {
  const db = await openAnalyticsDb();
  console.log('✅ Analytics DB opened successfully');
  await db.close();
  console.log('✅ Analytics DB closed successfully');
} catch (error) {
  console.error('❌ Analytics DB error:', error.message);
}
