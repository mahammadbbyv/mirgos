import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { socket, connectToServer } from '../utils/lobby';

// Create the context
export const GameContext = createContext(null);

// Custom hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Provider component
export function GameProvider({ children }) {
  // Game state
  const [gameState, setGameState] = useState(null);
  const [actions, setActions] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [timer, setTimer] = useState(300);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [finished, setFinished] = useState(false);
  const [allFinished, setAllFinished] = useState(false);
  const [waitingPlayers, setWaitingPlayers] = useState([]);
  const [error, setError] = useState("");
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  // UI state
  const [attackTarget, setAttackTarget] = useState({ country: '', city: '', army: 0 });
  const [upgradeCity, setUpgradeCity] = useState('');
  const [sanctionTarget, setSanctionTarget] = useState('');
  const [armyCount, setArmyCount] = useState(1);
  const [openSection, setOpenSection] = useState(null);
  
  // New action state for enhanced game mechanics
  const [techSelection, setTechSelection] = useState({ techName: '', level: 0 });
  const [diplomacySelection, setDiplomacySelection] = useState({ targetCountry: '', relationLevel: 'neutral' });
  const [infrastructureSelection, setInfrastructureSelection] = useState({ cityName: '', investmentAmount: 0 });
  const [lastActionFeedback, setLastActionFeedback] = useState(null);
  const [actionsHistory, setActionsHistory] = useState([]);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedChat, setSelectedChat] = useState('all');
  // Player info
  const playerName = localStorage.getItem('playerName');
  const lobbyId = localStorage.getItem('currentLobby');
  
  // --- MEMOIZED VALUES --- (moved to the top to avoid reference errors)
  const myCountryObj = gameState?.playerCountries?.[playerName] || null;
  const myCountry = myCountryObj?.[lang] || '';
  const allCountryEnNames = gameState?.cities ? Object.keys(gameState.cities) : [];
  const myBudget = gameState?.budgets?.[myCountryObj?.en];
  const myArmy = gameState?.armies?.[myCountryObj?.en];
  
  // Get cities with display name based on selected language
  const myCities = gameState && gameState.cities && myCountryObj && myCountryObj.en
    ? (() => {
        const countryKey = Object.keys(gameState.cities).find(
          key => key.toLowerCase() === myCountryObj.en.toLowerCase()
        );
        if (countryKey) {
          return gameState.cities[countryKey].map(city => ({
            ...city,
            displayName: city[`name_${lang}`] || city.name_en || city.name_ru || city.name_uk || ''
          }));
        }
        return [];
      })()
    : [];
  // Connect to socket if not already
  useEffect(() => {
    if (!socket) connectToServer();
    if (!lobbyId || !playerName) {
      console.error("Missing game information - LobbyId:", lobbyId, "PlayerName:", playerName);
      setError("Missing lobby or player information. Please rejoin the lobby.");
    } else {
      console.log("Game context initialized with - LobbyId:", lobbyId, "PlayerName:", playerName);
    }
  }, [lobbyId, playerName]);
  // Join lobby and request game state
  useEffect(() => {
    if (!socket || !socket.connected) {
      console.log("Socket not connected, connecting now...");
      connectToServer();
    }
    
    if (lobbyId && playerName && socket) {
      console.log("Joining lobby and requesting game state...");
      
      // Join the lobby with country information
      const country = localStorage.getItem('country') || '';
      socket.emit('join_lobby', { lobbyId, playerName, country });
      
      // Handle game state updates
      const handleGameState = (state) => {
        console.log("Received game state:", state ? "Valid state" : "Null/undefined state");
        setGameState(state);
        setLoadingChats(false);
      };
      
      // Listen for game state events
      socket.on('game_state', handleGameState);
      
      // Request initial game state
      console.log("Requesting game state for lobby:", lobbyId);
      socket.emit('request_game_state', { lobbyId });
      
      return () => {
        socket.off('game_state', handleGameState);
      };
    }
  }, [lobbyId, playerName]);

  // Listen for game state, round actions, and round start from server
  useEffect(() => {
    if (!socket) return;
      const handleGameState = (state) => {
      if (!state) {
        console.error("Received empty game state");
        setGameState(null);
        setError("Game state is missing or not initialized. Please wait for the host to start the game, or rejoin the lobby.");
        
        // Try to request game state again after delay if no state is received
        setTimeout(() => {
          if (socket && lobbyId) {
            console.log("Re-requesting game state after receiving empty state");
            socket.emit('request_game_state', { lobbyId });
          }
        }, 3000);
        return;
      }
      
      console.log("Game state successfully loaded, current round:", state.round);
      setGameState(state);
      setCurrentRound(state.round);
      setFinished(false);
      setAllFinished(false);
      setWaitingPlayers([]);
      setActions([]);
      if (state.roundStartTime) setRoundStartTime(state.roundStartTime);
      setError("");
    };
    
    const handleRoundActions = ({ actions: allActions, round, updatedState }) => {
      setShowSummary(true);
      setActions(allActions);
      setGameState(updatedState);
      setCurrentRound(round);
      setFinished(false);
      setAllFinished(false);
      setWaitingPlayers([]);
      setError("");
    };
    
    const handleWaitingPlayers = (waiting) => {
      setWaitingPlayers(waiting);
      setAllFinished(waiting.length === 0);
    };
    
    const handleRoundStart = ({ roundStartTime: serverTime }) => {
      setRoundStartTime(serverTime);
    };
    
    socket.on('game_state', handleGameState);
    socket.on('round_actions', handleRoundActions);
    socket.on('waiting_players', handleWaitingPlayers);
    socket.on('round_start', handleRoundStart);
    
    return () => {
      socket.off('game_state', handleGameState);
      socket.off('round_actions', handleRoundActions);
      socket.off('waiting_players', handleWaitingPlayers);
      socket.off('round_start', handleRoundStart);
    };
  }, []);

  // Request round start time if not present (on mount or new round)
  useEffect(() => {
    if (socket && lobbyId && !roundStartTime) {
      socket.emit('request_round_start', { lobbyId });
    }
  }, [lobbyId, roundStartTime]);

  // Timer effect: always sync with server roundStartTime
  useEffect(() => {
    if (showSummary || finished) return;
    if (!roundStartTime) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const start = new Date(roundStartTime).getTime();
      if (now < start) {
        setTimer(300);
        return;
      }
      let elapsed = Math.floor((now - start) / 1000);
      let remaining = Math.max(0, 300 - elapsed);
      setTimer(remaining);
      if (remaining === 0 && !finished) {
        setFinished(true);
        socket.emit('finish_turn', { lobbyId, playerName });
      }
    };
    
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [roundStartTime, showSummary, finished, lobbyId, playerName]);

  // --- ACTIONS ---
  const handleBuyArmy = useCallback(() => {
    if (!myBudget || myBudget < 300 * armyCount) return;
    const action = { type: 'buyArmy', count: armyCount };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [myBudget, armyCount, lobbyId, playerName]);

  const handleUpgradeCity = useCallback(() => {
    if (!upgradeCity) return;
    const action = { type: 'upgradeCity', city: upgradeCity };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [upgradeCity, lobbyId, playerName]);

  const handleAttack = useCallback(() => {
    if (!attackTarget.country || !attackTarget.city || !attackTarget.army) return;
    const action = { type: 'attack', targetCountry: attackTarget.country, targetCity: attackTarget.city, army: attackTarget.army };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [attackTarget, lobbyId, playerName]);

  const handleDevelopNuclear = useCallback(() => {
    const action = { type: 'developNuclear' };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [lobbyId, playerName]);

  const handleSetSanction = useCallback(() => {
    if (!sanctionTarget) return;
    const action = { type: 'setSanction', targetCountry: sanctionTarget };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [sanctionTarget, lobbyId, playerName]);

  const handleFinishTurn = useCallback(() => {
    setFinished(true);
    socket.emit('finish_turn', { lobbyId, playerName });
  }, [lobbyId, playerName]);

  const handleUndoFinish = useCallback(() => {
    setFinished(false);
    socket.emit('undo_finish', { lobbyId, playerName });
  }, [lobbyId, playerName]);

  const handleNextRound = useCallback(() => {
    setShowSummary(false);
    setActions([]);
    setFinished(false);
    setAllFinished(false);
    setWaitingPlayers([]);
    setRoundStartTime(null);
  }, []);

  // --- CHAT ---
  useEffect(() => {
    if (!socket) return;
    setChatMessages([]); // Clear messages when chat changes
    setLoadingChats(true);
    
    // Request chat history for the selected chat
    if (selectedChat === 'all') {
      socket.emit('request_chat_history', { lobbyId, chatType: 'room' });
    } else {
      socket.emit('request_chat_history', { lobbyId, chatType: 'private', withPlayer: selectedChat });
    }
    
    // Helper to check if a message is already in chatMessages
    const isDuplicate = (msg, arr) => arr.some(m => m.player === msg.player && m.to === msg.to && m.text === msg.text && m.time === msg.time);
    
    const handleMsg = (msg) => {
      if (msg.lobbyId !== lobbyId) return;
      // Only add if not already present
      setChatMessages((prev) => {
        if (isDuplicate(msg, prev)) return prev;
        if (msg.to === 'all' && selectedChat === 'all') {
          return [...prev, msg];
        } else if (
          msg.to !== 'all' &&
          ((msg.player === playerName && msg.to === selectedChat) ||
           (msg.player === selectedChat && msg.to === playerName))
        ) {
          return [...prev, msg];
        }
        return prev;
      });
      setLoadingChats(false);
    };
    
    socket.on('room_message', handleMsg);
    socket.on('private_message', handleMsg);
    socket.on('chat_history', (history) => {
      setChatMessages(history.messages);
      setLoadingChats(false);
    });
    
    return () => {
      socket.off('room_message', handleMsg);
      socket.off('private_message', handleMsg);
      socket.off('chat_history');
    };
  }, [lobbyId, playerName, selectedChat]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg = {
      player: playerName,
      text: chatInput.trim(),
      to: selectedChat,
      lobbyId,
      time: Date.now()
    };
    if (socket) {
      if (selectedChat === 'all') {
        socket.emit('room_message', msg);
      } else {
        socket.emit('private_message', msg);
      }
    }
    setChatInput('');
  };

  const handleRefreshChats = () => {
    if (socket) {
      socket.emit('request_game_state', { lobbyId });
    }
    setLoadingChats(true);
  };
  const handleLangChange = useCallback((e) => {
    setLang(e.target.value);
    localStorage.setItem('lang', e.target.value);
  }, []);
  // --- CHAT GROUPS ---
  const allUsers = gameState?.players?.sort() || [];
  const chatGroups = (() => {
    const groups = { all: [] };
    allUsers.forEach(u => { if (u !== playerName) groups[u] = []; });
    chatMessages.forEach(msg => {
      if (msg.to === 'all') {
        groups.all.push(msg);
      } else {
        // Include private messages for both sender and recipient
        if (groups[msg.player] && msg.to === playerName) groups[msg.player].push(msg);
        if (groups[msg.to] && msg.player === playerName) groups[msg.to].push(msg);
      }
    });
    return groups;
  })();

  // --- ENHANCED GAME ACTIONS ---
  
  // Research technology action
  const handleResearchTechnology = useCallback((techName, techCost) => {
    if (!myBudget || myBudget < techCost) {
      setLastActionFeedback({
        type: 'error',
        message: `Not enough budget to research ${techName}`,
        timestamp: Date.now()
      });
      return;
    }
    
    // Get current tech level from gameState or default to 0
    const currentTechLevel = gameState?.technologies?.[myCountryObj?.en]?.[techName] || 0;
    
    const action = { 
      type: 'researchTechnology',
      techName,
      level: currentTechLevel + 1,
      cost: techCost
    };
    
    socket.emit('submit_action', { lobbyId, playerName, action });
    
    // Add to local actions for immediate feedback
    setActions((prev) => [...prev, action]);
    
    // Add to action history with metadata
    setActionsHistory((prev) => [...prev, {
      ...action,
      timestamp: Date.now(),
      result: 'pending'
    }]);
    
    // Provide user feedback
    setLastActionFeedback({
      type: 'success',
      message: `Researching ${techName} to level ${currentTechLevel + 1}`,
      timestamp: Date.now()
    });
  }, [myBudget, gameState, myCountryObj, lobbyId, playerName]);

  // Establish diplomatic relations action
  const handleEstablishDiplomacy = useCallback((targetCountry, relationLevel) => {
    if (!targetCountry || !relationLevel) {
      setLastActionFeedback({
        type: 'error',
        message: 'Please select a country and relation type',
        timestamp: Date.now()
      });
      return;
    }
    
    const action = { 
      type: 'establishDiplomacy', 
      targetCountry, 
      relationLevel 
    };
    
    socket.emit('submit_action', { lobbyId, playerName, action });
    
    // Add to local actions for immediate feedback
    setActions((prev) => [...prev, action]);
    
    // Add to action history with metadata
    setActionsHistory((prev) => [...prev, {
      ...action,
      timestamp: Date.now(),
      result: 'pending'
    }]);
    
    // Provide user feedback
    setLastActionFeedback({
      type: 'success',
      message: `Establishing ${relationLevel} diplomatic relations with ${targetCountry}`,
      timestamp: Date.now()
    });
  }, [lobbyId, playerName]);

  // Invest in infrastructure action
  const handleInvestInInfrastructure = useCallback((cityName, investmentAmount) => {
    if (!cityName || investmentAmount <= 0) {
      setLastActionFeedback({
        type: 'error',
        message: 'Please select a city and investment amount',
        timestamp: Date.now()
      });
      return;
    }
    
    if (!myBudget || myBudget < investmentAmount) {
      setLastActionFeedback({
        type: 'error',
        message: `Not enough budget for a ${investmentAmount} investment`,
        timestamp: Date.now()
      });
      return;
    }
    
    const action = { 
      type: 'investInInfrastructure', 
      cityName, 
      amount: investmentAmount 
    };
    
    socket.emit('submit_action', { lobbyId, playerName, action });
    
    // Add to local actions for immediate feedback
    setActions((prev) => [...prev, action]);
    
    // Add to action history with metadata
    setActionsHistory((prev) => [...prev, {
      ...action,
      timestamp: Date.now(),
      result: 'pending'
    }]);
    
    // Provide user feedback
    setLastActionFeedback({
      type: 'success',
      message: `Investing ${investmentAmount} in ${cityName} infrastructure`,
      timestamp: Date.now()
    });
  }, [myBudget, lobbyId, playerName]);
  
  // Clear action feedback after it's displayed
  useEffect(() => {
    if (lastActionFeedback) {
      const timer = setTimeout(() => {
        setLastActionFeedback(null);
      }, 5000); // Clear after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [lastActionFeedback]);

  return (
    <GameContext.Provider value={{
      // Game state
      gameState,
      actions,
      currentRound,
      timer,
      showSummary,
      finished,
      allFinished,
      waitingPlayers,
      error,
      lang,
      
      // Player data
      playerName,
      lobbyId,
      myCountryObj,
      myCountry,
      allCountryEnNames,
      myBudget,
      myArmy,
      myCities,
      
      // UI state
      attackTarget,
      setAttackTarget,
      upgradeCity,
      setUpgradeCity,
      sanctionTarget, 
      setSanctionTarget,
      armyCount,
      setArmyCount,
      openSection,
      setOpenSection,
      
      // Enhanced game mechanics state
      techSelection,
      setTechSelection,
      diplomacySelection,
      setDiplomacySelection,
      infrastructureSelection,
      setInfrastructureSelection,
      lastActionFeedback,
      actionsHistory,
      
      // Chat state
      chatMessages,
      chatInput,
      setChatInput,
      loadingChats,
      selectedChat,
      setSelectedChat,
      allUsers,
      chatGroups,
      
      // Actions
      handleBuyArmy,
      handleUpgradeCity,
      handleAttack,
      handleDevelopNuclear,
      handleSetSanction,
      handleFinishTurn,
      handleUndoFinish,
      handleNextRound,
      handleSendChat,
      handleRefreshChats,
      handleLangChange,
      
      // Enhanced game actions
      handleResearchTechnology,
      handleEstablishDiplomacy,
      handleInvestInInfrastructure
    }}>
      {children}
    </GameContext.Provider>
  );
}

// This context export is no longer needed as we export GameContext at the top
// export default GameContext;
