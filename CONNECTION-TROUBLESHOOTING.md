# Mirgos Connection Troubleshooting Guide

## Common Connection Issues

### Backend Service Not Starting
If the backend server fails to start:

1. Check the PowerShell window running the backend for any error messages
2. Verify that port 3002 is not already in use by another process:
   ```powershell
   Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
   ```
3. Try manually starting it with:
   ```powershell
   cd "c:\Users\Bemga\OneDrive - ITM STEP MMC\Desktop\mirgos\be"
   node start-refactored.js
   ```

### Frontend Service Not Starting
If the frontend dev server fails to start:

1. Check for Node.js errors in the PowerShell window
2. Verify that port 5174 is not already in use
3. Try manually starting it with:
   ```powershell
   cd "c:\Users\Bemga\OneDrive - ITM STEP MMC\Desktop\mirgos\fe"
   node start-refactored.js
   ```

### Socket.IO Connection Issues
If the frontend can't connect to the Socket.IO server:

1. Open the browser developer tools (F12) and check the console for errors
2. Verify the backend server is running and listening on port 3002
3. Test the connection using the test page:
   - Open `connection-test.html` directly in your browser
   - Enter the server URL: `http://localhost:3000`
   - Click "Connect" and check for successful connection
4. Verify CORS is properly configured:
   - The browser console will show CORS errors if they exist
   - Ensure your frontend origin is allowed in the backend CORS configuration

### Game State Not Initializing
If you see "Game state is missing or not initialized" errors:

1. Ensure the room creation and joining process completed successfully
2. Check the backend console for any game state initialization errors
3. Try refreshing the browser page and reconnecting to the game
4. Check browser console for any Socket.IO event errors

## Manual Testing Steps

1. Use the connection test page to verify basic Socket.IO connectivity:
   - Open `connection-test.html` directly in your browser
   - Click "Connect" to establish a Socket.IO connection
   - Create a lobby and verify it succeeds
   - Send a test message and verify it's received

2. Use browser developer tools to monitor network activity:
   - Open Chrome DevTools (F12) → Network tab
   - Filter by "WS" to see WebSocket connections
   - Look for the Socket.IO connection and check its status
   - Monitor Socket.IO frames for event data

3. Test with an alternative browser to rule out browser-specific issues

## Quick Fixes

- **Reset Everything**: Close all PowerShell windows and browser tabs, then restart with `launch-refactored.ps1`
- **Clear Browser Cache**: Clear your browser cache or try in Incognito/Private mode
- **Check Firewall**: Ensure Windows Firewall isn't blocking Node.js or the ports
- **Update Socket.IO URL**: If hostname or IP has changed, update it in `lobby-refactored.js`
- **Disable Extensions**: Some browser extensions can interfere with WebSocket connections
