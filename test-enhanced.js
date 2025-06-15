/**
 * Mirgos Connection Test Script
 * 
 * This script helps diagnose and fix connection issues between the Mirgos game frontend and backend.
 * It provides tools to test Socket.IO connections, game state initialization, and chat functionality.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Config
const config = {
    backendPath: path.resolve(__dirname, 'be'),
    frontendPath: path.resolve(__dirname, 'fe'),
    backendScript: path.resolve(__dirname, 'be', 'start-refactored.js'),
    frontendStartCmd: 'npm run dev',
    serverPort: 3002,
    testTimeout: 10000 // 10 seconds timeout
};

// Helper functions
function log(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function logError(message) {
    console.error(`[${new Date().toLocaleTimeString()}] ERROR: ${message}`);
}

// Start the backend server
function startBackend() {
    log('Starting backend server...');
    
    const backend = spawn('node', [config.backendScript], {
        cwd: config.backendPath,
        stdio: 'pipe',
        shell: true
    });
    
    backend.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            console.log(`[Backend] ${line}`);
        });
    });
    
    backend.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            console.error(`[Backend ERROR] ${line}`);
        });
    });
    
    backend.on('close', (code) => {
        if (code !== 0) {
            logError(`Backend server process exited with code ${code}`);
        }
    });
    
    return backend;
}

// Start the frontend development server
function startFrontend() {
    log('Starting frontend development server...');
    
    const frontend = spawn('npm', ['run', 'dev'], {
        cwd: config.frontendPath,
        stdio: 'pipe',
        shell: true
    });
    
    frontend.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            console.log(`[Frontend] ${line}`);
        });
    });
    
    frontend.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            console.error(`[Frontend ERROR] ${line}`);
        });
    });
    
    frontend.on('close', (code) => {
        if (code !== 0) {
            logError(`Frontend server process exited with code ${code}`);
        }
    });
    
    return frontend;
}

// Wait for servers to start
function waitForServerStart() {
    log('Waiting for servers to start...');
    
    return new Promise(resolve => {
        // Give servers time to initialize
        setTimeout(resolve, 5000);
    });
}

// Main function
async function main() {
    log('Starting Mirgos test script...');
    
    // Start backend and frontend
    const backend = startBackend();
    const frontend = startFrontend();
    
    // Wait for servers to start
    await waitForServerStart();
    
    log('Servers are running. Access the game at http://localhost:5173');
    log('Debug tools are available in the browser console under window.mirgosDebug');
    log('To test chat functionality, use window.mirgosDebug.chatTestUtils.testRoomChat()');
    log('To test game state, use window.mirgosDebug.chatTestUtils.testGameState()');
    
    log('\nLeave this terminal running and follow the instructions in the browser.');
    log('Press Ctrl+C to stop all servers when done testing.');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        log('Shutting down servers...');
        backend.kill();
        frontend.kill();
        process.exit(0);
    });
}

// Run the script
main().catch(err => {
    logError('Script failed:');
    console.error(err);
    process.exit(1);
});
