/**
 * Socket.IO Connection Debug Utility
 * 
 * This utility provides enhanced debugging for Socket.IO connections,
 * specifically targeting the issues in the Mirgos game.
 */

import { socket } from './lobby-refactored';

// Debug levels
const DEBUG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  VERBOSE: 4
};

// Current debug level (can be changed at runtime)
let currentDebugLevel = DEBUG_LEVELS.INFO;

// Set debug level
export const setDebugLevel = (level) => {
  if (Object.values(DEBUG_LEVELS).includes(level)) {
    currentDebugLevel = level;
    console.log(`Socket debug level set to ${Object.keys(DEBUG_LEVELS).find(k => DEBUG_LEVELS[k] === level)}`);
  }
};

// Log with level control
const logWithLevel = (level, ...args) => {
  if (currentDebugLevel >= level) {
    console.log(...args);
  }
};

// Check socket connection status
export const checkSocketConnection = () => {
  if (!socket) {
    logWithLevel(DEBUG_LEVELS.ERROR, '❌ Socket is not initialized');
    return false;
  }
  
  if (socket.connected) {
    logWithLevel(DEBUG_LEVELS.INFO, '✅ Socket is connected', socket.id);
    return true;
  } else {
    logWithLevel(DEBUG_LEVELS.ERROR, '❌ Socket is not connected');
    return false;
  }
};

// Force reconnect
export const forceReconnect = () => {
  if (!socket) {
    logWithLevel(DEBUG_LEVELS.ERROR, '❌ Cannot reconnect: Socket is not initialized');
    return false;
  }
  
  logWithLevel(DEBUG_LEVELS.INFO, 'Forcing socket reconnection...');
  socket.disconnect();
  setTimeout(() => {
    socket.connect();
  }, 500);
  return true;
};

// Monitor socket events
export const monitorSocketEvents = () => {
  if (!socket) {
    logWithLevel(DEBUG_LEVELS.ERROR, '❌ Cannot monitor events: Socket is not initialized');
    return false;
  }
  
  // Track connection events
  socket.on('connect', () => {
    logWithLevel(DEBUG_LEVELS.INFO, '✅ Socket connected:', socket.id);
  });
  
  socket.on('disconnect', (reason) => {
    logWithLevel(DEBUG_LEVELS.WARN, '❌ Socket disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    logWithLevel(DEBUG_LEVELS.ERROR, '❌ Connection error:', error.message);
  });
  
  socket.on('reconnect_attempt', (attempt) => {
    logWithLevel(DEBUG_LEVELS.INFO, '🔄 Reconnection attempt:', attempt);
  });
  
  // Monitor game events
  socket.on('game_state', (state) => {
    logWithLevel(DEBUG_LEVELS.INFO, '🎲 Game state received');
    logWithLevel(DEBUG_LEVELS.VERBOSE, 'Game state details:', state);
  });
  
  socket.on('round_start', (data) => {
    logWithLevel(DEBUG_LEVELS.INFO, '🔄 Round start:', data.roundStartTime);
  });
  
  // Chat events
  socket.on('room_message', (msg) => {
    logWithLevel(DEBUG_LEVELS.INFO, '💬 Room message received from:', msg.player);
    logWithLevel(DEBUG_LEVELS.VERBOSE, 'Message details:', msg);
  });
  
  socket.on('private_message', (msg) => {
    logWithLevel(DEBUG_LEVELS.INFO, '📝 Private message received from:', msg.player, 'to:', msg.to);
    logWithLevel(DEBUG_LEVELS.VERBOSE, 'Message details:', msg);
  });
  
  logWithLevel(DEBUG_LEVELS.INFO, '✅ Socket event monitoring enabled');
  
  // Return unsubscribe function
  return () => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('reconnect_attempt');
    socket.off('game_state');
    socket.off('round_start');
    socket.off('room_message');
    socket.off('private_message');
    
    logWithLevel(DEBUG_LEVELS.INFO, '❌ Socket event monitoring disabled');
  };
};

// Check important game state
export const diagnoseGameState = (gameState) => {
  if (!gameState) {
    logWithLevel(DEBUG_LEVELS.ERROR, '❌ Game state is null or undefined');
    return {
      valid: false,
      issues: ['Game state is null or undefined']
    };
  }
  
  const issues = [];
  
  // Check essential properties
  if (!gameState.round) {
    issues.push('Missing round information');
  }
  
  if (!gameState.playerCountries || Object.keys(gameState.playerCountries).length === 0) {
    issues.push('No player countries assigned');
  }
  
  if (!gameState.cities || Object.keys(gameState.cities).length === 0) {
    issues.push('No city information available');
  }
  
  if (issues.length > 0) {
    logWithLevel(DEBUG_LEVELS.WARN, '⚠️ Game state has issues:', issues);
    return {
      valid: false,
      issues
    };
  }
  
  logWithLevel(DEBUG_LEVELS.INFO, '✅ Game state looks valid');
  return {
    valid: true,
    issues: []
  };
};

// Export debug levels for external use
export const DEBUG_LEVEL = DEBUG_LEVELS;
