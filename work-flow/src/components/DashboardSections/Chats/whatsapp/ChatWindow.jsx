import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import Message from './Message';

const ChatWindow = ({ activeChat, messages, onSendMessage, aiMode, onToggleAI, onStatusChange, isDetailsOpen, onToggleDetails }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  const statusOptions = ['Active', 'Closed', 'Paused', 'Draft', 'Assign to me'];
  
  const statusColors = {
    Active: 'bg-green-100 text-green-800 hover:bg-green-200',
    Closed: 'bg-red-100 text-red-800 hover:bg-red-200',
    Paused: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    Draft: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    'Assign to me': 'bg-green-100 text-green-800 hover:bg-green-200'
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (inputMessage.trim() && !aiMode) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !aiMode) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStatusSelect = (status) => {
    if (onStatusChange && activeChat) {
      onStatusChange(activeChat.id, status);
      setShowStatusDropdown(false);
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-100 to-green-100 flex items-center justify-center">
            <User className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Chat</h2>
          <p className="text-gray-600">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-500 flex items-center justify-center text-white font-semibold">
              {activeChat.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{activeChat.name}</h2>
              
              {/* Status Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                    statusColors[activeChat.status]
                  }`}
                >
                  <span>{activeChat.status}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
                    {statusOptions.map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusSelect(status)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          activeChat.status === status ? 'bg-gray-50 font-medium' : ''
                        }`}
                      >
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          statusColors[status].split(' ').slice(0, 2).join(' ')
                        }`}>
                          {status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {aiMode && (
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <Bot className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">AI Active</span>
              </div>
            )}
            
            {/* Toggle Details Button */}
            <button
              onClick={onToggleDetails}
              className={`p-2 rounded-lg transition-all ${
                isDetailsOpen 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isDetailsOpen ? 'Hide customer details' : 'Show customer details'}
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container with Auto-scroll */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 scroll-smooth"
      >
        <div className="space-y-4">
          {messages.map(message => (
            <Message key={message.id} message={message} isAI={aiMode && message.sender === 'me'} />
          ))}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
        {/* AI Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">AI Mode</span>
            {aiMode && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Auto-replying to messages
              </span>
            )}
          </div>
          <button
            onClick={onToggleAI}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              aiMode ? 'bg-gradient-to-r from-green-500 to-pink-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                aiMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Message Input */}
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={aiMode ? "AI is handling messages..." : "Type your message..."}
            disabled={aiMode}
            className={`flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
              aiMode 
                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' 
                : 'border-gray-300 bg-white'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={aiMode}
            className={`p-2 rounded-full text-white transition-all transform flex-shrink-0 ${
              aiMode 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-green-500 hover:from-green-600 hover:to-green-600 hover:scale-105'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;