import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LobbyList from './pages/LobbyList';
import Lobby from './pages/Lobby';
import GameHUDRefactored from './pages/GameHUDRefactored'; // Use refactored game HUD
import { connectToServer } from './utils/lobby-refactored'; // Use refactored lobby connection
import { debugConnection, monitorNetworkRequests } from './debug-connection';
import { socket } from './utils/lobby-refactored';
import { monitorSocketEvents, setDebugLevel, DEBUG_LEVEL } from './utils/socketDebug';
import { chatTestUtils } from './utils/chatTest';

// Enable detailed logging for development
setDebugLevel(DEBUG_LEVEL.VERBOSE); // More detailed logging

// Create an explicit connection diagnostics function
const initializeConnection = () => {
  // First disconnect if we already have a socket connection
  if (socket && socket.connected) {
    console.log('Disconnecting existing socket before reconnecting...');
    socket.disconnect();
  }
  
  console.log('Initializing fresh socket connection...');
  connectToServer();
  
  // Set up advanced Socket.IO debugging
  if (socket) {
    // Enable robust socket monitoring
    monitorSocketEvents();
    
    // Monitor network requests
    monitorNetworkRequests();
    
    // Debug connection specific to our server
    debugConnection(socket, 'http://localhost:3000');
    
    // Listen for specific issues with chat
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(`Socket error: ${error.message || 'Unknown error'}`);
    });
    
    // Make debugging tools available globally
    window.mirgosSocket = socket;
    window.mirgosDebug = { 
      chatTestUtils,
      socket,
      connectToServer,
      setDebugLevel,
      DEBUG_LEVEL,
      forceReconnect: () => {
        socket.disconnect();
        setTimeout(() => connectToServer(), 1000);
      },
      testLobbyChat: () => chatTestUtils.testRoomChat('Debug test message')
    };
    
    console.log('Socket connection ready. Debug tools available at window.mirgosDebug');
  }
};

// Initialize connection on load
initializeConnection();

// Add a recovery mechanism
let connectionAttempts = 0;
const maxReconnectAttempts = 5;

window.addEventListener('focus', () => {
  // When window gets focus, check connection and reconnect if needed
  if (!socket || !socket.connected) {
    console.log('Window focused, checking connection...');
    connectionAttempts = 0;
    initializeConnection();
  }
});

// Add periodic connection check
setInterval(() => {
  if (!socket || !socket.connected) {
    if (connectionAttempts < maxReconnectAttempts) {
      console.log(`Auto reconnect attempt ${connectionAttempts + 1}/${maxReconnectAttempts}...`);
      connectionAttempts++;
      initializeConnection();
    }
  } else {
    connectionAttempts = 0;
  }
}, 30000); // Check every 30 seconds

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Login />
      },
      {
        path: '/signup',
        element: <Signup />
      },
      {
        path: '/lobbies',
        element: <LobbyList />
      },
      {
        path: '/lobby/:id',
        element: <Lobby />
      },      {
        path: '/game',
        element: <GameHUDRefactored />
      }
    ]
  }
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
