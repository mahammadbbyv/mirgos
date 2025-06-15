/**
 * Backend Starter Script
 * This script starts the refactored backend with enhanced connection diagnostics
 */

// Display startup banner
console.log('\n==================================================');
console.log('  MIRGOS REFACTORED BACKEND SERVER');
console.log('  Port: 3002 | Version: 2.0');
console.log('==================================================\n');

// Connection diagnostics
console.log('[CONNECTION] Enabling enhanced connection diagnostics...');
console.log('[CONNECTION] Socket.IO configured with connection timeout: 20s');
console.log('[CONNECTION] Transport methods: websocket, polling');
console.log('[CONNECTION] CORS: Enabled for all localhost origins');

// Import the refactored server
try {
    console.log('[STARTUP] Initializing server...');
    require('./index-refactored');
    console.log('[STARTUP] Server initialized successfully');
    console.log('[READY] Server is ready to accept connections on port 3002');
    console.log('[INFO] Use the connection-test.html page to verify connectivity');
    console.log('[INFO] Debug tools available in test-enhanced.js\n');
} catch (error) {
    console.error('[ERROR] Failed to start the server:', error.message);
    console.error(error.stack);
    process.exit(1);
}
