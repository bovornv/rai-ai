import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { makePricesRouter, openPricesDb } from "./api/prices";
import { buyersRouter } from "./api/buyers";
import { makeShopTicketRouter, openShopDb } from "./api/shop-tickets";
import { makeAnalyticsRouter } from "./api/analytics";
import { openCrashDb, makeCrashRouter } from "./api/crash-reporting";
import { openFlagsDb, makeFeatureFlagsRouter } from "./api/feature-flags";
import { makeOfflineCacheRouter } from "./api/offline-cache";
import { makePermissionsRouter } from "./api/permissions";
import { makeBuildRouter } from "./api/build";
import { openDb } from "./lib/db";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize databases
let pricesDb: any;
let buyersDb: any;
let shopTicketsDb: any;
let analyticsRouter: any;
let crashDb: any;
let flagsDb: any;
let offlineCacheRouter: any;
let permissionsRouter: any;
let buildRouter: any;

async function initializeDatabases() {
  try {
    pricesDb = await openPricesDb();
    buyersDb = await openDb();
    shopTicketsDb = await openShopDb();
    analyticsRouter = await makeAnalyticsRouter();
    crashDb = await openCrashDb();
    flagsDb = await openFlagsDb();
    offlineCacheRouter = await makeOfflineCacheRouter();
    permissionsRouter = await makePermissionsRouter();
    buildRouter = makeBuildRouter();
    console.log("✅ Databases initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const stats = await pricesDb.get("SELECT COUNT(*) as count FROM price_quotes");
    
    res.json({
      status: "healthy",
      database: "connected",
      price_quotes: stats.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Initialize databases before starting server
initializeDatabases().then(() => {
  // Debug: Check which routers are undefined
  console.log("Debug - Router status:");
  console.log("buyersRouter:", typeof buyersRouter);
  console.log("analyticsRouter:", typeof analyticsRouter);
  console.log("offlineCacheRouter:", typeof offlineCacheRouter);
  console.log("permissionsRouter:", typeof permissionsRouter);
  console.log("buildRouter:", typeof buildRouter);

  // API routes
  app.use("/api/prices", makePricesRouter(pricesDb));
  app.use("/api/buyers", buyersRouter);
  app.use("/api", makeShopTicketRouter(shopTicketsDb));
  app.use("/api/analytics", analyticsRouter);
  app.use("/api", makeCrashRouter(crashDb));
  app.use("/api/feature-flags", makeFeatureFlagsRouter(flagsDb));
  app.use("/api/cache", offlineCacheRouter);
  app.use("/api/permissions", permissionsRouter);
  app.use("/api/build", buildRouter);

  // Individual ticket page
  app.get("/ticket/:id", async (req, res) => {
    try {
      const ticketId = req.params.id;
      const ticket = await shopTicketsDb.get(`
        SELECT * FROM shop_tickets WHERE id = ?
      `, ticketId);
      
      if (!ticket) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Ticket Not Found - RaiAI</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Ticket Not Found</h1>
            <p>The ticket you're looking for doesn't exist or has expired.</p>
            <a href="/">← Back to RaiAI</a>
          </body>
          </html>
        `);
      }
      
      const recommendations = JSON.parse(ticket.recommended_classes || '[]');
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>RaiAI Ticket #${ticketId}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 20px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status.issued { background: #e8f4f8; color: #2980b9; }
            .status.scanned { background: #fff3cd; color: #856404; }
            .status.completed { background: #d4edda; color: #155724; }
            .status.expired { background: #f8d7da; color: #721c24; }
            .info { margin-bottom: 15px; }
            .label { font-weight: bold; color: #2c3e50; }
            .value { color: #34495e; }
            .recommendations { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 20px; }
            .recommendation { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 RaiAI Diagnosis Ticket</h1>
              <span class="status ${ticket.status}">${ticket.status.toUpperCase()}</span>
            </div>
            
            <div class="info">
              <div class="label">Ticket ID:</div>
              <div class="value">${ticket.id}</div>
            </div>
            
            <div class="info">
              <div class="label">Crop:</div>
              <div class="value">${ticket.crop}</div>
            </div>
            
            <div class="info">
              <div class="label">Diagnosis:</div>
              <div class="value">${ticket.diagnosis_key}</div>
            </div>
            
            ${ticket.severity ? `
            <div class="info">
              <div class="label">Severity:</div>
              <div class="value">${ticket.severity}/5</div>
            </div>
            ` : ''}
            
            ${ticket.rai ? `
            <div class="info">
              <div class="label">Area:</div>
              <div class="value">${ticket.rai} rai</div>
            </div>
            ` : ''}
            
            <div class="recommendations">
              <h3>Recommended Products:</h3>
              ${recommendations.map(rec => `<div class="recommendation">• ${rec}</div>`).join('')}
            </div>
            
            ${ticket.dosage_note ? `
            <div class="info">
              <div class="label">Dosage Notes:</div>
              <div class="value">${ticket.dosage_note}</div>
            </div>
            ` : ''}
            
            <div class="info">
              <div class="label">Created:</div>
              <div class="value">${new Date(ticket.created_at).toLocaleString()}</div>
            </div>
            
            ${ticket.expires_at ? `
            <div class="info">
              <div class="label">Expires:</div>
              <div class="value">${new Date(ticket.expires_at).toLocaleString()}</div>
            </div>
            ` : ''}
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error - RaiAI</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Error</h1>
          <p>An error occurred while loading the ticket.</p>
          <a href="/">← Back to RaiAI</a>
        </body>
        </html>
      `);
    }
  });

  // Shop Counter page
  app.get("/counter", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>RaiAI Shop Counter</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .title { text-align: center; color: #2c3e50; margin-bottom: 20px; }
          .info { background: #e8f4f8; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
          .download { text-align: center; margin-top: 20px; }
          .btn { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="title">🏪 RaiAI Shop Counter</h1>
          <div class="info">
            <p><strong>For Agri-Shops & Co-ops:</strong></p>
            <p>This is the web interface for scanning customer tickets and managing sales.</p>
            <p>To use this feature, you need the RaiAI mobile app installed on your device.</p>
          </div>
          <div class="download">
            <a href="#" class="btn">Download RaiAI App</a>
            <p style="margin-top: 10px; color: #666;">
              Scan customer QR tickets • Process sales • Track referrals
            </p>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // Privacy Policy page
  app.get("/privacy", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Privacy Policy - RaiAI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          .title { color: #2c3e50; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .btn { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="title">Privacy Policy</h1>
          <div class="section">
            <h2>Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
          </div>
          <div class="section">
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
          </div>
          <div class="section">
            <h2>Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </div>
          <div class="section">
            <a href="/" class="btn">← Back to Home</a>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // Terms of Service page
  app.get("/terms", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Terms of Service - RaiAI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          .title { color: #2c3e50; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .btn { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="title">Terms of Service</h1>
          <div class="section">
            <h2>Acceptance of Terms</h2>
            <p>By accessing and using RaiAI, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </div>
          <div class="section">
            <h2>Use License</h2>
            <p>Permission is granted to temporarily download one copy of RaiAI for personal, non-commercial transitory viewing only.</p>
          </div>
          <div class="section">
            <h2>Disclaimer</h2>
            <p>The materials on RaiAI are provided on an 'as is' basis. RaiAI makes no warranties, expressed or implied.</p>
          </div>
          <div class="section">
            <a href="/" class="btn">← Back to Home</a>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // Root endpoint - Serve React app
  app.get("/", (req, res) => {
    res.json({
      message: "RaiAI API Server - React app should be served from the frontend",
      frontend: "The React landing page is available at the frontend URL",
      api: {
        health: "/api/health",
        docs: "See individual API endpoints below"
      }
    });
  });

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // CORS headers for all responses
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key");
    
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Start server
  app.listen(PORT, () => {
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://raiai.app' : `http://localhost:${PORT}`;
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📈 Price API: ${baseUrl}/api/prices`);
    console.log(`🏪 Shop Tickets: ${baseUrl}/api/shop-tickets`);
    console.log(`📊 Analytics: ${baseUrl}/api/analytics`);
    console.log(`🚨 Crash Reports: ${baseUrl}/api/crash-reports`);
    console.log(`🚩 Feature Flags: ${baseUrl}/api/feature-flags`);
    console.log(`📱 Offline Cache: ${baseUrl}/api/cache`);
    console.log(`🔐 Permissions: ${baseUrl}/api/permissions`);
    console.log(`🔧 Build Info: ${baseUrl}/api/build`);
    console.log(`❤️  Health Check: ${baseUrl}/health`);
    console.log(`🎫 Shop Counter: ${baseUrl}/counter`);
    console.log(`🔗 Ticket URLs: ${baseUrl}/ticket/{id}`);
  });
});