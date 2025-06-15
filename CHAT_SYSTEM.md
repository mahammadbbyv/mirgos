# Enhanced Chat System Documentation

## Overview

The Mirgos chat system has been enhanced with several new features for better user experience and reliability. This document outlines the changes and explains how to use the new functionality.

## Key Features

### 1. Message Status Indicators

Messages now include status indicators to show their delivery state:

- **Sending** (⏱️): Message is being sent to the server
- **Sent** (✓): Server has received the message
- **Delivered** (✓✓): The recipient's client has received the message
- **Read** (✓✓✓): The recipient has viewed the message

### 2. Read Receipts

Private messages now include read receipts that tell the sender when their message has been read by the recipient.

### 3. Unread Messages Counter

- Displays the number of unread messages for each chat
- Shows a list of users with unread messages for quick access

### 4. Typing Indicators

Shows when other players are typing in room chat or private conversations:
- "User is typing..." for a single user
- "User1 and User2 are typing..." for two users
- "User1 and X others are typing..." for more than two users

### 5. Message Search

Search through chat messages to find specific content or conversations.

### 6. Improved Message Deduplication

Messages are now properly tracked by ID to prevent duplicate display in the UI.

### 7. Better Error Handling

Improved error handling for disconnects and message delivery failures.

## Architecture

The chat system follows a modular architecture with dedicated managers:

### Backend

- `chatManager.js`: Handles all chat functionality, message storage, and delivery
- Components:
  - Message storage and retrieval
  - Chat history management
  - Read receipt tracking
  - Typing status management
  - Unread message counting

### Frontend

- `chatHelper.js`: Utility functions for chat operations
- `GameChat.jsx`: Enhanced chat UI component
- `GameContext-enhanced.jsx`: Chat state management and socket handling

## Technical Implementation

### Message Flow

1. User sends a message from the client
2. Client optimistically adds message to UI with "sending" status
3. Server receives message and stores it in lobby history
4. Server broadcasts message to recipients 
5. Recipients acknowledge message receipt, changing status to "delivered"
6. When recipient views message, status updates to "read"

### Socket Events

- `room_message`: Send/receive a message to all players in a lobby
- `private_message`: Send/receive a direct message to a specific player
- `request_chat_history`: Get message history for a room or private chat
- `chat_history`: Receive message history from server
- `mark_messages_read`: Mark messages as read when viewing a chat
- `messages_read`: Notification that messages have been read
- `get_unread_counts`: Request count of unread messages
- `unread_counts`: Receive unread message counts
- `typing_status`: Indicate a user is typing or stopped typing
- `typing_status_update`: Notification about users who are typing

## Usage

### Sending Messages

```jsx
// Send a message to all players
handleSendChat();

// Send a private message to a specific player
setSelectedChat(playerName);
handleSendChat();
```

### Checking Message Status

Message statuses are automatically updated in the UI. The status icon appears next to the message timestamp.

### Searching Messages

```jsx
// Toggle search UI
setIsSearching(true);

// Search for messages containing specific text
setSearchTerm('search text');
```

## Future Enhancements

Potential future improvements for the chat system:

1. Message reactions (emojis)
2. Message threading for conversation organization
3. File attachments
4. Message editing and deletion
5. Rich text formatting
6. Chat notifications
7. Offline message queuing
