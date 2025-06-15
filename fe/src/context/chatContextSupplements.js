/**
 * Chat Context Supplements
 * This file contains supplemental functions and values for the GameContext
 * to support enhanced chat functionality.
 */
import { useCallback, useEffect } from 'react';
import { formatChatMessage, searchMessages, isDuplicateMessage, shouldDisplayMessage } from '../utils/chatHelper';

export const setupEnhancedChatHandlers = ({
  socket, 
  lobbyId, 
  playerName, 
  selectedChat,
  setChatMessages,
  setLoadingChats,
  setUnreadCounts,
  setTypingStatus,
}) => {
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
  }, [socket, lobbyId, playerName, selectedChat, setChatMessages, setLoadingChats, setUnreadCounts, setTypingStatus]);
};

export const setupSearchHandler = ({
  searchTerm,
  chatMessages,
  setSearchResults
}) => {
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = searchMessages(chatMessages, searchTerm);
    setSearchResults(results);
  }, [searchTerm, chatMessages, setSearchResults]);
};

export const setupTypingHandlers = ({
  socket,
  chatInput,
  isTyping,
  setIsTyping,
  typingTimeout,
  setTypingTimeout,
  lobbyId,
  selectedChat
}) => {
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
  }, [socket, chatInput, isTyping, typingTimeout, setTypingTimeout, lobbyId, selectedChat, setIsTyping]);
};

export const createChatHandlers = ({
  socket,
  chatInput,
  setChatInput,
  playerName,
  selectedChat,
  lobbyId,
  setChatMessages,
  isTyping,
  setIsTyping,
  typingTimeout
}) => {
  // Send chat message
  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    
    // Import the createChatMessage function at the top of your file
    const { createChatMessage } = require('../utils/chatHelper');
    
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
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Clear input
    setChatInput('');
  }, [socket, chatInput, setChatInput, playerName, selectedChat, lobbyId, setChatMessages, setIsTyping, typingTimeout]);

  // Handle chat input change with typing indicator
  const handleChatInputChange = useCallback((e) => {
    const value = e.target.value;
    setChatInput(value);
    
    // Set typing indicator if there's content
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    }
  }, [setChatInput, isTyping, setIsTyping]);

  // Refresh chats
  const handleRefreshChats = useCallback(() => {
    if (socket) {
      if (selectedChat === 'all') {
        socket.emit('request_chat_history', { lobbyId, chatType: 'room' });
      } else {
        socket.emit('request_chat_history', { lobbyId, chatType: 'private', withPlayer: selectedChat });
      }
      socket.emit('get_unread_counts', { lobbyId });
    }
  }, [socket, selectedChat, lobbyId]);

  return {
    handleSendChat,
    handleChatInputChange,
    handleRefreshChats
  };
};

export const getMemoizedChatValues = ({
  chatMessages,
  playerName,
  typingStatus,
  selectedChat,
  unreadCounts,
  gameState
}) => {
  // Helper function to extract chat-related values
  const allUsers = gameState?.players?.sort() || [];
  const chatGroups = require('../utils/chatHelper').groupChatMessages(chatMessages, playerName);
  
  // Get typing message
  const typingUsers = selectedChat === 'all' 
    ? (typingStatus?.all || []) 
    : (typingStatus?.[selectedChat] ? [selectedChat] : []);
  
  const typingMessage = require('../utils/chatHelper').formatTypingStatus(typingUsers);
  
  // Get users with unread messages
  const usersWithUnread = require('../utils/chatHelper').getUsersWithUnreadMessages(unreadCounts);
  
  return {
    allUsers,
    chatGroups,
    typingMessage,
    usersWithUnread
  };
};
