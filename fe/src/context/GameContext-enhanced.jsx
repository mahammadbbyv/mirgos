import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { socket, connectToServer } from '../utils/lobby';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingStatus, setTypingStatus] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingStatus, setTypingStatus] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Player info
  const playerName = localStorage.getItem('playerName');
  const lobbyId = localStorage.getItem('currentLobby');
  
  // --- MEMOIZED VALUES ---
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

    // Rejoin lobby to ensure we're properly connected
    if (socket && lobbyId && playerName) {
      socket.emit('join_lobby', { lobbyId, playerName });
      socket.emit('request_game_state', { lobbyId });
      socket.emit('request_round_start', { lobbyId });
    }
    
    // Listen for game state updates
    const handleGameState = (state) => {
      console.log("Received game state:", state);
      if (state) {
        setGameState(state);
        setCurrentRound(state.currentRound || 1);
        setTimer(state.timer || 300);
        setRoundStartTime(state.roundStartTime || null);
      }
    };
    
    // Listen for round start events
    const handleRoundStart = ({ roundStartTime }) => {
      if (roundStartTime) {
        console.log("Round starting at:", new Date(roundStartTime));
        setRoundStartTime(roundStartTime);
        setFinished(false);
        setShowSummary(false);
      }
    };
    
    // Listen for waiting players updates
    const handleWaitingPlayers = (players) => {
      if (Array.isArray(players)) {
        setWaitingPlayers(players);
      }
    };
    
    // Listen for all players finished event
    const handleAllFinished = () => {
      setAllFinished(true);
      setShowSummary(true);
    };
    
    if (socket) {
      socket.on('game_state', handleGameState);
      socket.on('round_start', handleRoundStart);
      socket.on('waiting_players', handleWaitingPlayers);
      socket.on('all_finished', handleAllFinished);
      
      return () => {
        socket.off('game_state', handleGameState);
        socket.off('round_start', handleRoundStart);
        socket.off('waiting_players', handleWaitingPlayers);
        socket.off('all_finished', handleAllFinished);
      };
    }
    
    return () => {};
  }, [lobbyId, playerName]);

  // Timer handler
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
      
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = Math.max(0, 300 - elapsed);
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

  // --- ENHANCED CHAT SYSTEM ---
  useEffect(() => {
    if (!socket) return;
    setChatMessages([]); // Clear messages on chat change
    setLoadingChats(true);
    
    // Request chat history for the selected chat
    if (selectedChat === 'all') {
      socket.emit('request_chat_history', { lobbyId, chatType: 'room' });
    } else {
      socket.emit('request_chat_history', { lobbyId, chatType: 'private', withPlayer: selectedChat });
      
      // Mark messages as read when viewing a private chat
      socket.emit('mark_messages_read', { lobbyId, fromPlayer: selectedChat });
    }
    
    // Request unread counts
    socket.emit('get_unread_counts', { lobbyId });
    
    // Handle incoming messages
    const handleMsg = (msg) => {
      if (!msg || msg.lobbyId !== lobbyId) return;
      
      // Format message and check if it should be displayed in current chat
      const formattedMsg = formatChatMessage(msg);
      if (!formattedMsg) return;
      
      setChatMessages((prev) => {
        // Check for and update existing message with same ID (for status updates)
        const msgIndex = prev.findIndex(m => m.id === formattedMsg.id);
        if (msgIndex >= 0) {
          const updatedMessages = [...prev];
          updatedMessages[msgIndex] = formattedMsg;
          return updatedMessages;
        }
        
        // Don't add duplicates
        if (isDuplicateMessage(formattedMsg, prev)) return prev;
        
        // Only add if relevant to current chat view
        if (shouldDisplayMessage(formattedMsg, selectedChat, playerName)) {
          return [...prev, formattedMsg];
        }
        
        return prev;
      });
      
      // Request updated unread counts
      socket.emit('get_unread_counts', { lobbyId });
      
      setLoadingChats(false);
    };
    
    // Handle read receipts
    const handleMessagesRead = ({ by, timestamp }) => {
      setChatMessages(prev => {
        return prev.map(msg => {
          if (msg.player === playerName && msg.to === by && !msg.readBy.includes(by)) {
            return {
              ...msg,
              status: 'read',
              readBy: [...(msg.readBy || []), by]
            };
          }
          return msg;
        });
      });
    };
    
    // Handle unread counts update
    const handleUnreadCounts = (counts) => {
      setUnreadCounts(counts || {});
    };
    
    // Handle typing status updates
    const handleTypingStatusUpdate = ({ channel, typingPlayers, isTyping }) => {
      if (channel === 'all') {
        // Multiple players might be typing in room chat
        setTypingStatus(prev => ({
          ...prev,
          all: typingPlayers || []
        }));
      } else {
        // For private chat, direct update for a specific user
        setTypingStatus(prev => ({
          ...prev,
          [channel]: isTyping
        }));
      }
    };
    
    // Listen for all chat-related socket events
    socket.on('room_message', handleMsg);
    socket.on('private_message', handleMsg);
    socket.on('messages_read', handleMessagesRead);
    socket.on('unread_counts', handleUnreadCounts);
    socket.on('typing_status_update', handleTypingStatusUpdate);
    
    // Handle chat history response
    socket.on('chat_history', (history) => {
      // Format messages
      const messages = (history.messages || []).map(formatChatMessage).filter(Boolean);
      setChatMessages(messages);
      setLoadingChats(false);
    });
    
    return () => {
      socket.off('room_message', handleMsg);
      socket.off('private_message', handleMsg);
      socket.off('messages_read', handleMessagesRead);
      socket.off('unread_counts', handleUnreadCounts);
      socket.off('typing_status_update', handleTypingStatusUpdate);
      socket.off('chat_history');
    };
  }, [lobbyId, playerName, selectedChat]);

  // Update search results when search term or messages change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = searchMessages(chatMessages, searchTerm);
    setSearchResults(results);
  }, [searchTerm, chatMessages]);
  
  // Handle typing indicator with debounce
  useEffect(() => {
    if (!socket || !chatInput.trim() || !isTyping) return;

    // Emit typing status
    socket.emit('typing_status', {
      lobbyId,
      isTyping: true,
      channel: selectedChat
    });
    
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set a timeout to clear typing status
    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_status', {
        lobbyId,
        isTyping: false,
        channel: selectedChat
      });
    }, 3000); // 3 seconds timeout
    
    setTypingTimeout(timeout);
    
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [chatInput, isTyping, lobbyId, selectedChat, socket, typingTimeout]);

  // Send chat message
  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    
    // Create and format message
    const msg = createChatMessage(chatInput, playerName, selectedChat, lobbyId);
    
    // Optimistically add to UI
    setChatMessages(prev => [...prev, msg]);
    
    // Send to server based on recipient
    if (socket) {
      if (selectedChat === 'all') {
        socket.emit('room_message', msg);
      } else {
        socket.emit('private_message', msg);
      }
    }
    
    // Stop typing indicator
    setIsTyping(false);
    if
