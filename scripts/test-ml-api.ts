#!/usr/bin/env ts-node

/**
 * Test script for ML API endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testMLAPI() {
  console.log('🧪 Testing ML API endpoints...\n');

  try {
    // Test 1: GET /api/ml/models
    console.log('1️⃣ Testing GET /api/ml/models');
    const modelsResponse = await fetch(`${BASE_URL}/api/ml/models`);
    const modelsData = await modelsResponse.json();
    console.log('✅ Models endpoint:', modelsData);
    console.log(`   Found ${modelsData.models.length} models\n`);

    // Test 2: POST /api/ml/warmup
    console.log('2️⃣ Testing POST /api/ml/warmup');
    const warmupResponse = await fetch(`${BASE_URL}/api/ml/warmup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_ids: ['rice_v1'], batch: 1 })
    });
    const warmupData = await warmupResponse.json();
    console.log('✅ Warmup endpoint:', warmupData);
    console.log(`   Warmed ${warmupData.warmed.length} models\n`);

    // Test 3: POST /api/ml/classify (with base64 image)
    console.log('3️⃣ Testing POST /api/ml/classify');
    
    // Create a simple 1x1 pixel PNG as base64 for testing
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const classifyResponse = await fetch(`${BASE_URL}/api/ml/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: `data:image/png;base64,${testImageBase64}`,
        crop: 'rice',
        return_topk: 3
      })
    });
    
    if (classifyResponse.ok) {
      const classifyData = await classifyResponse.json();
      console.log('✅ Classify endpoint:', classifyData);
      console.log(`   Predicted: ${classifyData.chosen.label} (${(classifyData.chosen.confidence * 100).toFixed(1)}%)`);
      console.log(`   Uncertain: ${classifyData.uncertain}`);
      console.log(`   Timing: ${classifyData.timing_ms.total}ms total\n`);
    } else {
      const errorData = await classifyResponse.json();
      console.log('❌ Classify endpoint error:', errorData);
    }

    console.log('🎉 ML API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMLAPI();
