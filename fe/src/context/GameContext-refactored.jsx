import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { 
  formatChatMessage, 
  shouldDisplayMessage, 
  groupChatMessages,
  isDuplicateMessage,
  createChatMessage,
  updateMessageStatus,
  markAllMessagesAsRead,
  getMessageStatusIcon,
  searchMessages,
  getUsersWithUnreadMessages,
  formatTypingStatus
} from '../utils/chatHelper';

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
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingStatus, setTypingStatus] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Player info
  const playerName = localStorage.getItem('playerName');
  const lobbyId = localStorage.getItem('currentLobby');
  
  // Derived state
  const myCountryObj = gameState?.playerCountries?.[playerName];
  const myCountry = myCountryObj?.en;
  const myCities = myCountry ? gameState?.cities?.[myCountry] || [] : [];
  const myBudget = myCountry ? gameState?.budgets?.[myCountry] : 0;
  const myArmy = myCountry ? gameState?.armies?.[myCountry] : 0;
  const allPlayers = gameState?.players || [];
  const allUsers = [...allPlayers];
  const allCountryEnNames = Object.keys(gameState?.countryNames || {});
  const chatGroups = groupChatMessages(chatMessages, playerName);
  const usersWithUnread = getUsersWithUnreadMessages(unreadCounts);
  
  // Format typing status message
  const typingMessage = formatTypingStatus(typingStatus, selectedChat, playerName, lang);
  
  // Socket event handlers
  const handleGameState = useCallback((state) => {
    if (!state) {
      console.error("Game state is missing or not initialized - requesting again");
      setError("Game state is missing or not initialized");
      
      // Attempt to request the game state again
      if (socket && lobbyId) {
        console.log("Requesting game state again for lobby:", lobbyId);
        socket.emit('request_game_state', { lobbyId });
      }
      return;
    }
    
    // Log detailed game state info for debugging
    console.log("Game state received:", state);
    console.log("Player country:", state.playerCountries?.[playerName]);
    console.log("Round:", state.round);
    
    // Clear any previous error state
    setError("");
    
    // Update all game state components
    setGameState(state);
    setCurrentRound(state.round || 1);    // If no player country is set but we're connected to a game, request it explicitly
    if (!state.playerCountries?.[playerName] && socket && lobbyId) {
      console.warn("Warning: No country assigned to player", playerName);
      socket.emit('request_player_country', { lobbyId, playerName });
    }
  }, [socket, lobbyId, playerName]);
  
  const handleRoundStart = useCallback(({ roundStartTime }) => {
    setRoundStartTime(new Date(roundStartTime));
    setShowSummary(false);
    setFinished(false);
  }, []);
  
  const handleWaitingPlayers = useCallback((players) => {
    setWaitingPlayers(players);
  }, []);
  
  const handleAllFinished = useCallback((status) => {
    setAllFinished(status);
    setShowSummary(status);
  }, []);
  
  // Setup socket event listeners
  
  // Handle room chat messages
  const handleRoomMessage = useCallback((message) => {
    console.log('Room message received:', message);
    setChatMessages(prev => {
      // Avoid duplicate messages
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);
  
  // Handle private chat messages
  const handlePrivateMessage = useCallback((message) => {
    console.log('Private message received:', message);
    setChatMessages(prev => {
      // Avoid duplicate messages
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
    
    // Update unread counts for UI
    if (message.player !== playerName && selectedChat !== message.player) {
      setUnreadCounts(prev => ({
        ...prev,
        [message.player]: (prev[message.player] || 0) + 1
      }));
    }
  }, [playerName, selectedChat]);
  
  // Handle chat history response
  const handleChatHistory = useCallback(({ messages, chatType, withPlayer }) => {
    console.log('Chat history received:', { messages, chatType, withPlayer });
    setChatMessages(messages);
    setLoadingChats(false);
  }, []);
  
  // Handle unread counts update
  const handleUnreadCounts = useCallback((counts) => {
    console.log('Unread counts received:', counts);
    setUnreadCounts(counts);
  }, []);
  
  // Handle typing status updates
  const handleTypingStatus = useCallback((status) => {
    console.log('Typing status update:', status);
    setTypingStatus(status);
  }, []);

  useEffect(() => {
    // Request current round time on mount
    if (socket && lobbyId) {
      socket.emit('request_round_start', { lobbyId });
      
      console.log("Setting up socket listeners with lobbyId:", lobbyId);
      
      // Game state events
      socket.on('game_state', handleGameState);
      socket.on('round_start', handleRoundStart);
      socket.on('waiting_players', handleWaitingPlayers);
      socket.on('all_finished', handleAllFinished);
      
      // Chat events
      socket.on('room_message', handleRoomMessage);
      socket.on('private_message', handlePrivateMessage);
      socket.on('chat_history', handleChatHistory);
      socket.on('unread_counts', handleUnreadCounts);
      socket.on('typing_status_update', handleTypingStatus);
      
      // Request initial chat history and unread counts
      socket.emit('request_chat_history', { lobbyId, chatType: 'room' });
      socket.emit('get_unread_counts', { lobbyId });
      
      return () => {
        // Game state events
        socket.off('game_state', handleGameState);
        socket.off('round_start', handleRoundStart);
        socket.off('waiting_players', handleWaitingPlayers);
        socket.off('all_finished', handleAllFinished);
        
        // Chat events
        socket.off('room_message', handleRoomMessage);
        socket.off('private_message', handlePrivateMessage);
        socket.off('chat_history', handleChatHistory);
        socket.off('unread_counts', handleUnreadCounts);
        socket.off('typing_status_update', handleTypingStatus);
      };
    }
  }, [lobbyId, handleGameState, handleRoundStart, handleWaitingPlayers, handleAllFinished,
      handleRoomMessage, handlePrivateMessage, handleChatHistory, handleUnreadCounts, handleTypingStatus]);
  
  // Timer countdown
  useEffect(() => {
    if (!roundStartTime || showSummary || finished) return;
    
    const updateTimer = () => {
      const now = new Date();
      const elapsedSeconds = Math.floor((now - roundStartTime) / 1000);
      const remaining = Math.max(0, 300 - elapsedSeconds);
      
      if (remaining <= 0 && !finished) {
        if (socket && playerName && lobbyId) {
          socket.emit('finish_turn', { lobbyId, playerName });
        }
        setFinished(true);
      }
      
      setTimer(remaining);
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
    const action = { 
      type: 'attack', 
      targetCountry: attackTarget.country, 
      targetCity: attackTarget.city,
      army: attackTarget.army 
    };
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

  // New enhanced actions
  const handleResearchTechnology = useCallback((techName, cost = 400) => {
    if (!techName || myBudget < cost) return;
    const action = { type: 'researchTechnology', techName, cost };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
    setLastActionFeedback({
      type: 'success',
      message: `Researching ${techName} technology`
    });
  }, [myBudget, lobbyId, playerName]);

  const handleEstablishDiplomacy = useCallback((targetCountry, relationLevel) => {
    if (!targetCountry || !relationLevel) return;
    const action = { type: 'establishDiplomacy', targetCountry, relationLevel };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
    setLastActionFeedback({
      type: 'info',
      message: `Establishing ${relationLevel} relations with ${targetCountry}`
    });
  }, [lobbyId, playerName]);

  const handleInvestInInfrastructure = useCallback((cityName, amount) => {
    if (!cityName || !amount || myBudget < amount) return;
    const action = { type: 'investInInfrastructure', cityName, amount };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
    setLastActionFeedback({
      type: 'success',
      message: `Investing ${amount} in ${cityName} infrastructure`
    });
  }, [myBudget, lobbyId, playerName]);

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
  }, []);

  // Language setting
  const handleLangChange = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  // --- ENHANCED CHAT SYSTEM ---
  // Set up chat message listener
  useEffect(() => {
    if (!socket) return;
    
    // Message handler that supports both formats
    const handleMsg = (msg) => {
      console.log("Chat message received:", msg);
      
      // Ensure we have a valid message
      if (!msg) {
        console.error("Received null or undefined message");
        return;
      }
      
      // Normalize message format to handle any inconsistencies
      const processedMsg = {
        id: msg.id || `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        player: msg.player,
        to: msg.to || 'all',
        text: msg.text || msg.msg || "", // Ensure we have text even if empty
        time: msg.time || Date.now(),
        status: msg.status || 'sent',
        lobbyId: msg.lobbyId || lobbyId, // Use current lobby if not specified
        readBy: msg.readBy || []
      };
      
      // Check for duplicates and add to message list
      setChatMessages(prev => {
        if (prev.some(m => m.id === processedMsg.id)) {
          return prev.map(m => m.id === processedMsg.id ? processedMsg : m);
        }
        return [...prev, processedMsg];
      });
    };
    
    // Read status handler
    const handleMessagesRead = (data) => {
      setChatMessages(prev => 
        prev.map(msg => 
          msg.player === playerName && 
          msg.to === data.player && 
          !msg.readBy.includes(data.player)
            ? { ...msg, readBy: [...msg.readBy, data.player], status: 'read' }
            : msg
        )
      );
    };
    
    // Unread counts handler
    const handleUnreadCounts = (counts) => {
      setUnreadCounts(counts);
    };
    
    // Typing status handler
    const handleTypingStatusUpdate = (status) => {
      setTypingStatus(status);
    };
    
    socket.on('room_message', handleMsg);
    socket.on('private_message', handleMsg);
    socket.on('messages_read', handleMessagesRead);
    socket.on('unread_counts', handleUnreadCounts);
    socket.on('typing_status_update', handleTypingStatusUpdate);
    
    // Chat history handler
    socket.on('chat_history', (history) => {
      if (Array.isArray(history)) {
        setChatMessages(prev => {
          // Remove duplicates and merge
          const merged = [...prev];
          history.forEach(msg => {
            if (!merged.some(m => m.id === msg.id)) {
              merged.push(msg);
            }
          });
          return merged;
        });
      }
      setLoadingChats(false);
    });
    
    // Cleanup
    return () => {
      socket.off('room_message', handleMsg);
      socket.off('private_message', handleMsg);
      socket.off('messages_read', handleMessagesRead);
      socket.off('unread_counts', handleUnreadCounts);
      socket.off('typing_status_update', handleTypingStatusUpdate);
      socket.off('chat_history');
    };
  }, [playerName]);
  
  // Request chat history when the lobby ID or selected chat changes
  useEffect(() => {
    if (socket && lobbyId) {
      setLoadingChats(true);
      
      if (selectedChat === 'all') {
        // Request room chat history
        socket.emit('request_chat_history', { 
          lobbyId, 
          chatType: 'room'
        });
      } else {
        // Request private chat history with the selected user
        socket.emit('request_chat_history', { 
          lobbyId,
          chatType: 'private',
          withPlayer: selectedChat
        });
        
        // Mark messages as read
        socket.emit('mark_messages_read', {
          lobbyId,
          withPlayer: selectedChat
        });
      }
    }
  }, [lobbyId, selectedChat]);
  
  // Search messages when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      setSearchResults(searchMessages(chatMessages, searchTerm));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, chatMessages]);
  
  // Handle typing status
  useEffect(() => {
    if (!socket || !isTyping) return;
    
    socket.emit('typing_status', {
      lobbyId,
      to: selectedChat,
      isTyping: true
    });
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set a new timeout to clear typing status
    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_status', {
        lobbyId,
        to: selectedChat,
        isTyping: false
      });
    }, 3000);
    
    setTypingTimeout(timeout);
    
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [isTyping, lobbyId, selectedChat, socket, typingTimeout]);
  
  // Handle chat input changes
  const handleChatInputChange = useCallback((value) => {
    setChatInput(value);
    if (value && !isTyping) {
      setIsTyping(true);
    }
  }, [isTyping]);
  
  // Function to send chat messages
  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    
    const msgObj = createChatMessage(
      chatInput,
      playerName,
      selectedChat === 'all' ? 'all' : selectedChat,
      lobbyId
    );
    
    // Reset typing status
    setIsTyping(false);
    if (socket) {
      socket.emit('typing_status', {
        lobbyId,
        to: selectedChat,
        isTyping: false
      });
    }
    
    // Add message to UI immediately with 'sending' status
    setChatMessages(prev => [...prev, { ...msgObj, status: 'sending' }]);
    
    // Clear input
    setChatInput('');
    
    // Send to server
    if (selectedChat === 'all') {
      socket.emit('room_message', msgObj);
    } else {
      socket.emit('private_message', msgObj);
    }
  }, [chatInput, playerName, selectedChat, lobbyId]);
  
  const handleRefreshChats = useCallback(() => {
    if (socket && lobbyId) {
      setLoadingChats(true);
      socket.emit('request_chat_history', { 
        lobbyId, 
        chatType: selectedChat === 'all' ? 'room' : 'private',
        withPlayer: selectedChat !== 'all' ? selectedChat : undefined
      });
    }
  }, [lobbyId, selectedChat]);
  
  return (
    <GameContext.Provider value={{
      // Game state
      gameState, setGameState,
      actions, setActions,
      currentRound, setCurrentRound,
      timer, setTimer,
      roundStartTime, setRoundStartTime,
      showSummary, setShowSummary,
      finished, setFinished,
      allFinished, setAllFinished,
      waitingPlayers, setWaitingPlayers,
      error, setError,
      lang, setLang,
      
      // Player info
      playerName,
      lobbyId,
      myCountryObj,
      myCountry,
      myCities,
      myBudget,
      myArmy,
      allPlayers,
      allCountryEnNames,
      
      // UI state
      attackTarget, setAttackTarget,
      upgradeCity, setUpgradeCity,
      sanctionTarget, setSanctionTarget,
      armyCount, setArmyCount,
      openSection, setOpenSection,
      
      // Enhanced state
      techSelection, setTechSelection,
      diplomacySelection, setDiplomacySelection,
      infrastructureSelection, setInfrastructureSelection,
      lastActionFeedback, setLastActionFeedback,
      actionsHistory, setActionsHistory,
      
      // Action handlers
      handleBuyArmy,
      handleUpgradeCity,
      handleAttack,
      handleDevelopNuclear,
      handleSetSanction,
      handleResearchTechnology,
      handleEstablishDiplomacy,
      handleInvestInInfrastructure,
      handleFinishTurn,
      handleUndoFinish,
      handleNextRound,
      handleLangChange,
      
      // Chat state and handlers
      chatMessages, setChatMessages,
      chatInput, setChatInput: handleChatInputChange,
      loadingChats, setLoadingChats,
      selectedChat, setSelectedChat,
      handleSendChat,
      handleRefreshChats,
      chatGroups,
      unreadCounts,
      typingMessage,
      usersWithUnread,
      searchTerm, setSearchTerm,
      searchResults,
      allUsers,
    }}>
      {children}
    </GameContext.Provider>
  );
}
