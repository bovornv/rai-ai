const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.SHOPTICKET_HMAC_SECRET = process.env.SHOPTICKET_HMAC_SECRET || 'dev-secret-key-32-bytes-long-change-in-production';
process.env.SHOPTICKET_DB_PATH = process.env.SHOPTICKET_DB_PATH || 'data/app.db';

console.log('🚀 Starting RaiAI Server...');
console.log('📁 Database:', process.env.SHOPTICKET_DB_PATH);
console.log('🔐 HMAC Secret:', process.env.SHOPTICKET_HMAC_SECRET ? 'Set' : 'Not set');

// Start the server using tsx (TypeScript execution)
const server = spawn('npx', ['tsx', 'src/server.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

server.on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🛑 Server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});
