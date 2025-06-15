/**
 * Chat Test Utility
 * 
 * This file provides a simple way to test the chat functionality
 * by sending test messages and checking for responses.
 */

import { socket, connectToServer } from './lobby-refactored';
import { 
  checkSocketConnection, 
  forceReconnect, 
  monitorSocketEvents,
  setDebugLevel,
  DEBUG_LEVEL
} from './socketDebug';

// Enable verbose logging
setDebugLevel(DEBUG_LEVEL.VERBOSE);

// Make sure socket is connected
if (!socket) {
  connectToServer();
}

// Constants
const TEST_LOBBY_ID = window.localStorage.getItem('currentLobby');
const TEST_PLAYER_NAME = window.localStorage.getItem('playerName') || 'TestUser';

/**
 * Test room chat functionality
 */
export const testRoomChat = (message = 'This is a test room message') => {
  if (!checkSocketConnection()) {
    console.error('Cannot test chat: Socket not connected');
    return false;
  }
  
  if (!TEST_LOBBY_ID) {
    console.error('Cannot test chat: No lobby ID found in localStorage');
    return false;
  }
  
  // Create a message with unique ID for tracking
  const testId = `test_${Date.now()}`;
  const testMessage = {
    id: testId,
    player: TEST_PLAYER_NAME,
    text: `${message} (ID: ${testId})`,
    time: Date.now(),
    to: 'all',
    lobbyId: TEST_LOBBY_ID
  };
  
  console.log('Sending test room message:', testMessage);
  
  // Set up one-time listener for our message
  let msgReceived = false;
  const listener = (msg) => {
    if (msg.id === testId) {
      console.log('✅ Test message received back:', msg);
      msgReceived = true;
      socket.off('room_message', listener);
    }
  };
  
  socket.on('room_message', listener);
  
  // Send test message
  socket.emit('room_message', testMessage);
  
  // Set timeout to check if message was received
  setTimeout(() => {
    if (!msgReceived) {
      console.error('❌ Test message was not received back after 5 seconds');
      socket.off('room_message', listener);
    }
  }, 5000);
  
  return true;
};

/**
 * Request room chat history
 */
export const testChatHistory = () => {
  if (!checkSocketConnection()) {
    console.error('Cannot test chat history: Socket not connected');
    return false;
  }
  
  if (!TEST_LOBBY_ID) {
    console.error('Cannot test chat history: No lobby ID found in localStorage');
    return false;
  }
  
  console.log('Requesting chat history for lobby:', TEST_LOBBY_ID);
  
  // Set up one-time listener for the response
  let historyReceived = false;
  const listener = (history) => {
    console.log('✅ Chat history received:', history);
    historyReceived = true;
    socket.off('chat_history', listener);
  };
  
  socket.on('chat_history', listener);
  
  // Request chat history
  socket.emit('request_chat_history', {
    lobbyId: TEST_LOBBY_ID,
    chatType: 'room'
  });
  
  // Set timeout to check if history was received
  setTimeout(() => {
    if (!historyReceived) {
      console.error('❌ Chat history was not received after 5 seconds');
      socket.off('chat_history', listener);
    }
  }, 5000);
  
  return true;
};

/**
 * Test game state requests
 */
export const testGameState = () => {
  if (!checkSocketConnection()) {
    console.error('Cannot test game state: Socket not connected');
    return false;
  }
  
  if (!TEST_LOBBY_ID) {
    console.error('Cannot test game state: No lobby ID found in localStorage');
    return false;
  }
  
  console.log('Requesting game state for lobby:', TEST_LOBBY_ID);
  
  // Set up one-time listener for the response
  let stateReceived = false;
  const listener = (state) => {
    console.log('✅ Game state received:', state);
    stateReceived = true;
    socket.off('game_state', listener);
  };
  
  socket.on('game_state', listener);
  
  // Request game state (if the game has started)
  socket.emit('request_game_state', {
    lobbyId: TEST_LOBBY_ID
  });
  
  // Set timeout to check if state was received
  setTimeout(() => {
    if (!stateReceived) {
      console.error('❌ Game state was not received after 5 seconds');
      socket.off('game_state', listener);
    }
  }, 5000);
  
  return true;
};

// Export utilities
export const chatTestUtils = {
  testRoomChat,
  testChatHistory,
  testGameState,
  checkSocketConnection,
  forceReconnect,
  monitorSocketEvents
};

// Make it available in the console
window.chatTestUtils = chatTestUtils;
