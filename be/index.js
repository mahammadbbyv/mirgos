const express = require('express');
const sql = require('mssql/msnodesqlv8');
const jwt = require('jsonwebtoken');
const net = require('net');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const port = 3000;
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables.');
    process.exit(1);
}
const jwtSecret = process.env.JWT_SECRET;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://mirgos.loca.lt",
        "http://26.122.92.136:5173",
        "http://25.47.56.187:5173",
        "http://192.168.78.1:5173",
        "http://192.168.61.1:5173",
        "http://172.20.10.2:5173",
        "http://172.19.176.1:5173"
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=MAGA;Database=MirgosDB;Trusted_Connection=Yes;',
    driver: 'msnodesqlv8'
};

sql.connect(dbConfig).then(() => {
    console.log('Connected to MSSQL database');
}).catch(err => {
    console.error('Database connection failed:', err);
});

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
            await pool.request()
                .input('username', sql.VarChar, username)
                .query('DELETE FROM UsersTokens WHERE username = @username');
            const token = jwt.sign({ id: userData.id, username: userData.username }, jwtSecret, { expiresIn: '1h' });
            const deviceInfo = req.headers['user-agent'] || '';
            await pool.request()
                .input('username', sql.VarChar, username)
                .input('token', sql.VarChar, token)
                .input('deviceinfo', sql.NVarChar, deviceInfo)
                .query('INSERT INTO UsersTokens (username, token, deviceinfo) VALUES (@username, @token, @deviceinfo)');
            res.cookie('token', token, { httpOnly: true, secure: false });
            res.cookie('username', username, { httpOnly: true, secure: false });
            res.status(200).json({ message: 'Login successful', token });
        } catch (err) {
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    protected: (req, res) => {
        res.json({ message: 'Protected route accessed', user: req.user });
    }
};

const lobbyController = {
    lobbies: new Map(),
    createLobby: (lobbyId, port) => {
        // Add to socket.io lobbyState as well
        if (!lobbyState.has(lobbyId)) {
            lobbyState.set(lobbyId, { players: new Map(), host: null });
        }
        if (lobbyController.lobbies.has(lobbyId)) {
            throw new Error('Lobby already exists');
        }
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
            console.log(`Lobby ${lobbyId} is listening on port ${port}`);
        });
        lobbyController.lobbies.set(lobbyId, { server, port, players });
        // Ensure lobby is in lobbyState for listing
        if (!lobbyState.has(lobbyId)) {
            lobbyState.set(lobbyId, { players: new Map(), host: null });
        }
    },
    getLobbies: () => {
        // Return lobbies from socket.io lobbyState, not from TCP server
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
            console.log(`Lobby ${lobbyId} on port ${lobby.port} has been closed`);
        });
        lobbyController.lobbies.delete(lobbyId);
    }
};

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
});

// Lobby state in memory
const lobbyState = new Map(); // lobbyId -> { players: Map, host: string, ... }

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_lobby', ({ lobbyId, playerName, country }) => {
        if (!lobbyState.has(lobbyId)) {
            lobbyState.set(lobbyId, { players: new Map(), host: playerName });
        }
        const lobby = lobbyState.get(lobbyId);
        if (!lobby.host) lobby.host = playerName;
        socket.join(lobbyId);
        for (const [id, l] of lobbyState.entries()) {
            if (id !== lobbyId && l.players.has(playerName)) {
                l.players.delete(playerName);
                io.to(id).emit('lobby', {
                    lobbyId: id,
                    players: Array.from(l.players.values()),
                    host: l.host
                });
            }
        }
        lobby.players.set(playerName, { name: playerName, country: country || '' });
        io.to(lobbyId).emit('lobby', {
            lobbyId,
            players: Array.from(lobby.players.values()),
            host: lobby.host
        });
        socket.lobbyId = lobbyId;
        socket.playerName = playerName;
        // Emit game_state to the joining player if the game has started
        if (lobby && lobby.gameState) {
            socket.emit('game_state', lobby.gameState);
        }
    });

    socket.on('update_country', ({ lobbyId, playerName, country }) => {
        if (lobbyState.has(lobbyId) && lobbyState.get(lobbyId).players.has(playerName)) {
            lobbyState.get(lobbyId).players.set(playerName, { name: playerName, country });
            io.to(lobbyId).emit('lobby', {
                lobbyId,
                players: Array.from(lobbyState.get(lobbyId).players.values()),
                host: lobbyState.get(lobbyId).host
            });
        }
    });

    // --- LOBBY CHAT: Broadcast to all in lobby and store in chat history ---
    socket.on('room_message', (msg) => {
        if (socket.lobbyId) {
            // Store in chat history for the lobby
            const lobby = lobbyState.get(socket.lobbyId);
            if (lobby) {
                if (!lobby.chatMessages) lobby.chatMessages = [];
                lobby.chatMessages.push(msg);
            }
            // Send to all players in the lobby
            console.log('Room message:', msg);
            console.log('Lobby ID:', socket.lobbyId);
            io.to(socket.lobbyId).emit('room_message', msg);
        }
    });

    // --- PRIVATE CHAT: Send only to recipient and sender, and store in private chat history ---
    socket.on('private_message', (msg) => {
        if (socket.lobbyId) {
            const lobby = lobbyState.get(socket.lobbyId);
            if (lobby) {
                if (!lobby.privateMessages) lobby.privateMessages = [];
                // Store with a consistent key for both sender and recipient
                lobby.privateMessages.push(msg);
            }
            // Find recipient socket in the same lobby
            const recipientSocket = Array.from(io.sockets.sockets.values()).find(
                (s) => s.playerName === msg.to && s.lobbyId === socket.lobbyId
            );
            if (recipientSocket) {
                recipientSocket.emit('private_message', msg);
            }
            socket.emit('private_message', msg); // Send back to sender
        }
    });

    // --- CHAT HISTORY: Serve correct chat history for room or private chats ---
    socket.on('request_chat_history', ({ lobbyId, chatType, withPlayer }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby) {
            socket.emit('chat_history', { chatType, messages: [] });
            return;
        }
        if (chatType === 'room') {
            socket.emit('chat_history', { chatType: 'room', messages: lobby.chatMessages || [] });
        } else if (chatType === 'private' && withPlayer) {
            // Only messages between socket.playerName and withPlayer
            const allPrivate = lobby.privateMessages || [];
            const filtered = allPrivate.filter(
                m => (m.player === socket.playerName && m.to === withPlayer) ||
                     (m.player === withPlayer && m.to === socket.playerName)
            );
            socket.emit('chat_history', { chatType: 'private', withPlayer, messages: filtered });
        } else {
            socket.emit('chat_history', { chatType, messages: [] });
        }
    });

    // --- GAME START: Save selected countries and initialize game state ---
    socket.on('start_game', ({ lobbyId }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby) return;
        const hostName = lobby.host;
        if (socket.playerName !== hostName) return;
        // Check if all users have chosen a country
        const allPlayers = Array.from(lobby.players.keys());
        const allChosen = allPlayers.every(p => lobby.players.get(p).country);
        if (!allChosen) {
            // Send message to everyone in the lobby
            io.to(lobbyId).emit('room_message', { player: 'System', msg: 'All players must choose a country before starting the game.' });
            return;
        }
        // --- Country name mapping ---
        const countryLangMap = {
            'France':    { en: 'France', ru: 'Франция', uk: 'Франція' },
            'Germany':   { en: 'Germany', ru: 'Германия', uk: 'Німеччина' },
            'Israel':    { en: 'Israel', ru: 'Израиль', uk: 'Ізраїль' },
            'Kazakhstan':{ en: 'Kazakhstan', ru: 'Казахстан', uk: 'Казахстан' },
            'North Korea': { en: 'North Korea', ru: 'Северная Корея', uk: 'Північна Корея' },
            'Russia':    { en: 'Russia', ru: 'Россия', uk: 'Росія' },
            'Ukraine':   { en: 'Ukraine', ru: 'Украина', uk: 'Україна' },
            'USA':       { en: 'USA', ru: 'США', uk: 'США' },
        };
        // Save selected countries for each player (with all language variants)
        const playerCountries = {};
        for (const [name, info] of lobby.players.entries()) {
            const country = info.country;
            playerCountries[name] = countryLangMap[country] || { en: country, ru: country, uk: country };
        }
        // Save all countries in this game (for frontend language toggle)
        const countryNames = {};
        for (const c of Object.values(playerCountries)) {
            countryNames[c.en] = c;
        }
        // Initialize game state (cities, armies, budgets, etc)
        lobby.gameState = {
            round: 1,
            playerCountries, // { playerName: {en,ru,uk} }
            countryNames,    // { enName: {en,ru,uk} }
            actions: {}, // { playerName: [actions] }
            finished: {}, // { playerName: true/false }
            cities: {},
            armies: {},
            budgets: {},
            stability: {},
            // Add more as needed
        };
        // Immediately populate cities, armies, budgets, stability for each country
        for (const c of Object.values(playerCountries)) {
            const country = c.en;
            let cities = [];
            switch (country) {
                case 'France':
                    cities = [
                        { name_en: 'Paris', name_ru: 'Париж', name_uk: 'Париж', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
                        { name_en: 'Lyon', name_ru: 'Лион', name_uk: 'Ліон', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: 'Marseille', name_ru: 'Марсель', name_uk: 'Марсель', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
                        { name_en: 'Nantes', name_ru: 'Нант', name_uk: 'Нант', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
                    ]; break;
                case 'Germany':
                    cities = [
                        { name_en: 'Berlin', name_ru: 'Берлин', name_uk: 'Берлін', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
                        { name_en: 'Leipzig', name_ru: 'Лейпциг', name_uk: 'Лейпциг', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: 'Frankfurt', name_ru: 'Франкфурт', name_uk: 'Франкфурт', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
                        { name_en: 'Rhein', name_ru: 'Рейн', name_uk: 'Рейн', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
                    ]; break;
                case 'Israel':
                    cities = [
                        { name_en: 'Jerusalem', name_ru: 'Иерусалим', name_uk: 'Єрусалим', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
                        { name_en: 'Tel Aviv', name_ru: 'Тель-Авив', name_uk: 'Тель-Авів', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: 'Akko', name_ru: 'Акко', name_uk: 'Ако', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
                        { name_en: 'Ashkelon', name_ru: 'Ашкелон', name_uk: 'Ашкелон', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
                    ]; break;
                case 'Kazakhstan':
                    cities = [
                        { name_en: 'Nur-Sultan', name_ru: 'Нур-Султан', name_uk: 'Нур-Султан', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
                        { name_en: 'Almaty', name_ru: 'Алматы', name_uk: 'Алмати', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: 'Shymkent', name_ru: 'Шымкент', name_uk: 'Шимкент', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
                        { name_en: 'Karaganda', name_ru: 'Караганда', name_uk: 'Караганда', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
                    ]; break;
                case 'North Korea':
                    cities = [
                        { name_en: 'Pyongyang', name_ru: 'Пхеньян', name_uk: 'Пхеньян', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
                        { name_en: 'Kaesong', name_ru: 'Кэсон', name_uk: 'Кесон', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: 'Nampo', name_ru: 'Нампо', name_uk: 'Нампо', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
                        { name_en: 'Wonsan', name_ru: 'Вонсан', name_uk: 'Вонсан', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
                    ]; break;
                case 'Russia':
                    cities = [
                        { name_en: 'Moscow', name_ru: 'Москва', name_uk: 'Москва', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
                        { name_en: 'Saint Petersburg', name_ru: 'Питер', name_uk: 'Пітер', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: 'Crimea', name_ru: 'Крым', name_uk: 'Крим', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
                        { name_en: 'Novosibirsk', name_ru: 'Новосибирск', name_uk: 'Новосибірськ', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
                    ]; break;
                case 'Ukraine':
                    cities = [
                        { name_en: 'Kyiv', name_uk: 'Київ', name_ru: 'Киев', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
                        { name_en: 'Lviv', name_uk: 'Львів', name_ru: 'Львов', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: 'Kharkiv', name_uk: 'Харків', name_ru: 'Харьков', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
                        { name_en: 'Odesa', name_uk: 'Одеса', name_ru: 'Одесса', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
                    ]; break;
                case 'USA':
                    cities = [
                        { name_en: 'Washington DC', name_ru: 'Вашингтон ДС', name_uk: 'Вашингтон ДС', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
                        { name_en: 'New York', name_ru: 'Нью-Йорк', name_uk: 'Нью-Йорк', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: 'San Francisco', name_ru: 'Сан-Франциско', name_uk: 'Сан-Франциско', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
                        { name_en: 'Las Vegas', name_ru: 'Лас-Вегас', name_uk: 'Лас-Вегас', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
                    ]; break;
                default:
                    cities = [
                        { name_en: country + ' City 1', name_ru: country + ' Город 1', name_uk: country + ' Місто 1', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: country + ' City 2', name_ru: country + ' Город 2', name_uk: country + ' Місто 2', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: country + ' City 3', name_ru: country + ' Город 3', name_uk: country + ' Місто 3', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                        { name_en: country + ' City 4', name_ru: country + ' Город 4', name_uk: country + ' Місто 4', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
                    ]; break;
            }
            lobby.gameState.cities[country] = cities;
            lobby.gameState.armies[country] = 0;
            lobby.gameState.budgets[country] = 1000;
            lobby.gameState.stability[country] = 100;
        }        // Broadcast initial game state
        emitGameState(lobbyId);
        // Start countdown as before
        let seconds = 5;
        io.to(lobbyId).emit('start_countdown', seconds);
        const interval = setInterval(() => {
            seconds--;
            if (seconds > 0) {
                io.to(lobbyId).emit('start_countdown', seconds);
            } else {
                clearInterval(interval);
                io.to(lobbyId).emit('move_to_game');
                // After moving to game, set and emit round start time
                const now = new Date().toISOString();
                lobby.roundStartTime = now;
                io.to(lobbyId).emit('round_start', { roundStartTime: now });
                // Emit initial game state again to all (for clients that just loaded the game view)
                emitGameState(lobbyId);
            }
        }, 1000);
    });

    // --- GAME START: Store round start datetime ---
    socket.on('start_game', ({ lobbyId }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby) return;
        // check if all users chose country
        const allPlayers = Object.keys(lobby.players);
        const allChosen = allPlayers.every(p => lobby.players.get(p).country);
        if (!allChosen) {
            socket.emit('lobby_message', { player: 'System', msg: 'All players must choose a country before starting the game.' });
            return;
        }
        // check if users have selected same country
        const selectedCountries = new Set();
        for (const player of allPlayers) {
            const country = lobby.players.get(player).country;
            if (selectedCountries.has(country)) {
                socket.emit('lobby_message', { player: 'System', msg: `Country ${country} is already selected by another player.` });
                return; 
            }
            selectedCountries.add(country);
        }
        // Initialize game state
        // s
        const now = new Date().toISOString();
        lobby.roundStartTime = now;
        io.to(lobbyId).emit('round_start', { roundStartTime: now });
    });

    // --- Allow clients to request round start time ---
    socket.on('request_round_start', ({ lobbyId }) => {
        const lobby = lobbyState.get(lobbyId);
        if (lobby && lobby.roundStartTime) {
            socket.emit('round_start', { roundStartTime: lobby.roundStartTime });
        }
    });

    // --- Handle player actions between countries ---
    socket.on('submit_action', ({ lobbyId, playerName, action }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby || !lobby.gameState) return;
        if (!lobby.gameState.actions[playerName]) lobby.gameState.actions[playerName] = [];
        lobby.gameState.actions[playerName].push(action);
    });

    // --- Player finishes turn ---
    socket.on('finish_turn', ({ lobbyId, playerName }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby || !lobby.gameState) return;
        lobby.gameState.finished[playerName] = true;
        // Check if all finished
        const allPlayers = Object.keys(lobby.gameState.playerCountries);
        const allFinished = allPlayers.every(p => lobby.gameState.finished[p]);
        if (allFinished) {
            processActionsAndUpdateGameState(lobby);
            // --- END GAME RULES ---
            io.to(lobbyId).emit('round_actions', {
                actions: lobby.gameState.actions,
                round: lobby.gameState.round,
                updatedState: lobby.gameState
            });
            // Always emit updated game state after round resolution
            io.to(lobbyId).emit('game_state', lobby.gameState);
            // Prepare for next round
            lobby.gameState.round++;
            lobby.gameState.actions = {};
            lobby.gameState.finished = {};
            // --- Restart round timer ---
            const now = new Date().toISOString();
            lobby.roundStartTime = now;
            io.to(lobbyId).emit('round_start', { roundStartTime: now });
        } else {
            // Notify who is still left
            const waiting = allPlayers.filter(p => !lobby.gameState.finished[p]);
            io.to(lobbyId).emit('waiting_players', waiting);
        }
    });

    // --- Player undoes finish ---
    socket.on('undo_finish', ({ lobbyId, playerName }) => {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby || !lobby.gameState) return;
        lobby.gameState.finished[playerName] = false;
        const allPlayers = Object.keys(lobby.gameState.playerCountries);
        const waiting = allPlayers.filter(p => !lobby.gameState.finished[p]);
        io.to(lobbyId).emit('waiting_players', waiting);
    });

    // --- Respond to game state requests ---
    socket.on('request_game_state', ({ lobbyId, playerName }) => {
        const lobby = lobbyState.get(lobbyId);        if (lobby && lobby.gameState) {
            // Always include players array for frontend chat dropdown
            lobby.gameState.players = Array.from(lobby.players.keys());
            socket.emit('game_state', lobby.gameState);
        } else {
            socket.emit('game_state', null);
        }
    });

    // --- PRIVATE MESSAGE: Only deliver to intended recipient and sender ---
    socket.on('private_message', (msg) => {
        if (socket.lobbyId) {
            console.log('Sending private message:', msg); // Debugging log
            const recipientSocket = Array.from(io.sockets.sockets.values()).find(
                (s) => s.playerName === msg.to && s.lobbyId === socket.lobbyId
            );
            if (recipientSocket) {
                recipientSocket.emit('private_message', msg);
            }
            socket.emit('private_message', msg); // Send back to sender
        }
    });

    // --- PING/PONG HANDLING FOR LOBBY ---
    // Store ping times in lobbyState: lobbyId -> { pings: Map(playerName -> ms) }
    function broadcastLobbyPings(lobbyId) {
        const lobby = lobbyState.get(lobbyId);
        if (!lobby) return;
        if (!lobby.pings) return;
        // { playerName: pingMs, ... }
        const pings = {};
        for (const [player, ms] of lobby.pings.entries()) {
            pings[player] = ms;
        }
        io.to(lobbyId).emit('lobby_pings', pings);
    }

    // --- Handle ping from client ---
    socket.on('ping', ({ lobbyId, playerName, ts }) => {
        // Reply immediately with pong (echo timestamp)
        socket.emit('pong', { ts });
        // Store ping in lobby state (will be updated by client after round-trip)
        if (lobbyId && playerName) {
            const lobby = lobbyState.get(lobbyId);
            if (lobby) {
                if (!lobby.pings) lobby.pings = new Map();
                // The client will send measured ping in 'report_ping' event
            }
        }
    });
    // --- Client reports measured ping ---
    socket.on('report_ping', ({ lobbyId, playerName, ping }) => {
        if (lobbyId && playerName && typeof ping === 'number') {
            const lobby = lobbyState.get(lobbyId);
            if (lobby) {
                if (!lobby.pings) lobby.pings = new Map();
                lobby.pings.set(playerName, ping);
                broadcastLobbyPings(lobbyId);
            }
        }
    });

    socket.on('disconnect', () => {
        if (socket.lobbyId && socket.playerName) {
            const lobby = lobbyState.get(socket.lobbyId);
            if (lobby) {
                lobby.players.delete(socket.playerName);
                if (lobby.pings) lobby.pings.delete(socket.playerName);
                io.to(socket.lobbyId).emit('lobby', {
                    lobbyId: socket.lobbyId,
                    players: Array.from(lobby.players.values()),
                    host: lobby.host
                });
                broadcastLobbyPings(socket.lobbyId);
            }
        }
        console.log('Socket disconnected:', socket.id);
    });
});

app.post('/api/lobby', authenticateToken, (req, res) => {
    const username = req.user.username;
    try {
        let port = 4000;
        while ([...lobbyController.lobbies.values()].some(lobby => lobby.port === port)) {
            port++;
        }
        // Use a random or unique lobby name if not provided, or allow user to specify
        const lobbyname = req.body.lobbyname || `${username}'s Lobby`;
        lobbyController.createLobby(lobbyname, port);
        res.status(201).json({ message: `Lobby ${lobbyname} created`, port });
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

app.post('/api/signup', userController.signup);
app.post('/api/login', userController.login);
app.get('/api/protected', authenticateToken, userController.protected);
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
// Always return all lobbies, not just those for the current user
app.get('/api/lobbies', authenticateToken, (req, res) => {
    try {
        const lobbies = lobbyController.getLobbies();
        res.status(200).json(lobbies);
    } catch (err) {
        console.error('Error fetching lobbies:', err);
        res.status(500).json({ message: 'Failed to fetch lobbies' });
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

// --- GAME LOGIC: Process all actions and update game state ---
function processActionsAndUpdateGameState(lobby) {
    const actionsByPlayer = lobby.gameState.actions;
    const allPlayers = Object.keys(lobby.gameState.playerCountries);
    // 1. Collect income for all
    for (const country of Object.keys(lobby.gameState.cities)) {
        const income = lobby.gameState.cities[country].reduce((sum, c) => sum + c.income, 0);
        lobby.gameState.budgets[country] += income;
    }
    // 2. Process all actions
    for (const player of allPlayers) {
        const countryObj = lobby.gameState.playerCountries[player];
        const country = countryObj.en;
        const actions = actionsByPlayer[player] || [];
        for (const action of actions) {
            if (action.type === 'buyArmy') {
                const cost = 300 * (action.count || 1);
                if (lobby.gameState.budgets[country] >= cost) {
                    lobby.gameState.budgets[country] -= cost;
                    lobby.gameState.armies[country] += (action.count || 1);
                }
            }
            if (action.type === 'upgradeCity') {
                const city = lobby.gameState.cities[country].find(c => c.name_en === action.city || c.name === action.city);
                if (city && lobby.gameState.budgets[country] >= 500) {
                    city.level += 1;
                    city.income += 50;
                    city.shield = Math.min(3, (city.shield || 0) + 1);
                    lobby.gameState.budgets[country] -= 500;
                }
            }
            if (action.type === 'attack') {
                const targetCountry = action.targetCountry;
                const targetCityName = action.targetCity;
                const attackForce = action.army;
                if (lobby.gameState.armies[country] >= attackForce && targetCountry && targetCityName) {
                    const targetCity = lobby.gameState.cities[targetCountry].find(c => c.name_en === targetCityName || c.name === targetCityName);
                    if (targetCity) {
                        if (attackForce > (targetCity.defense || 0) + (targetCity.shield || 0)) {
                            targetCity.defense = 0;
                            targetCity.stability = Math.max(0, (targetCity.stability || 100) - 30);
                            // Optionally: transfer city, reduce income, etc
                        } else {
                            targetCity.defense = Math.max(0, (targetCity.defense || 0) - attackForce);
                        }
                        lobby.gameState.armies[country] -= attackForce;
                    }
                }
            }
            if (action.type === 'developNuclear') {
                if (!lobby.gameState.nuclear) lobby.gameState.nuclear = {};
                if (!lobby.gameState.nuclear[country]) lobby.gameState.nuclear[country] = 0;
                if (lobby.gameState.budgets[country] >= 450 && lobby.gameState.nuclear[country] < 3) {
                    lobby.gameState.budgets[country] -= 450;
                    // 50% chance to create bomb
                    if (Math.random() < 0.5) {
                        lobby.gameState.nuclear[country] += 1;
                    }
                }
            }
            if (action.type === 'setSanction') {
                if (!lobby.gameState.sanctions) lobby.gameState.sanctions = {};
                // Sanction for 2 rounds by default
                lobby.gameState.sanctions[action.targetCountry] = 2;
            }
        }
    }
    // 3. Apply sanctions (remove income for sanctioned countries)
    if (lobby.gameState.sanctions) {
        for (const [country, rounds] of Object.entries(lobby.gameState.sanctions)) {
            if (rounds > 0) {
                const income = lobby.gameState.cities[country].reduce((sum, c) => sum + c.income, 0);
                lobby.gameState.budgets[country] -= income;
                lobby.gameState.sanctions[country]--;
                if (lobby.gameState.sanctions[country] <= 0) delete lobby.gameState.sanctions[country];
            }
        }
    }
    // 4. TODO: Add alliance, trade, repair, nuclear strike, etc.
}

// Before emitting game_state, always add a 'players' array
function emitGameState(lobbyId) {
    const lobby = lobbyState.get(lobbyId);
    if (!lobby || !lobby.gameState) return;
    // Add players array (all player names)
    lobby.gameState.players = Array.from(lobby.players.keys());
    // Ensure chatMessages and privateMessages are always present
    if (!lobby.gameState.chatMessages) lobby.gameState.chatMessages = [];
    if (!lobby.gameState.privateMessages) lobby.gameState.privateMessages = [];
    io.to(lobbyId).emit('game_state', lobby.gameState);
}

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    const localtunnel = require('localtunnel');
    (async () => {
        const tunnel = await localtunnel({ port, subdomain: 'mirgos' });
        console.log(`Localtunnel running at: ${tunnel.url}`);
    })();
});