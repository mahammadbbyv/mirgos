# Mirgos Connection Troubleshooting Guide (Updated)

This guide helps diagnose and resolve connection issues between the frontend and backend of the Mirgos game.

## Using the New Debug Tools

We've added powerful debugging tools to help identify and fix connection issues:

### In-Browser Debug Tools

Access these tools from your browser console (F12):

```javascript
// Check socket connection status
window.mirgosDebug.chatTestUtils.checkSocketConnection();

// Force socket reconnection
window.mirgosDebug.chatTestUtils.forceReconnect();

// Test lobby chat
window.mirgosDebug.chatTestUtils.testRoomChat("Test message");

// Test game state request
window.mirgosDebug.chatTestUtils.testGameState();

// Test chat history retrieval
window.mirgosDebug.chatTestUtils.testChatHistory();

// Increase debug logging level
window.mirgosDebug.setDebugLevel(window.mirgosDebug.DEBUG_LEVEL.VERBOSE);
```

### Enhanced Testing Script

Run the enhanced testing script to automatically start both servers with improved debugging:

```powershell
node test-enhanced.js
```

## Common Connection Issues

### 1. Lobby Chat Not Working

**Symptoms:**
- Messages don't appear after sending
- Other players' messages don't show up
- "Loading chat messages" spinner continues indefinitely

**Solutions:**
1. Check socket connection status:
   ```javascript
   window.mirgosDebug.chatTestUtils.checkSocketConnection();
   ```
   
2. Force socket reconnection:
   ```javascript
   window.mirgosDebug.chatTestUtils.forceReconnect();
   ```
   
3. Test sending a message to verify the chat system:
   ```javascript
   window.mirgosDebug.chatTestUtils.testRoomChat("Test message");
   ```

4. Verify the message was sent by checking chat history:
   ```javascript
   window.mirgosDebug.chatTestUtils.testChatHistory();
   ```

### 2. Game State Initialization Errors

**Symptoms:**
- "Game state is missing or not initialized" error
- Game board doesn't appear
- No country information shown

**Solutions:**
1. Request game state directly:
   ```javascript
   window.mirgosDebug.chatTestUtils.testGameState();
   ```
   
2. Verify lobby ID is correctly stored:
   ```javascript
   console.log("Current lobby:", localStorage.getItem('currentLobby'));
   ```

3. Verify player name is correctly stored:
   ```javascript
   console.log("Player name:", localStorage.getItem('playerName'));
   ```

4. Try rejoining the lobby if game state is missing

### 3. Socket Connection Issues

**Symptoms:**
- "Socket connection error" messages in console
- Repeated reconnection attempts
- Features not working due to missing connection

**Solutions:**
1. Check CORS configuration in backend server
2. Verify server is running on port 3002
3. Check for network issues or firewalls blocking WebSockets
4. Try using a different browser
5. Restart both frontend and backend servers

## Server-Side Troubleshooting

If you need to investigate server-side issues:

1. Check backend console for errors:
   - Look for Socket.IO connection logs
   - Check for game state initialization errors
   - Look for chat message handling issues

2. Verify the Socket.IO server is properly configured:
   - CORS settings should allow your frontend origin
   - Events should be properly registered
   - Error handling should be in place

3. Restart the backend server if it seems unresponsive

## Starting Clean

To start with a completely fresh setup:

1. Close all terminal windows and browser tabs
2. Run the enhanced test script:
   ```powershell
   node test-enhanced.js
   ```
3. Access the game at http://localhost:5173
4. Use the debug tools to verify all systems

## Still Having Issues?

If you're still experiencing connection problems:

1. Set debug level to VERBOSE to get more detailed logs:
   ```javascript
   window.mirgosDebug.setDebugLevel(window.mirgosDebug.DEBUG_LEVEL.VERBOSE);
   ```

2. Check the browser console for detailed error messages

3. Review the server logs for any backend errors

4. Make sure your network allows WebSocket connections
