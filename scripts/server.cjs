const express = require('express');
const cors = require('cors');
const path = require('path');
const { Database } = require('sqlite');
const sqlite3 = require('sqlite3');

// Import the shop ticket router
const { makeShopTicketRouter, openShopDb } = require('../src/api/shop-tickets.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Set environment variables
process.env.SHOPTICKET_HMAC_SECRET = process.env.SHOPTICKET_HMAC_SECRET || 'dev-secret-key-32-bytes-long-change-in-production';
process.env.SHOPTICKET_DB_PATH = process.env.SHOPTICKET_DB_PATH || 'data/app.db';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Initialize databases
let shopTicketsDb;

async function initializeDatabases() {
  try {
    console.log('🔄 Initializing databases...');
    
    // Initialize shop tickets database
    shopTicketsDb = await openShopDb();
    console.log('✅ Shop tickets database initialized');
    
    // Mount shop ticket routes
    app.use("/api", makeShopTicketRouter(shopTicketsDb));
    console.log('✅ Shop ticket API routes mounted');
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        services: {
          shopTickets: shopTicketsDb ? 'connected' : 'disconnected'
        }
      });
    });

    // Serve the main app (catch-all route must be last)
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    await initializeDatabases();
    
    app.listen(PORT, () => {
      console.log('🚀 RaiAI Server started successfully!');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`🏪 Shop tickets API: http://localhost:${PORT}/api/shop-tickets`);
      console.log(`🏪 Counter mode: http://localhost:${PORT}/counter`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (shopTicketsDb) {
    await shopTicketsDb.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  if (shopTicketsDb) {
    await shopTicketsDb.close();
  }
  process.exit(0);
});

// Start the server
startServer().catch(console.error);
