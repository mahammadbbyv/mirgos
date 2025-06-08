import { io } from "socket.io-client";

const SERVER = import.meta.env.VITE_SERVER || 'https://mirgos.loca.lt';

export let socket = null;

// Always connect to the main server for sockets
export const connectToServer = () => {
    socket = io(SERVER, { autoConnect: false });
    window.socket = socket;
    socket.connect();
    socket.on("connect", () => {
        console.log("Connected to server");
    });
    socket.on("disconnect", () => {
        console.log("Disconnected from server");
    });
    socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
    });
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
        });

        if (!response.ok) {
            console.error('Error fetching lobby list:', response.statusText);
            // get response status code
            return callback(response.status);
        }

        const data = await response.json();
        callback(data);
    } catch (error) {
        console.error('Error fetching lobby list:', error);
        callback([error]);
    }
};

// Create a new lobby
export const createLobby = async (lobbyName, callback, navigate) => {
    try {
        console.log('Creating lobby:', lobbyName);

        const token = localStorage.getItem('token');
        const response = await fetch(`${SERVER}/api/lobby`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ lobbyname: lobbyName }),
        });

        const data = await response.json();

        if (data.message) {
            console.log('Lobby created:', data);

            if (navigate) navigate(`/lobby/${lobbyName}/waiting-room`);

            if (callback) {
                callback({ success: true, data });
            }
        } else {
            console.error('Error creating lobby:', data);
            if (callback) {
                callback({ success: false, error: data });
            }
        }
    } catch (error) {
        console.error('Error creating lobby:', error);
        if (callback) {
            callback({ success: false, error });
        }
    }
};

// Join a lobby (room) on the main server
export const joinLobby = (lobbyId, playerName, onLobbyUpdate, onPlayerJoined, onMessage) => {
    if (!socket) connectToServer();
    const country = localStorage.getItem('country') || '';
    socket.emit('join_lobby', { lobbyId, playerName, country });
    socket.on('lobby', (lobbyData) => {
        if (onLobbyUpdate) onLobbyUpdate(lobbyData);
    });
    socket.on('player_joined', (player) => {
        if (onPlayerJoined) onPlayerJoined(player);
    });
    socket.on('room_message', (msg) => {
        if (onMessage) onMessage(msg);
    });
};

// Send a message to the lobby
export const sendMessageToLobby = (msg) => {
    if (socket) {
        socket.emit('room_message', msg);
    }
};

// Fetch lobby information
export const fetchLobbyInfo = async (lobbyId, callback) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${SERVER}/api/lobby/${lobbyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
        });

        if (!response.ok) {
            console.error('Error fetching lobby info:', response.statusText);
            return callback(null);
        }

        const data = await response.json();
        callback(data);
    } catch (error) {
        console.error('Error fetching lobby info:', error);
        callback(null);
    }
};

// Disconnect from a lobby
export const disconnectFromLobby = async (lobbyId, callback) => {
    try {
        const response = await fetch(`${SERVER}/api/lobby/${lobbyId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lobbyId }),
        });

        const data = await response.json();
        callback(data);
    } catch (error) {
        console.error('Error disconnecting from lobby:', error);
        callback({ success: false, error });
    }
};

// Disconnect from the main server
export const disconnectFromServer = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        window.socket = null;
        console.log("Disconnected from server");
    }
};