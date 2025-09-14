// Spray Window Decision Logic Demo
// This file demonstrates the comprehensive spray window decision logic

import { sprayWindowTests, getSprayWindow, type CropType } from './weather-service';

// Demo function to show spray window logic in action
export const runSprayWindowDemo = async () => {
  console.log('🌦️ RaiAI Spray Window Decision Logic Demo');
  console.log('==========================================\n');

  // Run unit tests
  console.log('1. Running Unit Tests:');
  sprayWindowTests.runAll();
  console.log('');

  // Demo with different scenarios
  console.log('2. Demo Scenarios:');
  
  // Scenario 1: Good conditions
  console.log('\n📊 Scenario 1: Good Conditions (Rice)');
  try {
    const goodSpray = await getSprayWindow(14.0, 100.0, 'rice');
    console.log(`Status: ${goodSpray.status}`);
    console.log(`Reason: ${goodSpray.reason}`);
    console.log(`Recommendation: ${goodSpray.recommendation}`);
    if (goodSpray.verdict) {
      console.log(`Confidence: ${(goodSpray.verdict.confidence * 100).toFixed(0)}%`);
      console.log(`Next Safe Hour: ${goodSpray.verdict.next_safe_hour || 'N/A'}`);
    }
  } catch (error) {
    console.error('Error in good conditions demo:', error);
  }

  // Scenario 2: Durian (stricter wind thresholds)
  console.log('\n📊 Scenario 2: Durian Conditions (Stricter Wind)');
  try {
    const durianSpray = await getSprayWindow(14.0, 100.0, 'durian');
    console.log(`Status: ${durianSpray.status}`);
    console.log(`Reason: ${durianSpray.reason}`);
    console.log(`Recommendation: ${durianSpray.recommendation}`);
    if (durianSpray.verdict) {
      console.log(`Confidence: ${(durianSpray.verdict.confidence * 100).toFixed(0)}%`);
    }
  } catch (error) {
    console.error('Error in durian conditions demo:', error);
  }

  console.log('\n✅ Demo completed!');
  console.log('\nKey Features:');
  console.log('• 12-hour look-ahead analysis');
  console.log('• Thailand-first, monsoon-aware thresholds');
  console.log('• Crop-specific adjustments (rice vs durian)');
  console.log('• Wind, rain, and humidity considerations');
  console.log('• Drying buffer requirements');
  console.log('• Confidence scoring');
  console.log('• Next safe hour suggestions');
  console.log('• API-agnostic design (OpenWeather, Meteosource, TMD)');
};

// Export for use in components
export { getSprayWindow, type CropType } from './weather-service';
