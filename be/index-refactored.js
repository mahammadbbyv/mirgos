const express = require('express');
const sql = require('mssql/msnodesqlv8');
const jwt = require('jsonwebtoken');
const net = require('net');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const localtunnel = require('localtunnel');

// Import custom modules
const chatManager = require('./utils/chatManager');
const lobbyManager = require('./utils/lobbyManager');
const gameManager = require('./utils/gameManager');

const app = express();
const port = 3002; // Use a different port to avoid conflicts with the original server
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables.');
    process.exit(1);
}
const jwtSecret = process.env.JWT_SECRET;

// Configure middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: true, // Allow all origins - more permissive for development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Setup HTTP server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true, // Allow all origins - more permissive for development
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
            "http://192.168.61.1:5173",
            "http://172.20.10.2:5173",
            "http://172.19.176.1:5173"
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    },
    transports: ['websocket', 'polling'] // Support both WebSocket and HTTP long-polling
});

// Database configuration
const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=MAGA;Database=MirgosDB;Trusted_Connection=Yes;',
    driver: 'msnodesqlv8'
};

// Connect to database
sql.connect(dbConfig).then(() => {
    console.log('Connected to MSSQL database');
}).catch(err => {
    console.error('Database connection failed:', err);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    let token = null;
    const authHeader = req.headers['authorization'];
    
    if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            token = authHeader;
        }
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }
    
    if (!token) {
        return res.status(401).json({ message: 'Access token is missing or invalid' });
    }
    
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// User controller
const userController = {
    signup: async (req, res) => {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        const passwordRegex = /^[\x20-\x7E]{8,20}$/;
        
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: 'Username can only contain letters and numbers' });
        }
        
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be 8-20 characters long and contain only printable characters' });
        }
        
        try {
            const pool = await sql.connect(dbConfig);
            const existingUser = await pool.request()
                .input('username', sql.VarChar, username)
                .query('SELECT * FROM Users WHERE username = @username');
            
            if (existingUser.recordset.length > 0) {
                return res.status(409).json({ message: 'User already exists' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            await pool.request()
                .input('username', sql.VarChar, username)
                .input('password', sql.VarChar, hashedPassword)
                .query('INSERT INTO Users (username, password) VALUES (@username, @password)');
            
            res.status(201).json({ message: 'User registered successfully' });
        } catch (err) {
            console.error('Error during signup:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    
    login: async (req, res) => {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        try {
            const pool = await sql.connect(dbConfig);
            const user = await pool.request()
                .input('username', sql.VarChar, username)
                .query('SELECT * FROM Users WHERE username = @username');
            
            if (user.recordset.length === 0) {
                console.log('User not found:', username);
                return res.status(401).json({ message: 'Invalid username or password' });
            }
            
            const userData = user.recordset[0];
            const validPassword = await bcrypt.compare(password, userData.password);
            
            if (!validPassword) {
                console.log('Invalid password for user:', username);
                return res.status(401).json({ message: 'Invalid username or password' });
            }
            
            // Clear any existing tokens for the user
            await pool.request()
                .input('username', sql.VarChar, username)
                .query('DELETE FROM UsersTokens WHERE username = @username');
            
            // Generate new token
            const token = jwt.sign(
                { id: userData.id, username: userData.username }, 
                jwtSecret, 
                { expiresIn: '1h' }
            );
            
            // Save token with device info
            const deviceInfo = req.headers['user-agent'] || '';
            await pool.request()
                .input('username', sql.VarChar, username)
                .input('token', sql.VarChar, token)
                .input('deviceinfo', sql.NVarChar, deviceInfo)
                .query('INSERT INTO UsersTokens (username, token, deviceinfo) VALUES (@username, @token, @deviceinfo)');
            
            // Set cookies and send response
            res.cookie('token', token, { httpOnly: true, secure: false });
            res.cookie('username', username, { httpOnly: true, secure: false });
            res.status(200).json({ message: 'Login successful', token });
        } catch (err) {
            console.error('Error during login:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    
    protected: (req, res) => {
        res.json({ message: 'Protected route accessed', user: req.user });
    }
};

// Lobby controller for TCP server (legacy, but kept for compatibility)
const lobbyController = {
    lobbies: new Map(),
    
    createLobby: (lobbyId, port) => {
        // Create TCP server for lobby
        const players = [];
        const server = net.createServer((socket) => {
            players.push({ id: socket.remoteAddress, socket });
            console.log(`Players in lobby ${lobbyId}:`, players.map(p => p.id));
            
            socket.on('end', () => {
                console.log(`Client disconnected from lobby ${lobbyId}`);
                const index = players.findIndex(p => p.socket === socket);
                if (index !== -1) players.splice(index, 1);
            });
            
            socket.on('error', (err) => {
                console.error(`Error in lobby ${lobbyId}:`, err);
            });
        });
        
        server.listen(port, () => {
            console.log(`Lobby ${lobbyId} TCP server listening on port ${port}`);
        });
        
        // Store server info
        lobbyController.lobbies.set(lobbyId, { server, port, players });
        
        // Ensure lobby is in Socket.io state also
        if (!lobbyState.has(lobbyId)) {
            lobbyState.set(lobbyId, lobbyManager.initializeLobby(lobbyId, null));
        }
    },
    
    getLobbies: () => {
        // Return lobbies from socket.io lobbyState for consistent data
        return Array.from(lobbyState.entries()).map(([id, lobby]) => ({
            id,
            players: Array.from(lobby.players.values()),
            host: lobby.host
        }));
    },
    
    closeLobby: (lobbyId) => {
        const lobby = lobbyController.lobbies.get(lobbyId);
        if (!lobby) {
            throw new Error('Lobby does not exist');
        }
        
        lobby.server.close(() => {
            console.log(`Lobby ${lobbyId} TCP server on port ${lobby.port} has been closed`);
        });
        
        lobbyController.lobbies.delete(lobbyId);
        
        // Also clean up Socket.io state
        if (lobbyState.has(lobbyId)) {
            lobbyState.delete(lobbyId);
        }
    }
};

// Initialize lobby state
const lobbyState = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('A user connected');
    
    // --- ENHANCED CHAT SYSTEM ---
    // Register all enhanced chat handlers
    chatManager.registerChatHandlers(socket, io, lobbyState);
    
    // --- LOBBY MANAGEMENT ---
    socket.on('create_lobby', ({ playerName }) => {
        const lobbyId = lobbyManager.generateLobbyId();
        const lobby = lobbyManager.initializeLobby(lobbyId, playerName);
        
        lobbyManager.addPlayer(lobby, playerName);
        lobbyState.set(lobbyId, lobby);
        
        socket.join(lobbyId);
        socket.lobbyId = lobbyId;
        socket.playerName = playerName;
        
        socket.emit('lobby_created', { lobbyId });
        io.to(lobbyId).emit('lobby', lobbyManager.getLobbyData(lobby));
    });
    
    socket.on('join_lobby', ({ lobbyId, playerName }) => {
        const lobby = lobbyState.get(lobbyId);
        
        if (!lobby) {
            socket.emit('error', { message: 'Lobby not found' });
            return;
        }
        
        if (lobbyManager.addPlayer(lobby, playerName)) {
            socket.join(lobbyId);
            socket.lobbyId = lobbyId;
            socket.playerName = playerName;
            
            io.to(lobbyId).emit('lobby', lobbyManager.getLobbyData(lobby));
            
            // Send room message about new player
            const joinMessage = {
                player: 'System',
                text: `${playerName} joined the lobby`,
                time: Date.now(),
                to: 'all',
                lobbyId,
                status: 'sent',
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            chatManager.storeMessage(lobby, joinMessage);
            io.to(lobbyId).emit('room_message', joinMessage);
            
            // Send game state to the player if game is in progress
            if (lobby.gameState) {
                socket.emit('game_state', gameManager.getGameStateForClient(lobby));
            }
        } else {
            socket.emit('error', { message: 'Could not join lobby' });
        }
    });
    
    socket.on('update_country', ({ lobbyId, playerName, country }) => {
        const lobby = lobbyState.get(lobbyId);
        
        if (lobby && lobbyManager.updatePlayerCountry(lobby, playerName, country)) {
            io.to(lobbyId).emit('lobby', lobbyManager.getLobbyData(lobby));
        }
    });

    // --- GAME START ---
    socket.on('start_game', ({ lobbyId }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby) return;
        
        // Only host can start the game
        const hostName = lobby.host;
        if (socket.playerName !== hostName) return;
        
        // Check if all players have chosen a country
        if (!lobbyManager.allPlayersSelectedCountry(lobby)) {
            io.to(lobbyId).emit('room_message', { 
                player: 'System', 
                text: 'All players must choose a country before starting the game.',
                time: Date.now(),
                to: 'all',
                lobbyId,
                status: 'sent',
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
            return;
        }
        
        // Check for duplicate countries
        if (lobbyManager.hasDuplicateCountries(lobby)) {
            io.to(lobbyId).emit('room_message', { 
                player: 'System', 
                text: 'Each player must select a different country.',
                time: Date.now(),
                to: 'all',
                lobbyId,
                status: 'sent',
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
            return;
        }
        
        // Initialize game state
        gameManager.initializeGameState(lobby);
        
        // Start countdown
        let seconds = 5;
        io.to(lobbyId).emit('start_countdown', seconds);
        
        const interval = setInterval(() => {
            seconds--;
            
            if (seconds > 0) {
                io.to(lobbyId).emit('start_countdown', seconds);
            } else {
                clearInterval(interval);
                io.to(lobbyId).emit('move_to_game');
                
                // Set and emit round start time
                const now = new Date().toISOString();
                lobby.gameState.roundStartTime = now;
                io.to(lobbyId).emit('round_start', { roundStartTime: now });
                
                // Emit game state to all players
                io.to(lobbyId).emit('game_state', gameManager.getGameStateForClient(lobby));
            }
        }, 1000);
    });

    // Database configuration    // --- ROUND TIME MANAGEMENT ---
    socket.on('request_round_start', ({ lobbyId }) => {
        const lobby = lobbyState.get(lobbyId);
        
        if (lobby && lobby.gameState && lobby.gameState.roundStartTime) {
            socket.emit('round_start', { 
                roundStartTime: lobby.gameState.roundStartTime 
            });
        }
    });
    
    // Direct request for game state
    socket.on('request_game_state', ({ lobbyId }) => {
        const lobby = lobbyState.get(lobbyId);
        
        if (lobby && lobby.gameState) {
            console.log(`Game state requested for lobby ${lobbyId} by ${socket.playerName || 'unknown player'}`);
            socket.emit('game_state', gameManager.getGameStateForClient(lobby));
        } else {
            console.log(`Game state requested for lobby ${lobbyId} but no game state exists`);
            socket.emit('error', { message: 'Game state not initialized' });
        }
    });

    // --- PLAYER ACTIONS ---
    socket.on('submit_action', ({ lobbyId, playerName, action }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby || !lobby.gameState) return;
        
        const gameState = lobby.gameState;
        const country = gameState.playerCountries[playerName]?.en;
        
        if (!country) return;
        
        // Add the action to the player's action queue
        if (!gameState.actions[playerName]) {
            gameState.actions[playerName] = [];
        }
        
        // Add metadata to the action
        const actionWithMeta = {
            ...action,
            playerName,
            country,
            timestamp: Date.now()
        };
        
        gameState.actions[playerName].push(actionWithMeta);
        
        // Emit updated game state to the player
        socket.emit('game_state', gameManager.getGameStateForClient(lobby));
    });
    
    socket.on('finish_turn', ({ lobbyId, playerName }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby || !lobby.gameState) return;
        
        // Mark player as finished
        lobby.gameState.finished[playerName] = true;
        
        // Check if all players have finished
        const allFinished = Object.keys(lobby.gameState.playerCountries).every(
            player => lobby.gameState.finished[player]
        );
        
        // Get list of players who haven't finished yet
        const waitingPlayers = Object.keys(lobby.gameState.playerCountries).filter(
            player => !lobby.gameState.finished[player]
        );
        
        // Broadcast waiting players list
        io.to(lobbyId).emit('waiting_players', waitingPlayers);
        
        if (allFinished) {
            // Process all actions and update game state
            gameManager.processActionsAndUpdateGameState(lobby);
            
            // Start a new round
            lobby.gameState.round++;
            
            // Reset finished status and actions for all players
            lobby.gameState.finished = {};
            lobby.gameState.actions = {};
            
            // Set new round start time
            const now = new Date().toISOString();
            lobby.gameState.roundStartTime = now;
            
            // Signal the round summary
            io.to(lobbyId).emit('all_finished', true);
            
            // After a delay, start the new round
            setTimeout(() => {
                // Broadcast new game state and round start
                io.to(lobbyId).emit('game_state', gameManager.getGameStateForClient(lobby));
                io.to(lobbyId).emit('round_start', { roundStartTime: now });
                io.to(lobbyId).emit('all_finished', false);
            }, 5000);
        }
    });
    
    socket.on('undo_finish', ({ lobbyId, playerName }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby || !lobby.gameState) return;
        
        // Unmark player as finished
        lobby.gameState.finished[playerName] = false;
        
        // Get updated list of waiting players
        const waitingPlayers = Object.keys(lobby.gameState.playerCountries).filter(
            player => !lobby.gameState.finished[player]
        );
        
        // Broadcast updated waiting players list
        io.to(lobbyId).emit('waiting_players', waitingPlayers);
    });

    socket.on('disconnect', () => {
        const { lobbyId, playerName } = socket;
        console.log(`Player ${playerName} disconnected from lobby ${lobbyId}`);
        
        if (lobbyId && playerName) {
            const lobby = lobbyState.get(lobbyId);
            
            if (lobby) {
                // Remove the player from the lobby
                lobbyManager.removePlayer(lobby, playerName);
                
                if (lobby.players.size === 0) {
                    // Remove empty lobby
                    lobbyState.delete(lobbyId);
                } else {
                    // Notify remaining players
                    io.to(lobbyId).emit('lobby', lobbyManager.getLobbyData(lobby));
                    
                    // Send leave message
                    const leaveMessage = {
                        player: 'System',
                        text: `${playerName} left the lobby`,
                        time: Date.now(),
                        to: 'all',
                        lobbyId,
                        status: 'sent',
                        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    };
                    
                    chatManager.storeMessage(lobby, leaveMessage);
                    io.to(lobbyId).emit('room_message', leaveMessage);
                }
            }
        }
    });
});

// --- API ROUTES ---

// Lobby management
app.post('/api/lobby', authenticateToken, (req, res) => {
    const username = req.user.username;
    
    try {
        // Find available port
        let port = 4000;
        while ([...lobbyController.lobbies.values()].some(lobby => lobby.port === port)) {
            port++;
        }
        
        // Use a unique lobby name or the one provided
        const lobbyname = req.body.lobbyname || `${username}'s Lobby`;
        
        // Create TCP lobby (legacy)
        lobbyController.createLobby(lobbyname, port);
        
        res.status(201).json({ 
            message: `Lobby ${lobbyname} created`, 
            port,
            lobbyId: lobbyname
        });
    } catch (err) {
        console.error('Error creating lobby:', err);
        res.status(500).json({ message: 'Failed to create lobby' });
    }
});

app.delete('/api/lobby/:lobbyId', authenticateToken, (req, res) => {
    const { lobbyId } = req.params;
    
    try {
        lobbyController.closeLobby(lobbyId);
        res.status(200).json({ message: `Lobby ${lobbyId} closed` });
    } catch (err) {
        console.error('Error closing lobby:', err);
        res.status(500).json({ message: 'Failed to close lobby' });
    }
});

// User management
app.post('/api/signup', userController.signup);
app.post('/api/login', userController.login);
app.get('/api/protected', authenticateToken, userController.protected);

// Get all lobbies
app.get('/api/lobbies', authenticateToken, (req, res) => {
    try {
        const lobbies = lobbyController.getLobbies();
        res.status(200).json(lobbies);
    } catch (err) {
        console.error('Error fetching lobbies:', err);
        res.status(500).json({ message: 'Failed to fetch lobbies' });
    }
});

// --- DATABASE MAINTENANCE ROUTES ---
// These should be protected or removed in production
app.get('/api/createusersdb', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .query('CREATE TABLE Users (id INT PRIMARY KEY IDENTITY(1,1), username NVARCHAR(255), password VARCHAR(255), created_at DATETIME DEFAULT GETDATE())');
        res.status(200).json({ message: 'Database created successfully' });
    } catch (err) {
        console.error('Error creating database:', err);
        res.status(500).json({ message: 'Failed to create database' });
    }
});

app.get('/api/deleteusersdb', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .query('DROP TABLE Users');
        res.status(200).json({ message: 'Database deleted successfully' });
    } catch (err) {
        console.error('Error deleting database:', err);
        res.status(500).json({ message: 'Failed to delete database' });
    }
});

app.get('/api/clearusersdb', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .query('DELETE FROM Users');
        res.status(200).json({ message: 'Users cleared successfully' });
    } catch (err) {
        console.error('Error clearing users:', err);
        res.status(500).json({ message: 'Failed to clear users' });
    }
});

app.get('/api/createuserstokensdb', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .query('CREATE TABLE UsersTokens (id INT PRIMARY KEY IDENTITY(1,1), username VARCHAR(255), token VARCHAR(255), deviceinfo NVARCHAR(MAX), created_at DATETIME DEFAULT GETDATE())');
        res.status(200).json({ message: 'Database created successfully' });
    } catch (err) {
        console.error('Error creating database:', err);
        res.status(500).json({ message: 'Failed to create database' });
    }
});

app.get('/api/clearTokens', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .query('DELETE FROM UsersTokens');
        res.status(200).json({ message: 'Tokens cleared successfully' });
    } catch (err) {
        console.error('Error clearing tokens:', err);
        res.status(500).json({ message: 'Failed to clear tokens' });
    }
});

// Start the server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    
    // Create localtunnel for external access
    (async () => {
        try {
            const tunnel = await localtunnel({ port, subdomain: 'mirgos' });
            console.log(`Localtunnel running at: ${tunnel.url}`);
            
            tunnel.on('close', () => {
                console.log('Localtunnel closed');
            });
        } catch (err) {
            console.error('Failed to create localtunnel:', err);
        }
    })();
});
