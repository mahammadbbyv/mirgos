/**
 * Chat Helper Module
 * Provides utility functions for chat handling on the frontend
 */

// Format a chat message for display
export const formatChatMessage = (msg) => {
  if (!msg) return null;
  
  // Normalize message structure
  const formattedMsg = {
    id: msg.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    player: msg.player || 'Unknown',
    text: msg.text || msg.msg || '',
    to: msg.to || 'all',
    time: msg.time || Date.now(),
    lobbyId: msg.lobbyId,
    status: msg.status || 'sent',
    readBy: msg.readBy || []
  };
  
  return formattedMsg;
};

// Check if a message should be displayed in the current chat view
export const shouldDisplayMessage = (msg, selectedChat, playerName) => {
  if (!msg) return false;
  
  // Room messages (to all) should only be shown in the "all" view
  if (msg.to === 'all') {
    return selectedChat === 'all';
  }
  
  // Private messages should only be shown in private chats between the participants
  return (
    (msg.player === playerName && msg.to === selectedChat) ||
    (msg.player === selectedChat && msg.to === playerName)
  );
};

// Group chat messages by chat type (room) or participant (private)
export const groupChatMessages = (messages, playerName) => {
  if (!messages || !Array.isArray(messages) || !playerName) {
    return { all: [] };
  }
  
  // Initialize with "all" group
  const groups = { all: [] };
  
  // Add any other participants
  messages.forEach(msg => {
    if (msg.player && msg.player !== playerName && !groups[msg.player]) {
      groups[msg.player] = [];
    }
    if (msg.to && msg.to !== 'all' && msg.to !== playerName && !groups[msg.to]) {
      groups[msg.to] = [];
    }
  });
  
  // Categorize messages
  messages.forEach(msg => {
    if (msg.to === 'all') {
      groups.all.push(msg);
    } else {
      // Private messages go to both sender and recipient groups
      if (msg.player === playerName && groups[msg.to]) {
        groups[msg.to].push(msg);
      } else if (msg.to === playerName && groups[msg.player]) {
        groups[msg.player].push(msg);
      }
    }
  });
  
  return groups;
};

// Check if a message is a duplicate of one already in the chat
export const isDuplicateMessage = (newMsg, existingMessages) => {
  if (!newMsg || !existingMessages || !Array.isArray(existingMessages)) {
    return false;
  }
  
  // First check by ID if available
  if (newMsg.id && existingMessages.some(msg => msg.id === newMsg.id)) {
    return true;
  }
  
  // Otherwise check by content and metadata
  return existingMessages.some(msg => 
    msg.player === newMsg.player && 
    msg.to === newMsg.to && 
    msg.text === newMsg.text && 
    msg.time === newMsg.time
  );
};

// Create a new chat message
export const createChatMessage = (text, playerName, recipient, lobbyId) => {
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    player: playerName,
    text: text.trim(),
    to: recipient || 'all',
    lobbyId,
    time: Date.now(),
    status: 'sending',
    readBy: []
  };
};

// Format timestamp as readable time
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If it's today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } 
    // If it's yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    // If it's this year
    else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
        ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } 
    // If it's in past years
    else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) + 
        ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  } catch (err) {
    console.error('Error formatting timestamp:', err);
    return '';
  }
};

// Update message status in a message array
export const updateMessageStatus = (messages, messageId, newStatus, readBy = null) => {
  if (!messages || !Array.isArray(messages) || !messageId) {
    return messages;
  }
  
  return messages.map(msg => {
    if (msg.id === messageId) {
      const updatedMsg = { ...msg, status: newStatus };
      if (readBy && !msg.readBy.includes(readBy)) {
        updatedMsg.readBy = [...msg.readBy, readBy];
      }
      return updatedMsg;
    }
    return msg;
  });
};

// Update all messages from a specific sender to read status
export const markAllMessagesAsRead = (messages, fromPlayer, byPlayer) => {
  if (!messages || !Array.isArray(messages) || !fromPlayer || !byPlayer) {
    return messages;
  }
  
  return messages.map(msg => {
    if (msg.player === fromPlayer && msg.to === byPlayer) {
      if (!msg.readBy.includes(byPlayer)) {
        return {
          ...msg,
          status: 'read',
          readBy: [...msg.readBy, byPlayer]
        };
      }
    }
    return msg;
  });
};

// Get status icon for a message
export const getMessageStatusIcon = (message, currentUser) => {
  // Only show status for messages sent by current user
  if (message.player !== currentUser) {
    return null;
  }
  
  switch (message.status) {
    case 'sending':
      return '⏱️'; // Clock icon for sending
    case 'sent':
      return '✓'; // Single check for sent
    case 'delivered':
      return '✓✓'; // Double check for delivered
    case 'read':
      return '✓✓✓'; // Triple check for read
    default:
      return '';
  }
};

// Search messages for a search term
export const searchMessages = (messages, searchTerm) => {
  if (!messages || !Array.isArray(messages) || !searchTerm) {
    return [];
  }
  
  const term = searchTerm.toLowerCase();
  return messages.filter(msg => 
    (msg.text && msg.text.toLowerCase().includes(term)) ||
    (msg.player && msg.player.toLowerCase().includes(term))
  );
};

// Get list of users that have unread messages
export const getUsersWithUnreadMessages = (unreadCounts) => {
  if (!unreadCounts) return [];
  
  return Object.keys(unreadCounts).filter(user => unreadCounts[user] > 0);
};

// Format typing status messages
export const formatTypingStatus = (typingUsers) => {
  if (!typingUsers || !Array.isArray(typingUsers) || typingUsers.length === 0) {
    return null;
  }
  
  if (typingUsers.length === 1) {
    return `${typingUsers[0]} is typing...`;
  } else if (typingUsers.length === 2) {
    return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
  } else {
    return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
  }
};
