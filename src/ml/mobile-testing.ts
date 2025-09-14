// Mobile Testing Framework
import { ModelMeta } from "../lib/ml-pipeline";
import { MobileModelConfig } from "./mobile-config";
import fs from "fs";
import path from "path";

export interface MobileTestConfig {
  modelId: string;
  platform: "android" | "ios" | "both";
  testImages: string[];
  expectedLabels: string[];
  performanceThresholds: {
    maxInferenceTimeMs: number;
    minAccuracy: number;
    maxMemoryUsageMB: number;
  };
  testCases: MobileTestCase[];
}

export interface MobileTestCase {
  id: string;
  name: string;
  imagePath: string;
  expectedLabel: string;
  expectedConfidence: number;
  description: string;
}

export interface MobileTestResult {
  testId: string;
  passed: boolean;
  actualLabel: string;
  actualConfidence: number;
  inferenceTimeMs: number;
  memoryUsageMB: number;
  error?: string;
  details: {
    expectedLabel: string;
    expectedConfidence: number;
    labelMatch: boolean;
    confidenceMatch: boolean;
    timeWithinThreshold: boolean;
    memoryWithinThreshold: boolean;
  };
}

export interface MobileTestSuite {
  config: MobileTestConfig;
  results: MobileTestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageInferenceTime: number;
    averageAccuracy: number;
    overallPass: boolean;
  };
}

export class MobileTestingFramework {
  private testDir: string;
  private resultsDir: string;

  constructor(testDir = "mobile_tests", resultsDir = "mobile_test_results") {
    this.testDir = testDir;
    this.resultsDir = resultsDir;
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.testDir, this.resultsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Create test configuration
  createTestConfig(
    modelId: string,
    platform: "android" | "ios" | "both" = "both"
  ): MobileTestConfig {
    const isDurian = modelId.includes('durian');
    
    return {
      modelId,
      platform,
      testImages: this.getTestImages(),
      expectedLabels: isDurian ? [
        "anthracnose",
        "phytophthora_foot_rot",
        "leaf_spot",
        "healthy"
      ] : [
        "rice_brown_spot",
        "rice_blast",
        "bacterial_leaf_blight",
        "healthy"
      ],
      performanceThresholds: {
        maxInferenceTimeMs: 1000, // 1 second
        minAccuracy: 0.8, // 80%
        maxMemoryUsageMB: 100 // 100MB
      },
      testCases: isDurian ? this.generateDurianTestCases() : this.generateTestCases()
    };
  }

  // Generate test cases
  private generateTestCases(): MobileTestCase[] {
    return [
      {
        id: "healthy_rice_1",
        name: "Healthy Rice Leaf 1",
        imagePath: "test_images/healthy_rice_1.jpg",
        expectedLabel: "healthy",
        expectedConfidence: 0.9,
        description: "Clear image of healthy rice leaf"
      },
      {
        id: "brown_spot_1",
        name: "Brown Spot Disease 1",
        imagePath: "test_images/brown_spot_1.jpg",
        expectedLabel: "rice_brown_spot",
        expectedConfidence: 0.8,
        description: "Rice leaf with brown spot disease"
      },
      {
        id: "blast_1",
        name: "Blast Disease 1",
        imagePath: "test_images/blast_1.jpg",
        expectedLabel: "rice_blast",
        expectedConfidence: 0.8,
        description: "Rice leaf with blast disease"
      },
      {
        id: "bacterial_blight_1",
        name: "Bacterial Blight 1",
        imagePath: "test_images/bacterial_blight_1.jpg",
        expectedLabel: "bacterial_leaf_blight",
        expectedConfidence: 0.8,
        description: "Rice leaf with bacterial blight"
      },
      {
        id: "unclear_image",
        name: "Unclear Image",
        imagePath: "test_images/unclear_image.jpg",
        expectedLabel: "healthy", // Should be uncertain
        expectedConfidence: 0.5, // Low confidence expected
        description: "Blurry or unclear image for uncertainty testing"
      }
    ];
  }

  // Generate Durian test cases
  private generateDurianTestCases(): MobileTestCase[] {
    return [
      {
        id: "healthy_durian_1",
        name: "Healthy Durian 1",
        imagePath: "test_images/healthy_durian_1.jpg",
        expectedLabel: "healthy",
        expectedConfidence: 0.9,
        description: "Clear image of healthy durian plant"
      },
      {
        id: "anthracnose_1",
        name: "Anthracnose Disease 1",
        imagePath: "test_images/anthracnose_1.jpg",
        expectedLabel: "anthracnose",
        expectedConfidence: 0.8,
        description: "Durian with anthracnose disease"
      },
      {
        id: "phytophthora_foot_rot_1",
        name: "Phytophthora Foot Rot 1",
        imagePath: "test_images/phytophthora_foot_rot_1.jpg",
        expectedLabel: "phytophthora_foot_rot",
        expectedConfidence: 0.8,
        description: "Durian with phytophthora foot rot"
      },
      {
        id: "leaf_spot_1",
        name: "Leaf Spot Disease 1",
        imagePath: "test_images/leaf_spot_1.jpg",
        expectedLabel: "leaf_spot",
        expectedConfidence: 0.8,
        description: "Durian with leaf spot disease"
      },
      {
        id: "unclear_durian_image",
        name: "Unclear Durian Image",
        imagePath: "test_images/unclear_durian_image.jpg",
        expectedLabel: "healthy", // Should be uncertain
        expectedConfidence: 0.5, // Low confidence expected
        description: "Blurry or unclear durian image for uncertainty testing"
      }
    ];
  }

  // Get test images directory
  private getTestImages(): string[] {
    const testImagesDir = path.join(this.testDir, "test_images");
    if (!fs.existsSync(testImagesDir)) {
      fs.mkdirSync(testImagesDir, { recursive: true });
    }

    // Return mock image paths - in real implementation, these would be actual test images
    return [
      "test_images/healthy_rice_1.jpg",
      "test_images/brown_spot_1.jpg",
      "test_images/blast_1.jpg",
      "test_images/bacterial_blight_1.jpg",
      "test_images/unclear_image.jpg"
    ];
  }

  // Generate Android test code
  generateAndroidTests(config: MobileTestConfig): string {
    const isDurian = config.modelId.includes('durian');
    const testClassName = isDurian ? 'DurianTFLiteClassifierTest' : 'TFLiteClassifierTest';
    const healthyTestName = isDurian ? 'testHealthyDurianClassification' : 'testHealthyRiceClassification';
    const healthyImageName = isDurian ? 'healthy_durian_1.jpg' : 'healthy_rice_1.jpg';
    
    const diseaseTests = isDurian ? `
    @Test
    fun testAnthracnoseClassification() {
        val testImage = loadTestImage("anthracnose_1.jpg")
        val predictions = classifier.classify(testImage, topK = 3)
        
        assertFalse("Predictions should not be empty", predictions.isEmpty())
        assertTrue("Should have anthracnose prediction", 
            predictions.any { it.label == "anthracnose" })
        
        val anthracnosePred = predictions.find { it.label == "anthracnose" }
        assertNotNull("Anthracnose prediction should exist", anthracnosePred)
        assertTrue("Anthracnose confidence should be reasonable", 
            anthracnosePred!!.confidence > 0.5f)
    }
    
    @Test
    fun testPhytophthoraFootRotClassification() {
        val testImage = loadTestImage("phytophthora_foot_rot_1.jpg")
        val predictions = classifier.classify(testImage, topK = 3)
        
        assertFalse("Predictions should not be empty", predictions.isEmpty())
        assertTrue("Should have phytophthora foot rot prediction", 
            predictions.any { it.label == "phytophthora_foot_rot" })
    }
    
    @Test
    fun testLeafSpotClassification() {
        val testImage = loadTestImage("leaf_spot_1.jpg")
        val predictions = classifier.classify(testImage, topK = 3)
        
        assertFalse("Predictions should not be empty", predictions.isEmpty())
        assertTrue("Should have leaf spot prediction", 
            predictions.any { it.label == "leaf_spot" })
    }` : `
    @Test
    fun testBrownSpotClassification() {
        val testImage = loadTestImage("brown_spot_1.jpg")
        val predictions = classifier.classify(testImage, topK = 3)
        
        assertFalse("Predictions should not be empty", predictions.isEmpty())
        assertTrue("Should have brown spot prediction", 
            predictions.any { it.label == "rice_brown_spot" })
        
        val brownSpotPred = predictions.find { it.label == "rice_brown_spot" }
        assertNotNull("Brown spot prediction should exist", brownSpotPred)
        assertTrue("Brown spot confidence should be reasonable", 
            brownSpotPred!!.confidence > 0.5f)
    }
    
    @Test
    fun testBlastClassification() {
        val testImage = loadTestImage("blast_1.jpg")
        val predictions = classifier.classify(testImage, topK = 3)
        
        assertFalse("Predictions should not be empty", predictions.isEmpty())
        assertTrue("Should have blast prediction", 
            predictions.any { it.label == "rice_blast" })
    }
    
    @Test
    fun testBacterialBlightClassification() {
        val testImage = loadTestImage("bacterial_blight_1.jpg")
        val predictions = classifier.classify(testImage, topK = 3)
        
        assertFalse("Predictions should not be empty", predictions.isEmpty())
        assertTrue("Should have bacterial blight prediction", 
            predictions.any { it.label == "bacterial_leaf_blight" })
    }`;

    return `package com.example.riceclassifier.test

import android.content.Context
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Before
import org.junit.Assert.*
import android.graphics.BitmapFactory
import java.io.InputStream

@RunWith(AndroidJUnit4::class)
class ${testClassName} {
    
    private lateinit var context: Context
    private lateinit var classifier: TFLiteClassifier
    
    @Before
    fun setUp() {
        context = InstrumentationRegistry.getInstrumentation().targetContext
        classifier = TFLiteClassifier(context)
    }
    
    @Test
    fun ${healthyTestName}() {
        val testImage = loadTestImage("${healthyImageName}")
        val predictions = classifier.classify(testImage, topK = 3)
        
        assertFalse("Predictions should not be empty", predictions.isEmpty())
        assertTrue("Should have healthy prediction", 
            predictions.any { it.label == "healthy" })
        
        val healthyPred = predictions.find { it.label == "healthy" }
        assertNotNull("Healthy prediction should exist", healthyPred)
        assertTrue("Healthy confidence should be high", 
            healthyPred!!.confidence > 0.7f)
    }
    
${diseaseTests}
    
    @Test
    fun testUncertaintyDetection() {
        val testImage = loadTestImage("${isDurian ? 'unclear_durian_image.jpg' : 'unclear_image.jpg'}")
        val predictions = classifier.classify(testImage, topK = 3)
        
        assertFalse("Predictions should not be empty", predictions.isEmpty())
        
        val topPrediction = predictions.first()
        assertTrue("Unclear image should be marked as uncertain", 
            topPrediction.isUncertain)
    }
    
    @Test
    fun testPerformanceThresholds() {
        val testImage = loadTestImage("${healthyImageName}")
        val startTime = System.currentTimeMillis()
        
        val predictions = classifier.classify(testImage)
        
        val inferenceTime = System.currentTimeMillis() - startTime
        assertTrue("Inference time should be under ${config.performanceThresholds.maxInferenceTimeMs}ms", 
            inferenceTime < config.performanceThresholds.maxInferenceTimeMs)
    }
    
    private fun loadTestImage(imageName: String): android.graphics.Bitmap {
        val inputStream: InputStream = context.assets.open("test_images/$imageName")
        return BitmapFactory.decodeStream(inputStream)
    }
}`;
  }

  // Generate iOS test code
  generateiOSTests(config: MobileTestConfig): string {
    const isDurian = config.modelId.includes('durian');
    const testClassName = isDurian ? 'DurianClassifierTests' : 'RiceClassifierTests';
    const healthyTestName = isDurian ? 'testHealthyDurianClassification' : 'testHealthyRiceClassification';
    const healthyImageName = isDurian ? 'healthy_durian_1' : 'healthy_rice_1';
    
    const diseaseTests = isDurian ? `
    func testAnthracnoseClassification() throws {
        let testImage = loadTestImage(named: "anthracnose_1")
        let predictions = try classifier.classify(image: testImage, topK: 3)
        
        XCTAssertFalse(predictions.isEmpty, "Predictions should not be empty")
        XCTAssertTrue(predictions.contains { $0.label == "anthracnose" }, 
                     "Should have anthracnose prediction")
        
        let anthracnosePred = predictions.first { $0.label == "anthracnose" }
        XCTAssertNotNil(anthracnosePred, "Anthracnose prediction should exist")
        XCTAssertGreaterThan(anthracnosePred?.confidence ?? 0, 0.5, 
                           "Anthracnose confidence should be reasonable")
    }
    
    func testPhytophthoraFootRotClassification() throws {
        let testImage = loadTestImage(named: "phytophthora_foot_rot_1")
        let predictions = try classifier.classify(image: testImage, topK: 3)
        
        XCTAssertFalse(predictions.isEmpty, "Predictions should not be empty")
        XCTAssertTrue(predictions.contains { $0.label == "phytophthora_foot_rot" }, 
                     "Should have phytophthora foot rot prediction")
    }
    
    func testLeafSpotClassification() throws {
        let testImage = loadTestImage(named: "leaf_spot_1")
        let predictions = try classifier.classify(image: testImage, topK: 3)
        
        XCTAssertFalse(predictions.isEmpty, "Predictions should not be empty")
        XCTAssertTrue(predictions.contains { $0.label == "leaf_spot" }, 
                     "Should have leaf spot prediction")
    }` : `
    func testBrownSpotClassification() throws {
        let testImage = loadTestImage(named: "brown_spot_1")
        let predictions = try classifier.classify(image: testImage, topK: 3)
        
        XCTAssertFalse(predictions.isEmpty, "Predictions should not be empty")
        XCTAssertTrue(predictions.contains { $0.label == "rice_brown_spot" }, 
                     "Should have brown spot prediction")
        
        let brownSpotPred = predictions.first { $0.label == "rice_brown_spot" }
        XCTAssertNotNil(brownSpotPred, "Brown spot prediction should exist")
        XCTAssertGreaterThan(brownSpotPred?.confidence ?? 0, 0.5, 
                           "Brown spot confidence should be reasonable")
    }
    
    func testBlastClassification() throws {
        let testImage = loadTestImage(named: "blast_1")
        let predictions = try classifier.classify(image: testImage, topK: 3)
        
        XCTAssertFalse(predictions.isEmpty, "Predictions should not be empty")
        XCTAssertTrue(predictions.contains { $0.label == "rice_blast" }, 
                     "Should have blast prediction")
    }
    
    func testBacterialBlightClassification() throws {
        let testImage = loadTestImage(named: "bacterial_blight_1")
        let predictions = try classifier.classify(image: testImage, topK: 3)
        
        XCTAssertFalse(predictions.isEmpty, "Predictions should not be empty")
        XCTAssertTrue(predictions.contains { $0.label == "bacterial_leaf_blight" }, 
                     "Should have bacterial blight prediction")
    }`;

    return `import XCTest
@testable import RiceClassifier
import UIKit

class ${testClassName}: XCTestCase {
    
    var classifier: RiceClassifier!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        classifier = try RiceClassifier()
    }
    
    override func tearDownWithError() throws {
        classifier = nil
        try super.tearDownWithError()
    }
    
    func ${healthyTestName}() throws {
        let testImage = loadTestImage(named: "${healthyImageName}")
        let predictions = try classifier.classify(image: testImage, topK: 3)
        
        XCTAssertFalse(predictions.isEmpty, "Predictions should not be empty")
        XCTAssertTrue(predictions.contains { $0.label == "healthy" }, 
                     "Should have healthy prediction")
        
        let healthyPred = predictions.first { $0.label == "healthy" }
        XCTAssertNotNil(healthyPred, "Healthy prediction should exist")
        XCTAssertGreaterThan(healthyPred?.confidence ?? 0, 0.7, 
                           "Healthy confidence should be high")
    }
    
${diseaseTests}
    
    func testUncertaintyDetection() throws {
        let testImage = loadTestImage(named: "${isDurian ? 'unclear_durian_image' : 'unclear_image'}")
        let predictions = try classifier.classify(image: testImage, topK: 3)
        
        XCTAssertFalse(predictions.isEmpty, "Predictions should not be empty")
        
        let topPrediction = predictions.first
        XCTAssertTrue(topPrediction?.isUncertain == true, 
                     "Unclear image should be marked as uncertain")
    }
    
    func testPerformanceThresholds() throws {
        let testImage = loadTestImage(named: "${healthyImageName}")
        let startTime = CFAbsoluteTimeGetCurrent()
        
        let predictions = try classifier.classify(image: testImage)
        
        let inferenceTime = CFAbsoluteTimeGetCurrent() - startTime
        let inferenceTimeMs = inferenceTime * 1000
        XCTAssertLessThan(inferenceTimeMs, Double(config.performanceThresholds.maxInferenceTimeMs), 
                         "Inference time should be under \\(config.performanceThresholds.maxInferenceTimeMs)ms")
    }
    
    private func loadTestImage(named imageName: String) -> UIImage {
        guard let image = UIImage(named: imageName) else {
            // Create a test image if not found
            let size = CGSize(width: 224, height: 224)
            UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
            UIColor.green.setFill()
            UIRectFill(CGRect(origin: .zero, size: size))
            let testImage = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()
            return testImage ?? UIImage()
        }
        return image
    }
}`;
  }

  // Generate test data
  generateTestData(config: MobileTestConfig): void {
    const testDataDir = path.join(this.testDir, "test_data");
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Generate mock test images (in real implementation, these would be actual images)
    for (const testCase of config.testCases) {
      const imagePath = path.join(testDataDir, testCase.imagePath);
      const imageDir = path.dirname(imagePath);
      
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
      }

      // Create a placeholder file (in real implementation, this would be an actual image)
      fs.writeFileSync(imagePath, `# Mock test image: ${testCase.name}\n${testCase.description}`);
    }

    // Generate test configuration file
    const configPath = path.join(testDataDir, "test_config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  // Run mock tests (in real implementation, this would run actual tests)
  async runTests(config: MobileTestConfig): Promise<MobileTestSuite> {
    const results: MobileTestResult[] = [];

    for (const testCase of config.testCases) {
      const result = await this.runSingleTest(testCase, config);
      results.push(result);
    }

    const summary = this.calculateSummary(results, config);

    const testSuite: MobileTestSuite = {
      config,
      results,
      summary
    };

    // Save test results
    const resultsPath = path.join(this.resultsDir, `${config.modelId}_test_results.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(testSuite, null, 2));

    return testSuite;
  }

  // Run a single test
  private async runSingleTest(
    testCase: MobileTestCase,
    config: MobileTestConfig
  ): Promise<MobileTestResult> {
    // Mock test execution - in real implementation, this would run actual inference
    const mockResult: MobileTestResult = {
      testId: testCase.id,
      passed: Math.random() > 0.2, // 80% pass rate for mock
      actualLabel: testCase.expectedLabel,
      actualConfidence: testCase.expectedConfidence + (Math.random() - 0.5) * 0.2,
      inferenceTimeMs: Math.random() * 500 + 100, // 100-600ms
      memoryUsageMB: Math.random() * 50 + 20, // 20-70MB
      details: {
        expectedLabel: testCase.expectedLabel,
        expectedConfidence: testCase.expectedConfidence,
        labelMatch: true,
        confidenceMatch: true,
        timeWithinThreshold: true,
        memoryWithinThreshold: true
      }
    };

    // Adjust results based on test case
    if (testCase.id === "unclear_image") {
      mockResult.actualConfidence = 0.3; // Low confidence for unclear image
      mockResult.passed = mockResult.actualConfidence < 0.5; // Should be uncertain
    }

    return mockResult;
  }

  // Calculate test summary
  private calculateSummary(
    results: MobileTestResult[],
    config: MobileTestConfig
  ): MobileTestSuite["summary"] {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    const averageInferenceTime = results.reduce((sum, r) => sum + r.inferenceTimeMs, 0) / totalTests;
    const averageAccuracy = results.reduce((sum, r) => sum + r.actualConfidence, 0) / totalTests;
    
    const overallPass = passedTests / totalTests >= config.performanceThresholds.minAccuracy;

    return {
      totalTests,
      passedTests,
      failedTests,
      averageInferenceTime,
      averageAccuracy,
      overallPass
    };
  }

  // Generate test report
  generateTestReport(testSuite: MobileTestSuite): string {
    const { config, results, summary } = testSuite;

    return `# Mobile Test Report

## Test Configuration
- Model ID: ${config.modelId}
- Platform: ${config.platform}
- Total Test Cases: ${summary.totalTests}

## Performance Thresholds
- Max Inference Time: ${config.performanceThresholds.maxInferenceTimeMs}ms
- Min Accuracy: ${(config.performanceThresholds.minAccuracy * 100).toFixed(1)}%
- Max Memory Usage: ${config.performanceThresholds.maxMemoryUsageMB}MB

## Test Results Summary
- **Overall Pass**: ${summary.overallPass ? '✅ PASS' : '❌ FAIL'}
- **Passed Tests**: ${summary.passedTests}/${summary.totalTests} (${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%)
- **Average Inference Time**: ${summary.averageInferenceTime.toFixed(1)}ms
- **Average Accuracy**: ${(summary.averageAccuracy * 100).toFixed(1)}%

## Individual Test Results
${results.map(result => `
### ${result.testId}
- **Status**: ${result.passed ? '✅ PASS' : '❌ FAIL'}
- **Expected**: ${result.details.expectedLabel} (${(result.details.expectedConfidence * 100).toFixed(1)}%)
- **Actual**: ${result.actualLabel} (${(result.actualConfidence * 100).toFixed(1)}%)
- **Inference Time**: ${result.inferenceTimeMs.toFixed(1)}ms
- **Memory Usage**: ${result.memoryUsageMB.toFixed(1)}MB
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('')}

## Recommendations
${summary.overallPass ? 
  '✅ Model meets all performance requirements and is ready for deployment.' :
  '❌ Model needs improvement before deployment. Consider:' +
  '\n- Retraining with more data' +
  '\n- Model optimization' +
  '\n- Adjusting performance thresholds' +
  '\n- Improving image preprocessing'
}

## Next Steps
1. Review failed test cases
2. Address performance issues
3. Re-run tests after improvements
4. Deploy to production if all tests pass
`;
  }

  // Generate test scripts
  generateTestScripts(config: MobileTestConfig): { android: string; ios: string } {
    return {
      android: this.generateAndroidTests(config),
      ios: this.generateiOSTests(config)
    };
  }

  // Save test configuration
  saveTestConfig(config: MobileTestConfig): string {
    const configPath = path.join(this.testDir, `${config.modelId}_test_config.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  // Load test configuration
  loadTestConfig(configPath: string): MobileTestConfig {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  }
}

// Export singleton instance
export const mobileTestingFramework = new MobileTestingFramework();
