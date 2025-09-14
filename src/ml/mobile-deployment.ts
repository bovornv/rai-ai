// Mobile Deployment Utilities
import { ModelMeta } from "../lib/ml-pipeline";
import { mobileModelConfigManager, MobileModelConfig, MobileDeploymentPackage } from "./mobile-config";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface MobileDeploymentOptions {
  platform: "android" | "ios" | "both";
  quantization: "int8" | "float16" | "both";
  outputDir: string;
  includeDocumentation: boolean;
  generateCode: boolean;
  compressAssets: boolean;
}

export interface MobileDeploymentResult {
  success: boolean;
  platform: string;
  outputDir: string;
  assets: string[];
  generatedCode: string[];
  documentation: string[];
  errors: string[];
}

export class MobileDeploymentManager {
  private deploymentDir: string;
  private templatesDir: string;

  constructor(deploymentDir = "mobile_deployments", templatesDir = "mobile_templates") {
    this.deploymentDir = deploymentDir;
    this.templatesDir = templatesDir;
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.deploymentDir, this.templatesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Deploy model to mobile platforms
  async deployModel(
    model: ModelMeta,
    options: MobileDeploymentOptions
  ): Promise<MobileDeploymentResult> {
    const result: MobileDeploymentResult = {
      success: false,
      platform: options.platform,
      outputDir: options.outputDir,
      assets: [],
      generatedCode: [],
      documentation: [],
      errors: []
    };

    try {
      // Create mobile configuration
      const mobileConfig = mobileModelConfigManager.createMobileConfig(
        model,
        options.platform,
        options.quantization
      );

      // Create deployment package
      const deploymentPackage = mobileModelConfigManager.createDeploymentPackage(
        model.id,
        options.platform
      );

      // Generate assets
      await this.generateAssets(deploymentPackage, options, result);

      // Generate code if requested
      if (options.generateCode) {
        await this.generateCode(deploymentPackage, options, result);
      }

      // Generate documentation if requested
      if (options.includeDocumentation) {
        await this.generateDocumentation(deploymentPackage, options, result);
      }

      // Compress assets if requested
      if (options.compressAssets) {
        await this.compressAssets(options.outputDir, result);
      }

      result.success = true;
      console.log(`Mobile deployment completed successfully for ${model.id}`);

    } catch (error) {
      result.errors.push(`Deployment failed: ${error}`);
      console.error("Mobile deployment failed:", error);
    }

    return result;
  }

  // Generate mobile assets
  private async generateAssets(
    package: MobileDeploymentPackage,
    options: MobileDeploymentOptions,
    result: MobileDeploymentResult
  ): Promise<void> {
    const assetsDir = path.join(options.outputDir, "assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Copy model files
    for (const modelFile of package.assets.model_files) {
      const fileName = path.basename(modelFile);
      const destPath = path.join(assetsDir, fileName);
      
      if (fs.existsSync(modelFile)) {
        fs.copyFileSync(modelFile, destPath);
        result.assets.push(destPath);
      } else {
        result.errors.push(`Model file not found: ${modelFile}`);
      }
    }

    // Copy label files
    for (const labelFile of package.assets.label_files) {
      const fileName = path.basename(labelFile);
      const destPath = path.join(assetsDir, fileName);
      
      if (fs.existsSync(labelFile)) {
        fs.copyFileSync(labelFile, destPath);
        result.assets.push(destPath);
      } else {
        result.errors.push(`Label file not found: ${labelFile}`);
      }
    }

    // Copy meta files
    for (const metaFile of package.assets.meta_files) {
      const fileName = path.basename(metaFile);
      const destPath = path.join(assetsDir, fileName);
      
      if (fs.existsSync(metaFile)) {
        fs.copyFileSync(metaFile, destPath);
        result.assets.push(destPath);
      } else {
        result.errors.push(`Meta file not found: ${metaFile}`);
      }
    }
  }

  // Generate mobile code
  private async generateCode(
    package: MobileDeploymentPackage,
    options: MobileDeploymentOptions,
    result: MobileDeploymentResult
  ): Promise<void> {
    const codeDir = path.join(options.outputDir, "code");
    if (!fs.existsSync(codeDir)) {
      fs.mkdirSync(codeDir, { recursive: true });
    }

    if (options.platform === "android" || options.platform === "both") {
      const androidCode = mobileModelConfigManager.generateMobileCode(
        package.models.int8!,
        "android"
      );
      
      if (androidCode.kotlin) {
        const kotlinPath = path.join(codeDir, "android", "TFLiteClassifier.kt");
        fs.mkdirSync(path.dirname(kotlinPath), { recursive: true });
        fs.writeFileSync(kotlinPath, androidCode.kotlin);
        result.generatedCode.push(kotlinPath);
      }
    }

    if (options.platform === "ios" || options.platform === "both") {
      const iosCode = mobileModelConfigManager.generateMobileCode(
        package.models.int8!,
        "ios"
      );
      
      if (iosCode.swift) {
        const swiftPath = path.join(codeDir, "ios", "RiceClassifier.swift");
        fs.mkdirSync(path.dirname(swiftPath), { recursive: true });
        fs.writeFileSync(swiftPath, iosCode.swift);
        result.generatedCode.push(swiftPath);
      }
    }
  }

  // Generate documentation
  private async generateDocumentation(
    package: MobileDeploymentPackage,
    options: MobileDeploymentOptions,
    result: MobileDeploymentResult
  ): Promise<void> {
    const docsDir = path.join(options.outputDir, "docs");
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Copy integration guides
    const androidGuide = path.join(__dirname, "mobile", "android-integration.md");
    const iosGuide = path.join(__dirname, "mobile", "ios-integration.md");

    if (fs.existsSync(androidGuide) && (options.platform === "android" || options.platform === "both")) {
      const destPath = path.join(docsDir, "android-integration.md");
      fs.copyFileSync(androidGuide, destPath);
      result.documentation.push(destPath);
    }

    if (fs.existsSync(iosGuide) && (options.platform === "ios" || options.platform === "both")) {
      const destPath = path.join(docsDir, "ios-integration.md");
      fs.copyFileSync(iosGuide, destPath);
      result.documentation.push(destPath);
    }

    // Generate deployment README
    const readmePath = path.join(docsDir, "README.md");
    const readme = this.generateDeploymentReadme(package, options);
    fs.writeFileSync(readmePath, readme);
    result.documentation.push(readmePath);
  }

  // Generate deployment README
  private generateDeploymentReadme(
    package: MobileDeploymentPackage,
    options: MobileDeploymentOptions
  ): string {
    return `# Mobile Deployment Package

## Model Information
- Model ID: ${package.models.int8?.id}
- Version: ${package.models.int8?.version}
- Platform: ${package.platform}
- Quantization: ${package.models.int8?.quantization}

## Assets Included
${package.assets.model_files.map(f => `- ${path.basename(f)}`).join('\n')}
${package.assets.label_files.map(f => `- ${path.basename(f)}`).join('\n')}
${package.assets.meta_files.map(f => `- ${path.basename(f)}`).join('\n')}

## Performance Expectations
- Expected Inference Time: ${package.models.int8?.performance.expected_inference_time_ms}ms
- Model Size: ${package.models.int8?.performance.model_size_mb}MB
- Memory Usage: ${package.models.int8?.performance.memory_usage_mb}MB

## Integration
1. Copy assets to your mobile app
2. Follow the integration guide for your platform
3. Test on target devices
4. Monitor performance in production

## Files Structure
\`\`\`
mobile_deployment/
├── assets/
│   ├── ${package.models.int8?.id}_int8.tflite
│   ├── ${package.models.int8?.id}_fp16.tflite
│   ├── labels.json
│   └── meta.json
├── code/
│   ├── android/
│   │   └── TFLiteClassifier.kt
│   └── ios/
│       └── RiceClassifier.swift
└── docs/
    ├── android-integration.md
    ├── ios-integration.md
    └── README.md
\`\`\`

## Next Steps
1. Integrate the generated code into your mobile app
2. Test the model with sample images
3. Deploy to app stores
4. Monitor performance and accuracy
`;
  }

  // Compress assets
  private async compressAssets(outputDir: string, result: MobileDeploymentResult): Promise<void> {
    try {
      const zipPath = path.join(outputDir, "mobile_deployment.zip");
      await execAsync(`cd "${outputDir}" && zip -r mobile_deployment.zip .`);
      result.assets.push(zipPath);
      console.log(`Assets compressed to: ${zipPath}`);
    } catch (error) {
      result.errors.push(`Failed to compress assets: ${error}`);
    }
  }

  // Create Android project structure
  async createAndroidProject(
    modelId: string,
    outputDir: string
  ): Promise<string[]> {
    const androidDir = path.join(outputDir, "android");
    const files: string[] = [];

    // Create directory structure
    const dirs = [
      "app/src/main/assets",
      "app/src/main/java/com/example/riceclassifier",
      "app/src/main/res/layout",
      "app/src/main/res/values"
    ];

    for (const dir of dirs) {
      const fullPath = path.join(androidDir, dir);
      fs.mkdirSync(fullPath, { recursive: true });
    }

    // Generate build.gradle
    const buildGradle = this.generateAndroidBuildGradle();
    const buildGradlePath = path.join(androidDir, "app", "build.gradle");
    fs.writeFileSync(buildGradlePath, buildGradle);
    files.push(buildGradlePath);

    // Generate AndroidManifest.xml
    const manifest = this.generateAndroidManifest();
    const manifestPath = path.join(androidDir, "app", "src", "main", "AndroidManifest.xml");
    fs.writeFileSync(manifestPath, manifest);
    files.push(manifestPath);

    // Generate MainActivity
    const mainActivity = this.generateMainActivity();
    const mainActivityPath = path.join(androidDir, "app", "src", "main", "java", "com", "example", "riceclassifier", "MainActivity.kt");
    fs.writeFileSync(mainActivityPath, mainActivity);
    files.push(mainActivityPath);

    return files;
  }

  // Generate Android build.gradle
  private generateAndroidBuildGradle(): string {
    return `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace 'com.example.riceclassifier'
    compileSdk 34

    defaultConfig {
        applicationId "com.example.riceclassifier"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        
        aaptOptions {
            noCompress "tflite"
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = '1.8'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    
    // TensorFlow Lite
    implementation 'org.tensorflow:tensorflow-lite:2.14.0'
    implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'
    implementation 'org.tensorflow:tensorflow-lite-gpu:2.14.0'
    
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}`;
  }

  // Generate Android manifest
  private generateAndroidManifest(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.RiceClassifier"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.RiceClassifier">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`;
  }

  // Generate MainActivity
  private generateMainActivity(): string {
    return `package com.example.riceclassifier

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.io.InputStream

class MainActivity : AppCompatActivity() {
    
    private lateinit var imageView: ImageView
    private lateinit var resultText: TextView
    private lateinit var adviceText: TextView
    private lateinit var scanButton: Button
    
    private val REQUEST_CAMERA_PERMISSION = 1001
    private val REQUEST_IMAGE_CAPTURE = 1002
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        initViews()
        setupClickListeners()
        checkPermissions()
    }
    
    private fun initViews() {
        imageView = findViewById(R.id.imageView)
        resultText = findViewById(R.id.resultText)
        adviceText = findViewById(R.id.adviceText)
        scanButton = findViewById(R.id.scanButton)
    }
    
    private fun setupClickListeners() {
        scanButton.setOnClickListener {
            if (checkCameraPermission()) {
                openCamera()
            } else {
                requestCameraPermission()
            }
        }
    }
    
    private fun checkPermissions() {
        if (!checkCameraPermission()) {
            requestCameraPermission()
        }
    }
    
    private fun checkCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    private fun requestCameraPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.CAMERA),
            REQUEST_CAMERA_PERMISSION
        )
    }
    
    private fun openCamera() {
        // Implementation for camera
        // This is a simplified version
        val testBitmap = BitmapFactory.decodeResource(resources, R.drawable.test_rice)
        classifyImage(testBitmap)
    }
    
    private fun classifyImage(bitmap: Bitmap) {
        // TODO: Implement TFLite classification
        resultText.text = "Classification result will appear here"
        adviceText.text = "Disease advice will appear here"
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            REQUEST_CAMERA_PERMISSION -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    openCamera()
                } else {
                    // Permission denied
                }
            }
        }
    }
}`;
  }

  // Create iOS project structure
  async createiOSProject(
    modelId: string,
    outputDir: string
  ): Promise<string[]> {
    const iosDir = path.join(outputDir, "ios");
    const files: string[] = [];

    // Create directory structure
    const dirs = [
      "RiceClassifier",
      "RiceClassifier/Resources",
      "RiceClassifier/Classes"
    ];

    for (const dir of dirs) {
      const fullPath = path.join(iosDir, dir);
      fs.mkdirSync(fullPath, { recursive: true });
    }

    // Generate Podfile
    const podfile = this.generatePodfile();
    const podfilePath = path.join(iosDir, "Podfile");
    fs.writeFileSync(podfilePath, podfile);
    files.push(podfilePath);

    // Generate Info.plist
    const infoPlist = this.generateInfoPlist();
    const infoPlistPath = path.join(iosDir, "RiceClassifier", "Info.plist");
    fs.writeFileSync(infoPlistPath, infoPlist);
    files.push(infoPlistPath);

    return files;
  }

  // Generate Podfile
  private generatePodfile(): string {
    return `platform :ios, '12.0'

target 'RiceClassifier' do
  use_frameworks!
  
  # TensorFlow Lite
  pod 'TensorFlowLite', '2.14.0'
  pod 'TensorFlowLiteSwift', '2.14.0'
  pod 'TensorFlowLiteGPU', '2.14.0'
end`;
  }

  // Generate Info.plist
  private generateInfoPlist(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSceneManifest</key>
    <dict>
        <key>UIApplicationSupportsMultipleScenes</key>
        <false/>
        <key>UISceneConfigurations</key>
        <dict>
            <key>UIWindowSceneSessionRoleApplication</key>
            <array>
                <dict>
                    <key>UISceneConfigurationName</key>
                    <string>Default Configuration</string>
                    <key>UISceneDelegateClassName</key>
                    <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
                </dict>
            </array>
        </dict>
    </dict>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIMainStoryboardFile</key>
    <string>Main</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>NSCameraUsageDescription</key>
    <string>This app needs access to camera to take photos of rice leaves for disease classification.</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>This app needs access to photo library to classify rice diseases.</string>
</dict>
</plist>`;
  }

  // Generate deployment report
  generateDeploymentReport(result: MobileDeploymentResult): string {
    return `# Mobile Deployment Report

## Deployment Summary
- Platform: ${result.platform}
- Success: ${result.success ? 'Yes' : 'No'}
- Output Directory: ${result.outputDir}

## Assets Generated
${result.assets.map(asset => `- ${asset}`).join('\n')}

## Code Generated
${result.generatedCode.map(code => `- ${code}`).join('\n')}

## Documentation Generated
${result.documentation.map(doc => `- ${doc}`).join('\n')}

## Errors
${result.errors.length > 0 ? result.errors.map(error => `- ${error}`).join('\n') : 'No errors'}

## Next Steps
1. Copy assets to your mobile app
2. Integrate the generated code
3. Test on target devices
4. Deploy to app stores
`;
  }
}

// Export singleton instance
export const mobileDeploymentManager = new MobileDeploymentManager();
