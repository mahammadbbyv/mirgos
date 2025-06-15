/**
 * Debug Connection Helper
 * 
 * This file can be imported to debug Socket.IO connections
 */

const debugConnection = (socket, serverUrl) => {
  // Track connection status
  console.log('Setting up Socket.IO debug listeners for:', serverUrl);
  
  // Connection lifecycle events
  socket.on('connect', () => {
    console.log('%c[Socket.IO] Connected successfully!', 'color: green; font-weight: bold');
    console.log('Socket ID:', socket.id);
  });
  
  socket.on('connect_error', (err) => {
    console.error('%c[Socket.IO] Connection error:', 'color: red; font-weight: bold', err.message);
    console.error('Error details:', err);
    
    // Common error troubleshooting suggestions
    if (err.message.includes('CORS')) {
      console.info('%cPossible CORS issue - Check server CORS configuration', 'color: blue');
    }
    
    if (err.message.includes('xhr poll error')) {
      console.info('%cXHR Poll Error - Check if server is running on the correct port', 'color: blue');
    }
    
    if (err.message.includes('timeout')) {
      console.info('%cTimeout - Server might be unresponsive or wrong URL', 'color: blue');
    }
  });
  
  socket.on('disconnect', (reason) => {
    console.warn('[Socket.IO] Disconnected. Reason:', reason);
  });
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('[Socket.IO] Reconnection attempt:', attemptNumber);
  });
  
  socket.on('reconnect', (attemptNumber) => {
    console.log('%c[Socket.IO] Reconnected after attempts:', 'color: green', attemptNumber);
  });
  
  socket.on('reconnect_failed', () => {
    console.error('%c[Socket.IO] Reconnection failed after all attempts', 'color: red');
  });
  
  socket.on('error', (err) => {
    console.error('[Socket.IO] Error:', err);
  });
  
  // Check for connection status immediately
  console.log('[Socket.IO] Current connection status:', socket.connected ? 'Connected' : 'Disconnected');
};

// Network request monitor
const monitorNetworkRequests = () => {
  // Create a fetch monitor
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    console.log('[Network] Fetch request to:', args[0]);
    try {
      const response = await originalFetch(...args);
      console.log(`[Network] Fetch response from ${args[0]}: Status ${response.status}`);
      return response;
    } catch (err) {
      console.error('[Network] Fetch error:', err);
      throw err;
    }
  };
  
  console.log('[Network] Request monitoring initialized');
};

// Export debug helpers
export {
  debugConnection,
  monitorNetworkRequests
};
