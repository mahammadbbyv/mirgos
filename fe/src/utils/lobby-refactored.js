import { io } from "socket.io-client";

// Use the refactored server
const SERVER = 'http://localhost:3000';

export let socket = null;

// Setup socket event handlers for connection monitoring
const setupSocketEventHandlers = () => {
    if (!socket) return;
    
    // Connection event handlers with timestamps
    socket.on("connect", () => {
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] ✅ Connected to server on ${SERVER} with ID: ${socket.id}`);
    });
    
    socket.on("disconnect", (reason) => {
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] ⚠️ Disconnected from server. Reason: ${reason}`);
        
        // If connection was closed by server, try to reconnect
        if (reason === 'io server disconnect') {
            console.log(`[${time}] Server disconnected the socket. Attempting to reconnect...`);
            socket.connect();
        }
    });
    
    socket.on("connect_error", (error) => {
        const time = new Date().toLocaleTimeString();
        console.error(`[${time}] ❌ Connection error:`, error.message);
        
        // Log helpful information for common errors
        if (error.message.includes('CORS')) {
            console.info(`[${time}] CORS error detected. Check server CORS configuration.`);
        }
        
        if (error.message.includes('xhr poll error')) {
            console.info(`[${time}] XHR Poll error detected. Server might be down or unreachable.`);
        }
    });
    
    socket.on("reconnect", (attemptNumber) => {
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] 🔄 Reconnected to server after ${attemptNumber} attempts`);
    });
    
    socket.on("reconnect_error", (error) => {
        const time = new Date().toLocaleTimeString();
        console.error(`[${time}] ❌ Reconnection error:`, error.message);
    });
    
    socket.on("reconnect_attempt", (attemptNumber) => {
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] 🔄 Reconnection attempt #${attemptNumber}...`);
    });
};

// Always connect to the main server for sockets
export const connectToServer = () => {
    // Check if socket already exists
    if (socket) {
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] Socket already exists. Connection state:`, socket.connected ? "Connected" : "Disconnected");
        
        // If disconnected, try to reconnect
        if (!socket.connected) {
            console.log(`[${time}] Attempting to reconnect existing socket...`);
            
            // Reset any stale listeners first
            if (socket.off) {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('connect_error');
                socket.off('reconnect');
                socket.off('reconnect_error');
            }
            
            // Setup fresh event listeners before connecting
            setupSocketEventHandlers();
            
            // Reconnect
            socket.connect();
        }
        
        return socket;
    }
    
    // Create new socket with improved connection options
    socket = io(SERVER, { 
        autoConnect: false,
        transports: ['websocket'],       // Use websocket only for now to avoid transport switching issues
        withCredentials: true,
        reconnectionAttempts: 15,        // More attempts before giving up
        reconnectionDelay: 1000,         // Start with 1 second delay
        reconnectionDelayMax: 5000,      // Maximum 5 second delay between retries
        timeout: 20000,                  // Increased timeout for more reliability
        forceNew: false,                 // Don't force new connection to allow reconnections
        upgrade: false,                  // Disable transport upgrade to avoid switching issues
        reconnection: true               // Enable auto-reconnection
    });
    
    // Make socket available globally for debugging
    window.socket = socket;
    
    // Setup event handlers
    setupSocketEventHandlers();
    
    // Connect immediately
    socket.connect();
    
    return socket;
};

// Fetch the list of lobbies
export const loadLobbyList = async (callback) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${SERVER}/api/lobbies`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            credentials: 'include',
        });
        const data = await response.json();
        callback(data);
    } catch (error) {
        console.error('Error loading lobbies:', error);
        callback([]);
    }
};

// Create a new lobby
export const createLobby = (playerName) => {
    return new Promise((resolve, reject) => {
        socket.emit('create_lobby', { playerName });
        
        socket.once('lobby_created', (data) => {
            if (data && data.lobbyId) {
                // Store the lobbyId on the socket for later reference
                socket.lobbyId = data.lobbyId;
                resolve(data.lobbyId);
            } else {
                reject('Invalid lobby data received');
            }
        });
        
        socket.once('error', (error) => {
            reject(error.message || 'Unknown lobby creation error');
        });
        
        // Add timeout to prevent hanging promise
        setTimeout(() => {
            reject('Timeout: lobby creation failed');
        }, 10000); // Increased timeout to 10 seconds
    });
};

// Join an existing lobby
export const joinLobby = (lobbyId, playerName, onLobbyData, onGameState, onMessage) => {
    // Ensure we have an active socket connection
    if (!socket) {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot join lobby: Socket is not initialized`);
        // Try to establish a connection and wait for it
        const newSocket = connectToServer();
        
        // If we still don't have a socket after trying to connect, reject
        if (!newSocket) {
            return Promise.reject(new Error('Failed to initialize socket connection. Please refresh the page.'));
        }
        
        // If socket exists but isn't connected yet, wait a moment
        if (!newSocket.connected) {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Socket connection timed out. Please try again.'));
                }, 5000); // 5 second timeout
                
                newSocket.once('connect', () => {
                    clearTimeout(timeout);
                    resolve(joinLobby(lobbyId, playerName, onLobbyData, onGameState, onMessage));
                });
                
                newSocket.once('connect_error', (err) => {
                    clearTimeout(timeout);
                    reject(new Error(`Socket connection error: ${err.message}`));
                });
            });
        }
    }
    
    // Check if the socket is connected
    if (!socket.connected) {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot join lobby: Socket is not connected`);
        
        // Try to reconnect and wait
        socket.connect();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Socket connection timed out. Please try again.'));
            }, 5000); // 5 second timeout
            
            socket.once('connect', () => {
                clearTimeout(timeout);
                resolve(joinLobby(lobbyId, playerName, onLobbyData, onGameState, onMessage));
            });
            
            socket.once('connect_error', (err) => {
                clearTimeout(timeout);
                reject(new Error(`Socket connection error: ${err.message}`));
            });
        });
    }
    
    if (typeof onLobbyData === 'function' || typeof onGameState === 'function' || typeof onMessage === 'function') {
        // Legacy mode - support callbacks for backward compatibility
        console.log(`[${new Date().toLocaleTimeString()}] Using legacy joinLobby with callbacks`);
        
        // Make sure the socket exists before emitting
        if (socket && socket.emit) {
            socket.emit('join_lobby', { lobbyId, playerName });
        } else {
            console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot emit join_lobby event: Socket not connected`);
            return Promise.reject(new Error('Socket not connected. Please refresh the page.'));
        }
        
        // Set up event handlers
        if (typeof onLobbyData === 'function' && socket) {
            const lobbyHandler = (data) => {
                // Ensure this is for our lobby
                if (data && (data.id === lobbyId || data.lobbyId === lobbyId)) {
                    // Store the lobbyId on the socket for later reference
                    socket.lobbyId = lobbyId;
                    onLobbyData(data);
                }
            };
            // Remove any existing handler
            if (socket.off) socket.off('lobby', lobbyHandler);
            // Add new handler
            if (socket.on) socket.on('lobby', lobbyHandler);
        }
          if (typeof onGameState === 'function' && socket && socket.on) {
            socket.on('game_state', onGameState);
        }
        
        if (typeof onMessage === 'function' && socket && socket.on) {
            socket.on('room_message', onMessage);
        }
        
        if (socket && socket.once) {
            socket.once('error', (error) => {
                console.error(`[${new Date().toLocaleTimeString()}] ❌ Error joining lobby:`, error);
            });
        }
        
        return Promise.resolve({ success: true });
    } else {
        // Promise-based mode
        return new Promise((resolve, reject) => {
            if (!socket || !socket.emit) {
                const errorMsg = 'Cannot join lobby: Socket connection not available';
                console.error(`[${new Date().toLocaleTimeString()}] ❌ ${errorMsg}`);
                return reject(new Error(errorMsg));
            }
            
            socket.emit('join_lobby', { lobbyId, playerName });
            
            // Set up a one-time event handler for lobby data
            const handleLobby = (data) => {
                // Check if this event is for the lobby we're trying to join
                if (data && (data.id === lobbyId || data.lobbyId === lobbyId)) {
                    // Store the lobbyId on the socket for later reference
                    socket.lobbyId = lobbyId;
                    socket.off('lobby', handleLobby);
                    resolve(data);
                }
            };
            
            socket.on('lobby', handleLobby);
            
            socket.once('error', (error) => {
                socket.off('lobby', handleLobby);
                reject(error.message || 'Unknown error joining lobby');
            });
            
            // Add timeout to prevent hanging promise
            setTimeout(() => {
                socket.off('lobby', handleLobby);
                reject('Timeout: failed to join lobby');
            }, 20000); // Increased timeout to 20 seconds for better reliability
        });
    }
};

// Update player's country selection
export const updateCountry = (lobbyId, playerName, country) => {
    // Try to use the local socket variable first
    if (socket && socket.emit) {
        socket.emit('update_country', { lobbyId, playerName, country });
        return;
    }
    
    // Fall back to window.socket if available
    if (window.socket && window.socket.emit) {
        window.socket.emit('update_country', { lobbyId, playerName, country });
        return;
    }
    
    // Log error if neither socket is available
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot update country: Socket not connected`);
};

// Start the game (host only)
export const startGame = (lobbyId) => {
    if (socket && socket.emit) {
        socket.emit('start_game', { lobbyId });
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot start game: Socket not connected`);
    }
};

// Submit an action during gameplay
export const submitAction = (lobbyId, playerName, action) => {
    if (socket && socket.emit) {
        socket.emit('submit_action', { lobbyId, playerName, action });
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot submit action: Socket not connected`);
    }
};

// Finish turn
export const finishTurn = (lobbyId, playerName) => {
    if (socket && socket.emit) {
        socket.emit('finish_turn', { lobbyId, playerName });
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot finish turn: Socket not connected`);
    }
};

// Undo finish turn
export const undoFinish = (lobbyId, playerName) => {
    if (socket && socket.emit) {
        socket.emit('undo_finish', { lobbyId, playerName });
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot undo finish: Socket not connected`);
    }
};

// Send a chat message to the room
export const sendRoomMessage = (message) => {
    if (socket && socket.emit) {
        socket.emit('room_message', message);
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot send room message: Socket not connected`);
    }
};

// Send a private message to another player
export const sendPrivateMessage = (message) => {
    if (socket && socket.emit) {
        socket.emit('private_message', message);
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot send private message: Socket not connected`);
    }
};

// Request chat history
export const requestChatHistory = (lobbyId, chatType, withPlayer = null) => {
    if (socket && socket.emit) {
        socket.emit('request_chat_history', { lobbyId, chatType, withPlayer });
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot request chat history: Socket not connected`);
    }
};

// Mark messages as read
export const markAsRead = (lobbyId, withPlayer) => {
    if (socket && socket.emit) {
        socket.emit('mark_messages_read', { lobbyId, withPlayer });
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot mark messages as read: Socket not connected`);
    }
};

// Send typing status
export const sendTypingStatus = (lobbyId, to, isTyping) => {
    if (socket && socket.emit) {
        socket.emit('typing_status', { lobbyId, to, isTyping });
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot send typing status: Socket not connected`);
    }
};

// Send a message to the lobby (compatibility with old API)
export const sendMessageToLobby = (message) => {
    // Directly check for socket instead of just relying on sendRoomMessage
    if (socket && socket.emit) {
        socket.emit('room_message', message);
    } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Cannot send message: Socket not connected`);
    }
};

// Disconnect from server (compatibility with old API)
export const disconnectFromServer = () => {
    if (socket && socket.connected) {
        console.log(`[${new Date().toLocaleTimeString()}] 🔌 Disconnecting from server...`);
        
        // Remove all listeners before disconnecting to prevent memory leaks
        if (socket.off) {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('reconnect');
            socket.off('reconnect_error');
            socket.off('lobby');
            socket.off('room_message');
            socket.off('error');
        }
        
        socket.disconnect();
    }
};

// Get the current socket instance
export const getSocket = () => {
    // Return local socket variable first if it exists and is connected
    if (socket && socket.connected) {
        return socket;
    }
    // Fall back to window.socket if available
    if (window.socket && window.socket.connected) {
        return window.socket;
    }
    // If neither socket is connected but one exists, return that
    return socket || window.socket;
};

export default {
    socket,
    connectToServer,
    loadLobbyList,
    createLobby,
    joinLobby,
    updateCountry,
    startGame,
    submitAction,
    finishTurn,
    undoFinish,
    sendRoomMessage,
    sendPrivateMessage,
    requestChatHistory,
    markAsRead,
    sendTypingStatus,
    sendMessageToLobby,
    disconnectFromServer,
    getSocket
};
