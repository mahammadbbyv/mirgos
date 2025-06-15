/**
 * Chat Manager Module
 * Handles all chat-related functionality for the Mirgos application
 */

// Helper function to store a message in the appropriate collection
const storeMessage = (lobby, message) => {
  if (!lobby) return false;
  
  // Normalize the message before storing
  const normalizedMessage = {
    ...message,
    id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: message.time || Date.now(), // Ensure timestamp exists
    status: message.status || 'sent',
    readBy: message.readBy || []
  };
  
  // Determine message type and target collection
  if (message.to === 'all') {
    if (!lobby.chatMessages) lobby.chatMessages = [];
    lobby.chatMessages.push(normalizedMessage);
  } else {
    if (!lobby.privateMessages) lobby.privateMessages = [];
    lobby.privateMessages.push(normalizedMessage);
  }
  return normalizedMessage; // Return the normalized message with ID
};

// Get chat history for a room or private conversation
const getChatHistory = (lobby, chatType, playerName, withPlayer) => {
  if (!lobby) return [];
  
  if (chatType === 'room') {
    return lobby.chatMessages || [];
  } else if (chatType === 'private' && withPlayer) {
    const allPrivate = lobby.privateMessages || [];
    return allPrivate.filter(
      m => (m.player === playerName && m.to === withPlayer) ||
           (m.player === withPlayer && m.to === playerName)
    );
  }
  
  return [];
};

// Process and format a chat message before storing/sending
const processMessage = (message, playerName, lobbyId) => {
  // Validate and normalize message
  if (!message.text && !message.msg) {
    return null; // Invalid message
  }
  
  return {
    id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    player: playerName,
    to: message.to || 'all',
    text: message.text || message.msg, // Support both formats
    lobbyId,
    time: message.time || Date.now(),
    status: 'sent',
    readBy: []
  };
};

// Mark messages as read for a user
const markMessagesAsRead = (lobby, playerName, fromPlayer) => {
  if (!lobby || !playerName || !fromPlayer) return false;
  
  let updated = false;
  
  if (lobby.privateMessages) {
    lobby.privateMessages.forEach(msg => {
      if (msg.player === fromPlayer && msg.to === playerName && !msg.readBy.includes(playerName)) {
        msg.readBy.push(playerName);
        msg.status = 'read';
        updated = true;
      }
    });
  }
  
  return updated;
};

// Find unread message counts by sender
const getUnreadCounts = (lobby, playerName) => {
  if (!lobby || !playerName) return {};
  
  const unreadCounts = {};
  
  // Count unread room messages
  let roomUnread = 0;
  if (lobby.chatMessages) {
    roomUnread = lobby.chatMessages.filter(msg => 
      msg.to === 'all' && 
      msg.player !== playerName && 
      !msg.readBy.includes(playerName)
    ).length;
  }
  
  if (roomUnread > 0) {
    unreadCounts.all = roomUnread;
  }
  
  // Count unread private messages by sender
  if (lobby.privateMessages) {
    lobby.privateMessages.forEach(msg => {
      if (msg.to === playerName && !msg.readBy.includes(playerName)) {
        if (!unreadCounts[msg.player]) {
          unreadCounts[msg.player] = 0;
        }
        unreadCounts[msg.player]++;
      }
    });
  }
  
  return unreadCounts;
};

// Get players currently typing in a particular channel
const getTypingPlayers = (lobby, channel, excludePlayer) => {
  if (!lobby || !lobby.typingStatus) return [];
  
  const now = Date.now();
  const typingTimeout = 5000; // 5 seconds typing timeout
  
  return Object.entries(lobby.typingStatus)
    .filter(([player, status]) => 
      player !== excludePlayer &&
      status.channel === channel && 
      now - status.timestamp < typingTimeout
    )
    .map(([player]) => player);
};

// Register chat handlers for a socket
const registerChatHandlers = (socket, io, lobbyState) => {
  // Room message handler
  socket.on('room_message', (msg) => {
    if (!socket.lobbyId || !socket.playerName) return;
    
    const lobby = lobbyState.get(socket.lobbyId);
    if (!lobby) return;
    
    // Process and normalize the message
    const processedMsg = processMessage(msg, socket.playerName, socket.lobbyId);
    if (!processedMsg) return;
    
    // Store in chat history and get normalized message
    const storedMsg = storeMessage(lobby, processedMsg);
    
    // Broadcast to all players in the lobby
    console.log(`Room message from ${socket.playerName} to lobby ${socket.lobbyId}`);
    io.to(socket.lobbyId).emit('room_message', storedMsg);
  });
  
  // Private message handler
  socket.on('private_message', (msg) => {
    if (!socket.lobbyId || !socket.playerName) return;
    
    const lobby = lobbyState.get(socket.lobbyId);
    if (!lobby) return;
    
    // Process and normalize the message
    const processedMsg = processMessage(msg, socket.playerName, socket.lobbyId);
    if (!processedMsg || !processedMsg.to || processedMsg.to === 'all') return;
    
    // Store in private chat history
    const storedMsg = storeMessage(lobby, processedMsg);
    
    // Find recipient socket and send message
    const recipientSocket = Array.from(io.sockets.sockets.values()).find(
      s => s.playerName === processedMsg.to && s.lobbyId === socket.lobbyId
    );
    
    if (recipientSocket) {
      console.log(`Private message from ${socket.playerName} to ${processedMsg.to}`);
      storedMsg.status = 'delivered';
      recipientSocket.emit('private_message', storedMsg);
    }
    
    // Also send back to sender for consistent UI updates
    socket.emit('private_message', storedMsg);
  });
  
  // Chat history request handler
  socket.on('request_chat_history', ({ lobbyId, chatType, withPlayer }) => {
    if (!socket.playerName) return;
    
    const lobby = lobbyState.get(lobbyId);
    const messages = getChatHistory(lobby, chatType, socket.playerName, withPlayer);
    
    // For private messages, mark them as read
    if (chatType === 'private' && withPlayer) {
      const updated = markMessagesAsRead(lobby, socket.playerName, withPlayer);
      
      // If messages were marked as read, notify the sender
      if (updated) {
        const senderSocket = Array.from(io.sockets.sockets.values()).find(
          s => s.playerName === withPlayer && s.lobbyId === lobbyId
        );
        
        if (senderSocket) {
          senderSocket.emit('messages_read', {
            by: socket.playerName,
            timestamp: Date.now()
          });
        }
      }
    }
    
    socket.emit('chat_history', { 
      chatType, 
      withPlayer: withPlayer || null, 
      messages 
    });
    
    // Send unread counts
    const unreadCounts = getUnreadCounts(lobby, socket.playerName);
    socket.emit('unread_counts', unreadCounts);
  });
  
  // Mark messages as read
  socket.on('mark_messages_read', ({ lobbyId, fromPlayer }) => {
    if (!socket.lobbyId || !socket.playerName) return;
    
    const lobby = lobbyState.get(lobbyId);
    if (!lobby) return;
    
    const updated = markMessagesAsRead(lobby, socket.playerName, fromPlayer);
    
    // Notify the sender that their messages were read
    if (updated) {
      const senderSocket = Array.from(io.sockets.sockets.values()).find(
        s => s.playerName === fromPlayer && s.lobbyId === lobbyId
      );
      
      if (senderSocket) {
        senderSocket.emit('messages_read', {
          by: socket.playerName,
          timestamp: Date.now()
        });
      }
    }
    
    // Send updated unread counts
    const unreadCounts = getUnreadCounts(lobby, socket.playerName);
    socket.emit('unread_counts', unreadCounts);
  });
  
  // Get unread message counts
  socket.on('get_unread_counts', ({ lobbyId }) => {
    if (!socket.lobbyId || !socket.playerName) return;
    
    const lobby = lobbyState.get(lobbyId);
    if (!lobby) return;
    
    const unreadCounts = getUnreadCounts(lobby, socket.playerName);
    socket.emit('unread_counts', unreadCounts);
  });
  
  // Typing indicator
  socket.on('typing_status', ({ lobbyId, isTyping, channel }) => {
    if (!socket.lobbyId || !socket.playerName) return;
    
    const lobby = lobbyState.get(lobbyId);
    if (!lobby) return;
    
    // Initialize typing status if not exists
    if (!lobby.typingStatus) lobby.typingStatus = {};
    
    if (isTyping) {
      // Store typing status with timestamp
      lobby.typingStatus[socket.playerName] = {
        channel,
        timestamp: Date.now()
      };
    } else {
      // Remove typing status
      delete lobby.typingStatus[socket.playerName];
    }
    
    // Broadcast typing status to appropriate recipients
    if (channel === 'all') {
      // For room chat, broadcast to all in the lobby
      const typingPlayers = getTypingPlayers(lobby, 'all', socket.playerName);
      io.to(lobbyId).emit('typing_status_update', {
        channel: 'all',
        typingPlayers
      });
    } else {
      // For private chat, only notify the specific user
      const recipientSocket = Array.from(io.sockets.sockets.values()).find(
        s => s.playerName === channel && s.lobbyId === lobbyId
      );
      
      if (recipientSocket) {
        recipientSocket.emit('typing_status_update', {
          channel: socket.playerName,
          isTyping
        });
      }
    }
  });
};

module.exports = {
  storeMessage,
  getChatHistory,
  processMessage,
  markMessagesAsRead,
  getUnreadCounts,
  getTypingPlayers,
  registerChatHandlers
};
