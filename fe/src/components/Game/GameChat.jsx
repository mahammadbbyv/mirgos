import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext-refactored';  // Use the refactored context
import BarLoader from 'react-spinners/BarLoader';
import { formatMessageTime, getMessageStatusIcon } from '../../utils/chatHelper';
import ChatTester from '../UI/ChatTester'; // Import the chat tester component

/**
 * Enhanced chat interface component for player communication
 */
const GameChat = () => {
  const {
    loadingChats,
    allUsers,
    chatGroups,
    playerName,
    selectedChat,
    setSelectedChat,
    chatInput,
    setChatInput,
    handleSendChat,
    handleRefreshChats,
    unreadCounts = {},
    typingMessage,
    usersWithUnread = [],
    searchTerm, 
    setSearchTerm,
    searchResults
  } = useGame();
  
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatGroups, selectedChat]);
  
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };
  
  const handleSearchToggle = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchTerm('');
    }
  };
  
  // Show loading state
  if (loadingChats) {
    return (
      <div className="mt-8 bg-gray-800/90 rounded-2xl p-6 shadow-lg border border-gray-700 flex flex-col">
        <div className="flex items-center justify-center w-full h-32">
          <div className="text-center">
            <BarLoader color="#3b82f6" />
            <div className="mt-4 text-blue-300">Loading chat messages...</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Determine messages to display based on search state
  const messagesToDisplay = searchTerm && searchResults.length > 0
    ? searchResults
    : (chatGroups[selectedChat] || []);
  
  return (
    <div className="mt-8 bg-gray-800/90 rounded-2xl p-6 shadow-lg border border-gray-700 flex">
      {/* Chat sidebar with player list */}
      <div className="w-48 pr-6 border-r border-gray-700">
        <div className="font-bold text-blue-300 mb-2">Players</div>
        
        <div className="space-y-1">
          <button
            className={`flex justify-between items-center w-full text-left px-2 py-1 rounded ${
              selectedChat === 'all' ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-gray-700'
            }`}
            onClick={() => setSelectedChat('all')}
          >
            <span>All Players</span>
            {unreadCounts.all && unreadCounts.all > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {unreadCounts.all}
              </span>
            )}
          </button>
          
          {allUsers.filter(u => u !== playerName).map(u => (
            <button
              key={u}
              className={`flex justify-between items-center w-full text-left px-2 py-1 rounded ${
                selectedChat === u ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedChat(u)}
            >
              <span>{u}</span>
              {unreadCounts[u] && unreadCounts[u] > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {unreadCounts[u]}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {usersWithUnread.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-xs text-yellow-400 mb-2">Unread Messages</div>
            {usersWithUnread.map(user => (
              <div 
                key={`unread-${user}`}
                className="text-yellow-300 text-xs mb-1 cursor-pointer hover:underline"
                onClick={() => setSelectedChat(user)}
              >
                {user} ({unreadCounts[user]})
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 pl-6 flex flex-col">
        {/* Header with chat title and controls */}
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-blue-300">
            {selectedChat === 'all' ? 'All Players' : `Chat with ${selectedChat}`}
          </div>
              <div className="flex space-x-2">
            <button 
              onClick={handleSearchToggle}
              className={`text-xs px-2 py-1 rounded ${isSearching ? 'bg-blue-700 text-white' : 'text-blue-200 hover:text-blue-300'}`}
            >
              {isSearching ? 'Close Search' : 'Search'}
            </button>
            <button 
              onClick={handleRefreshChats}
              className="text-xs text-blue-200 hover:text-blue-300"
            >
              Refresh
            </button>
          </div>
          
          {/* Add chat tester for debugging */}
          <div className="mt-2">
            <ChatTester />
          </div>
        </div>
        
        {/* Search input */}
        {isSearching && (
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="text-xs text-gray-400 mt-1">
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
              </div>
            )}
          </div>
        )}
        
        {/* Messages container */}
        <div 
          className="h-60 overflow-y-auto mb-4 bg-gray-900/50 p-3 rounded"
          ref={chatContainerRef}
        >
          <div className="flex flex-col space-y-2">
            {messagesToDisplay.length === 0 ? (
              <div className="text-gray-400 italic">
                {searchTerm ? 'No messages match your search.' : 'No messages yet.'}
              </div>
            ) : (
              messagesToDisplay.map((msg, index) => (
                <div className={`flex ${msg.player === playerName ? "justify-end" : ""}`} key={msg.id || index}>
                  <div className={`mb-2 ${msg.player === playerName ? 'bg-gray-300' : 'bg-blue-500'} text-black p-2 rounded-lg max-w-xs`}>
                    {/* Sender name (only shown in group chat) */}
                    {selectedChat === 'all' && (
                      <div 
                        className="text-sm font-bold text-blue-700 cursor-pointer" 
                        onClick={() => setSelectedChat(msg.player)}
                      >
                        {msg.player}
                      </div>
                    )}
                    
                    {/* Message text */}
                    <div className="break-words">{msg.text}</div>
                    
                    {/* Message time and status */}
                    <div className="flex justify-between items-center">
                      <div className="text-xs opacity-70">
                        {formatMessageTime(msg.time)}
                      </div>
                      
                      {/* Message status indicator */}
                      {msg.player === playerName && (
                        <div className="text-xs ml-2">
                          {msg.status === 'sending' && <span className="text-yellow-500">⏱️</span>}
                          {msg.status === 'sent' && <span className="text-blue-700">✓</span>}
                          {msg.status === 'delivered' && <span className="text-blue-700">✓✓</span>}
                          {msg.status === 'read' && <span className="text-green-700">✓✓</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
            
            {/* Typing indicator */}
            {typingMessage && (
              <div className="text-gray-400 text-sm italic">
                {typingMessage}
              </div>
            )}
          </div>
        </div>
        
        {/* Chat input area */}
        <div className="flex">
          <textarea
            className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-l px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all"
            placeholder={`Message ${selectedChat === 'all' ? 'all players' : selectedChat}...`}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={1}
            style={{ resize: 'none' }}
          />
          <button
            className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-r text-white shadow focus:ring-2 focus:ring-blue-400 transition-all"
            onClick={handleSendChat}
            disabled={!chatInput.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameChat;
