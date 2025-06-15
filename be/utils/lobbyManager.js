/**
 * Lobby Manager Module
 * Handles lobby state management for the Mirgos application
 */

// Generate a unique lobby ID
const generateLobbyId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Initialize a new lobby
const initializeLobby = (lobbyId, hostName) => {
  return {
    id: lobbyId,
    players: new Map(),
    host: hostName,
    chatMessages: [],
    privateMessages: [],
    pings: new Map(),
    created: Date.now()
  };
};

// Add a player to a lobby
const addPlayer = (lobby, playerName, country) => {
  if (!lobby) return false;
  
  lobby.players.set(playerName, { 
    name: playerName, 
    country: country || '',
    joinedAt: Date.now()
  });
  
  return true;
};

// Remove a player from a lobby
const removePlayer = (lobby, playerName) => {
  if (!lobby) return false;
  
  if (lobby.players.has(playerName)) {
    lobby.players.delete(playerName);
    
    // If the host left, assign a new host if there are players left
    if (lobby.host === playerName && lobby.players.size > 0) {
      lobby.host = Array.from(lobby.players.keys())[0];
    }
    
    return true;
  }
  
  return false;
};

// Check if all players have selected a country
const allPlayersSelectedCountry = (lobby) => {
  if (!lobby) return false;
  
  const players = Array.from(lobby.players.values());
  return players.length > 0 && players.every(p => p.country && p.country.trim() !== '');
};

// Check if there are duplicate country selections
const hasDuplicateCountries = (lobby) => {
  if (!lobby) return false;
  
  const countries = new Set();
  for (const player of lobby.players.values()) {
    if (player.country && player.country.trim() !== '') {
      if (countries.has(player.country)) {
        return true;
      }
      countries.add(player.country);
    }
  }
  
  return false;
};

// Get formatted lobby data for client
const getLobbyData = (lobby) => {
  if (!lobby) return null;
  
  return {
    lobbyId: lobby.id,
    players: Array.from(lobby.players.values()),
    host: lobby.host,
    gameInProgress: !!lobby.gameState
  };
};

// Update player's country
const updatePlayerCountry = (lobby, playerName, country) => {
  if (!lobby || !lobby.players.has(playerName)) {
    console.error(`Cannot update country: Player ${playerName} not found in lobby ${lobby?.id || 'unknown'}`);
    return false;
  }
  
  const playerInfo = lobby.players.get(playerName);
  console.log(`Updating player ${playerName} country from "${playerInfo.country || 'none'}" to "${country}"`);
  
  playerInfo.country = country;
  lobby.players.set(playerName, playerInfo);
  
  console.log(`Updated players in lobby ${lobby.id}:`, Array.from(lobby.players.values()));
  return true;
};

// Update player's ping
const updatePlayerPing = (lobby, playerName, ping) => {
  if (!lobby) return false;
  
  if (!lobby.pings) lobby.pings = new Map();
  lobby.pings.set(playerName, ping);
  
  return true;
};

// Get all player pings as an object
const getPlayerPings = (lobby) => {
  if (!lobby || !lobby.pings) return {};
  
  const pings = {};
  for (const [player, ms] of lobby.pings.entries()) {
    pings[player] = ms;
  }
  
  return pings;
};

module.exports = {
  generateLobbyId,
  initializeLobby,
  addPlayer,
  removePlayer,
  allPlayersSelectedCountry,
  hasDuplicateCountries,
  getLobbyData,
  updatePlayerCountry,
  updatePlayerPing,
  getPlayerPings,
  generateLobbyId
};
