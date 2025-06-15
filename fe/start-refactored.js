/**
 * Custom Vite Dev Server for Refactored Version
 * With enhanced debugging and error handling
 */
const fs = require('fs');
const path = require('path');
const { createServer } = require('vite');

// Print startup banner
console.log('='.repeat(50));
console.log('MIRGOS GAME FRONTEND (REFACTORED VERSION)');
console.log('Starting Vite development server...');
console.log('='.repeat(50));

// Add timestamp to console logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args) => {
  originalConsoleLog(`[${new Date().toLocaleTimeString()}]`, ...args);
};

console.error = (...args) => {
  originalConsoleError(`[${new Date().toLocaleTimeString()}] ERROR:`, ...args);
};

console.warn = (...args) => {
  originalConsoleWarn(`[${new Date().toLocaleTimeString()}] WARNING:`, ...args);
};

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  console.error('Server will continue running, but some functionality may be broken');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

async function startDevServer() {
  console.log('Configuring Vite dev server with refactored entry point...');
  
  try {
    // Create a temporary index.html that uses main-refactored.jsx
    const indexHtmlPath = path.resolve(__dirname, 'index.html');
    const originalContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    
    // Change the script entry point
    const modifiedContent = originalContent.replace(
      '<script type="module" src="/src/main.jsx"></script>', 
      '<script type="module" src="/src/main-refactored.jsx"></script>'
    );
    
    // Backup original and write modified version
    fs.writeFileSync(path.resolve(__dirname, 'index.html.bak'), originalContent, 'utf-8');
    fs.writeFileSync(indexHtmlPath, modifiedContent, 'utf-8');
    
    // Start the Vite dev server
    const server = await createServer({
      configFile: path.resolve(__dirname, 'vite.config.js'),
      server: {
        port: 5174, // Use a different port to avoid conflicts with original version
        open: true
      }
    });
    
    await server.listen();
    
    // Set up cleanup on exit
    ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
      process.on(signal, () => {
        console.log('\nRestoring original index.html...');
        try {
          fs.writeFileSync(indexHtmlPath, originalContent, 'utf-8');
          console.log('Original index.html restored');
          server.close();
          process.exit(0);
        } catch (e) {
          console.error('Error restoring index.html:', e);
          process.exit(1);
        }
      });
    });
    
    process.on('exit', () => {
      console.log('Exiting...');
      try {
        fs.writeFileSync(indexHtmlPath, originalContent, 'utf-8');
        console.log('Original index.html restored');
      } catch (e) {
        console.error('Error restoring index.html:', e);
      }
    });
    
    return server;
  } catch (e) {
    console.error('Error starting dev server:', e);
    process.exit(1);
  }
}

startDevServer();
