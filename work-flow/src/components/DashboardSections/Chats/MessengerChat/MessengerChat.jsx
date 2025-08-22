import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, Smile, Bot, BotOff, ChevronUp, ChevronDown } from 'lucide-react';
import ContactItem from './ContactItem';
import MessageBubble from './MessageBubble';
import ProfileSidebar from './ProfileSidebar';
import AssignToDropdown from './AssignToDropdown';
import ChatSummary from './ChatSummary';
import QuickReplies from './QuickReplies';
import { contacts as initialContacts, messages as initialMessages } from './dummyData';

const MessengerChat = () => {
  const [contacts, setContacts] = useState(initialContacts);
  const [messages, setMessages] = useState(initialMessages);
  const [selectedContact, setSelectedContact] = useState(initialContacts[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [assignments, setAssignments] = useState({});
  const [aiMode, setAiMode] = useState({});
  const [isSimulating, setIsSimulating] = useState({});
  const clientSimulationTimeouts = useRef({});
  const aiReplyTimeouts = useRef({});

  // State for AI tools panel
  const [showAITools, setShowAITools] = useState(true);
  const [activeAITool, setActiveAITool] = useState('summary'); // 'summary' or 'quickReplies'

  // Predefined client messages for simulation
  const clientMessages = [
    "Can you help me with pricing?",
    "I'm interested in your services. What do you offer?",
    "Do you have any discounts available?",
    "Can we schedule a demo?",
    "What's included in your premium package?",
    "How does your support work?",
    "I need more information about implementation.",
    "What are your payment terms?",
    "Can you customize the solution for our needs?",
    "How long does the setup process take?"
  ];

  // Predefined AI responses
  const aiResponses = [
    "Sure! Our pricing starts from $99/month for the premium package with all features included.",
    "I'd be happy to help! We offer comprehensive business solutions including project management, analytics, and team collaboration tools.",
    "Yes! We have a 20% discount for annual subscriptions and special rates for startups.",
    "Absolutely! I can schedule a personalized demo for you. What time works best?",
    "Our premium package includes unlimited projects, advanced analytics, priority support, and custom integrations.",
    "We provide 24/7 priority support with dedicated account managers for all premium customers.",
    "Our implementation typically takes 1-2 weeks with full onboarding support and training included.",
    "We offer flexible payment terms including monthly, quarterly, and annual billing options.",
    "Yes! We specialize in custom solutions tailored to your specific business needs and requirements.",
    "Setup is usually completed within 24-48 hours, and we'll guide you through every step of the process."
  ];

  // Filter contacts based on search term and sort by most recent activity
  const filteredContacts = contacts
    .filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by timestamp - most recent first
      const aTime = new Date(a.lastUpdated || '2024-01-01');
      const bTime = new Date(b.lastUpdated || '2024-01-01');
      return bTime - aTime;
    });

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    // Auto-assign to "Me" if AI mode is enabled for this contact
    if (aiMode[contact.id]) {
      setAssignments(prev => ({
        ...prev,
        [contact.id]: 'Me'
      }));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedContact) {
      const userMsg = {
        id: Date.now(),
        sender: 'customer',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false
      };

      // Add user message to chat
      setMessages(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), userMsg]
      }));

      // Update contact's last message and timestamp
      updateContactPreview(selectedContact.id, newMessage);
      
      const messageText = newMessage;
      setNewMessage('');

      // If AI Mode is enabled, trigger auto-reply after 1.5 seconds
      if (aiMode[selectedContact.id]) {
        aiReplyTimeouts.current[selectedContact.id] = setTimeout(() => {
          sendAiReply(selectedContact.id);
        }, 1500);
      }
    }
  };

  const handleAssignContact = (agent) => {
    setAssignments(prev => ({
      ...prev,
      [selectedContact.id]: agent
    }));
    console.log(`Assigned ${selectedContact.name} to ${agent}`);
  };

  // Toggle AI Mode for current contact
  const toggleAiMode = () => {
    if (!selectedContact) return;
    
    const contactId = selectedContact.id;
    const newAiMode = !aiMode[contactId];
    
    setAiMode(prev => ({
      ...prev,
      [contactId]: newAiMode
    }));

    if (newAiMode) {
      // Auto-assign to "Me" when AI mode is enabled
      setAssignments(prev => ({
        ...prev,
        [contactId]: 'Me'
      }));
      
      // Start client message simulation
      startClientSimulation(contactId);
    } else {
      // Stop simulation when AI mode is disabled
      stopClientSimulation(contactId);
    }
  };

  // Start simulating client messages
  const startClientSimulation = (contactId) => {
    if (isSimulating[contactId]) return;
    
    setIsSimulating(prev => ({ ...prev, [contactId]: true }));
    
    const simulateMessage = () => {
      if (!aiMode[contactId]) return;
      
      const randomMessage = clientMessages[Math.floor(Math.random() * clientMessages.length)];
      const newMsg = {
        id: Date.now(),
        sender: 'customer',
        message: randomMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false
      };

      // Add client message
      setMessages(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), newMsg]
      }));

      // Update contact preview
      updateContactPreview(contactId, randomMessage);

      // Trigger AI auto-reply after 1.5 seconds
      aiReplyTimeouts.current[contactId] = setTimeout(() => {
        sendAiReply(contactId);
      }, 1500);

      // Schedule next client message (3-8 seconds)
      const nextDelay = 3000 + Math.random() * 5000;
      clientSimulationTimeouts.current[contactId] = setTimeout(simulateMessage, nextDelay);
    };

    // Start first simulation after 3 seconds
    clientSimulationTimeouts.current[contactId] = setTimeout(simulateMessage, 3000);
  };

  // Stop client message simulation
  const stopClientSimulation = (contactId) => {
    setIsSimulating(prev => ({ ...prev, [contactId]: false }));
    
    if (clientSimulationTimeouts.current[contactId]) {
      clearTimeout(clientSimulationTimeouts.current[contactId]);
      delete clientSimulationTimeouts.current[contactId];
    }
    
    if (aiReplyTimeouts.current[contactId]) {
      clearTimeout(aiReplyTimeouts.current[contactId]);
      delete aiReplyTimeouts.current[contactId];
    }
  };

  // Send AI auto-reply
  const sendAiReply = (contactId) => {
    if (!aiMode[contactId]) return;
    
    const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    const newMsg = {
      id: Date.now() + 1, // Ensure unique ID
      sender: 'ai',
      message: randomResponse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };

    // Add AI reply
    setMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg]
    }));

    // Update contact preview
    updateContactPreview(contactId, randomResponse);
  };

  // Update contact preview and sort contacts
  const updateContactPreview = (contactId, lastMessage) => {
    setContacts(prev => prev.map(contact => {
      if (contact.id === contactId) {
        return {
          ...contact,
          lastMessage: lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage,
          timestamp: 'now',
          lastUpdated: new Date().toISOString()
        };
      }
      return contact;
    }));
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(clientSimulationTimeouts.current).forEach(clearTimeout);
      Object.values(aiReplyTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Handle quick reply selection
  const handleQuickReplySelect = (message) => {
    setNewMessage(message);
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex h-full">
        {/* Left Panel - Contact List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              AI Sales Conversations
            </h2>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                isSelected={selectedContact?.id === contact.id}
                onClick={handleContactSelect}
              />
            ))}
          </div>
        </div>

        {/* Middle Panel - Chat Window */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={selectedContact.avatar}
                      alt={selectedContact.name}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {selectedContact.name}
                        </h3>
                        <AssignToDropdown
                          onAssign={handleAssignContact}
                          currentAssignment={assignments[selectedContact.id]}
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        {selectedContact.isOnline ? 'Online' : `Last seen ${selectedContact.timestamp} ago`}
                      </p>
                      {assignments[selectedContact.id] && (
                        <p className="text-xs text-blue-600 mt-1">
                          Assigned to {assignments[selectedContact.id]}
                          {aiMode[selectedContact.id] && (
                            <span className="ml-2 text-green-600">• AI Mode Active</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* AI Mode Toggle */}
                  <button
                    onClick={toggleAiMode}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      aiMode[selectedContact.id]
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {aiMode[selectedContact.id] ? (
                      <>
                        <Bot className="w-4 h-4" />
                        AI Mode ON
                      </>
                    ) : (
                      <>
                        <BotOff className="w-4 h-4" />
                        AI Mode OFF
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages[selectedContact.id]?.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isAI={message.sender === 'ai'}
                  />
                ))}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a contact to view AI sales conversations</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - AI Tools and Profile - FIXED LAYOUT */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
          {/* AI Tools Section */}
          <div className="border-b border-gray-200">
            {/* AI Tools Header */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">AI Assistant</h3>
                <button 
                  onClick={() => setShowAITools(!showAITools)}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  {showAITools ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
              
              {showAITools && (
                <div className="flex border-b border-gray-100 mt-2">
                  <button
                    onClick={() => setActiveAITool('summary')}
                    className={`flex-1 py-2 text-sm font-medium ${
                      activeAITool === 'summary' 
                        ? 'text-blue-600 border-b-2 border-blue-500' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setActiveAITool('quickReplies')}
                    className={`flex-1 py-2 text-sm font-medium ${
                      activeAITool === 'quickReplies' 
                        ? 'text-blue-600 border-b-2 border-blue-500' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Quick Replies
                  </button>
                </div>
              )}
            </div>
            
            {/* AI Tools Content - Fixed Height */}
            {showAITools && (
              <div className="h-64 overflow-y-auto p-3">
                {activeAITool === 'summary' ? (
                  <ChatSummary 
                    contact={selectedContact} 
                    messages={messages[selectedContact?.id] || []} 
                    isVisible={true}
                    onToggle={() => {}}
                  />
                ) : (
                  <QuickReplies 
                    onSelectReply={handleQuickReplySelect}
                    isVisible={true}
                    onToggle={() => {}}
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Profile Section - Takes remaining space */}
          <div className="flex-1 overflow-y-auto">
            <ProfileSidebar contact={selectedContact} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessengerChat;