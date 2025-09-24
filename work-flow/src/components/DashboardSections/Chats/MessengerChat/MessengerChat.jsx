import React, { useState, useEffect, useRef } from 'react';

// AutoScroll helper: scrolls chat container to bottom when messages change
const AutoScroll = ({ conversationId, messages }) => {
  useEffect(() => {
    const el = document.getElementById('chat-scroll-container');
    if (!el) return;
    // Smooth scroll to bottom
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [conversationId, messages?.length]);
  return null;
};
import { Search, Send, Paperclip, Smile, Bot, BotOff, ChevronUp, ChevronDown } from 'lucide-react';
import ContactItem from './ContactItem';
import MessageBubble from './MessageBubble';
import ProfileSidebar from './ProfileSidebar';
import AssignToDropdown from './AssignToDropdown';
import ChatSummary from './ChatSummary';
import QuickReplies from './QuickReplies';
// Real data endpoints
const API_BASE = (import.meta?.env?.VITE_MESSENGER_API_URL || import.meta?.env?.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
const HAS_REMOTE_PROMPT = Boolean(import.meta?.env?.VITE_MESSENGER_API_URL);

const MessengerChat = () => {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({}); // { convId: [{id,sender,text,timestamp}] }
  const [loadingMessages, setLoadingMessages] = useState({}); // convId -> boolean
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [assignments, setAssignments] = useState({});
  const [aiMode, setAiMode] = useState({});
  const [systemPrompts, setSystemPrompts] = useState({}); // convId -> system prompt text
  const [isSimulating, setIsSimulating] = useState({});
  const clientSimulationTimeouts = useRef({});
  const aiReplyTimeouts = useRef({});

  // State for AI tools panel
  const [showAITools, setShowAITools] = useState(true);
  const [activeAITool, setActiveAITool] = useState('summary'); // 'summary' | 'quickReplies' | 'ask'
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiAnswerSources, setAiAnswerSources] = useState([]);
  const [aiAnswerLoading, setAiAnswerLoading] = useState(false);

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

  // Load conversations once
  useEffect(() => {
    let ignore = false;
    async function loadConversations() {
      try {
        setLoading(true);

        // Check if Facebook is connected and sync if needed
        try {
          const statusRes = await fetch(`${API_BASE}/api/integrations/status`);
          const statusData = await statusRes.json();
          if (statusRes.ok && statusData.facebook?.connected) {
            // Sync Messenger conversations from Facebook
            await fetch(`${API_BASE}/api/messenger/sync`, { method: 'POST' });
          }
        } catch (syncErr) {
          console.warn('FB sync failed:', syncErr);
        }

        const res = await fetch(`${API_BASE}/api/messenger/conversations`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load conversations');
        if (ignore) return;
        const normalized = data.map(c => ({
          id: c.id,
          name: c.name,
          avatar: c.profilePic || `https://unavatar.io/${encodeURIComponent(c.name)}`,
          lastMessage: c.lastMessage || '',
          timestamp: 'now',
          isOnline: true,
          lastUpdated: c.timestamp || new Date().toISOString(),
        }));
        setContacts(normalized);
        if (normalized[0]) setSelectedContact(normalized[0]);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
    return () => { ignore = true; };
  }, []);

  // Load messages when a contact is selected
  useEffect(() => {
    let ignore = false;
    async function loadMessages(convId) {
      try {
        if (!convId) return;
        setLoadingMessages(prev => ({ ...prev, [convId]: true }));
        const res = await fetch(`${API_BASE}/api/messenger/messages?conversationId=${encodeURIComponent(convId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load messages');
        if (ignore) return;
        const arr = Array.isArray(data) ? data : (data.messages || []);
        let sysPrompt = Array.isArray(data) ? '' : (data.systemPrompt || '');
        const aiEnabled = Array.isArray(data) ? false : Boolean(data.aiMode);
        if (aiEnabled) {
          setAiMode(prev => ({ ...prev, [convId]: true }));
        }
        // Fallback: read from localStorage if backend didn't provide it
        if (!sysPrompt) {
          try { sysPrompt = localStorage.getItem(`wf_sys_prompt_${convId}`) || ''; } catch {}
        }
        if (sysPrompt) {
          setSystemPrompts(prev => ({ ...prev, [convId]: sysPrompt }));
        }
        // Normalize timestamps to always display HH:mm only
        const normalized = (arr || []).map(m => ({
          ...m,
          // Keep raw ISO in a separate field if needed for sorting later
          _iso: m.timestamp,
          timestamp: (() => {
            const d = new Date(m.timestamp);
            return isNaN(d.getTime()) ? (m.timestamp || '') : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          })()
        }));
        setMessages(prev => ({ ...prev, [convId]: normalized }));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingMessages(prev => ({ ...prev, [convId]: false }));
      }
    }
    if (selectedContact?.id && !messages[selectedContact.id]) {
      loadMessages(selectedContact.id);
    }
    // Subscribe to realtime message events
    let socket;
    try {
      // dynamic import to avoid SSR issues
      import('socket.io-client').then(({ io }) => {
        if (ignore) return;
        // Allow websocket with fallback to polling for hosts/proxies that don't support WS upgrade
        socket = io(API_BASE, { transports: ['websocket', 'polling'], withCredentials: false });
        socket.on('connect', () => { try { console.debug('[socket.io] connected', socket.id); } catch (_) {} });
        socket.on('connect_error', (err) => { try { console.warn('[socket.io] connect_error', err?.message); } catch (_) {} });
        socket.on('error', (err) => { try { console.warn('[socket.io] error', err?.message); } catch (_) {} });
        socket.on('messenger:message_created', (payload) => {
          if (!payload?.conversationId || !payload?.message) return;
          const incoming = payload.message;
          const normalized = {
            ...incoming,
            // unify payload shape (some places use `text`, others `message`)
            text: (incoming.text ?? incoming.message ?? ''),
            _iso: incoming.timestamp,
            timestamp: (() => {
              const d = new Date(incoming.timestamp);
              return isNaN(d.getTime()) ? (incoming.timestamp || '') : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            })()
          };
          setMessages(prev => {
            const arr = prev[payload.conversationId] || [];
            if (arr.some(m => m.id === normalized.id)) return prev; // avoid duplicates
            return { ...prev, [payload.conversationId]: [...arr, normalized] };
          });
          // Update contact preview and bump ordering
          const preview = normalized.text || normalized.message || '';
          updateContactPreview(payload.conversationId, preview);

          // Auto-trigger backend AI reply when AI Mode is ON and a customer message arrives
          // NOTE: Server already auto-replies for customer messages when enabled.
          // To avoid double replies, do not trigger client-side when provider is local.
          try {
            const convId = payload.conversationId;
            const isCustomer = String(normalized.sender).toLowerCase() === 'customer';
            const isRemoteProvider = Boolean(import.meta?.env?.VITE_MESSENGER_API_URL); // remote FB uses webhook, safe to skip
            if (isCustomer && aiMode[convId] && isRemoteProvider) {
              const lastUserMessage = normalized.text || '';
              const systemPrompt = systemPrompts[convId] || '';
              if (lastUserMessage.trim()) {
                fetch(`${API_BASE}/api/messenger/ai-reply`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ conversationId: convId, lastUserMessage, systemPrompt })
                }).catch(() => {});
              }
            }
          } catch (_) {}
        });
        socket.on('messenger:conversation_created', (conv) => {
          if (!conv?.id) return;
          const normalized = {
            id: conv.id,
            name: conv.name,
            avatar: conv.profilePic || `https://unavatar.io/${encodeURIComponent(conv.name || 'user')}`,
            lastMessage: conv.lastMessage || '',
            timestamp: 'now',
            isOnline: true,
            lastUpdated: conv.timestamp || new Date().toISOString(),
          };
          setContacts(prev => [normalized, ...prev]);
        });
        // When backend reports bulk sync, refresh the list automatically
        socket.on('messenger:conversations_synced', async () => {
          try {
            const res = await fetch(`${API_BASE}/api/messenger/conversations`);
            const data = await res.json();
            if (!Array.isArray(data)) return;
            const normalized = data.map(c => ({
              id: c.id,
              name: c.name,
              avatar: c.profilePic || `https://unavatar.io/${encodeURIComponent(c.name)}`,
              lastMessage: c.lastMessage || '',
              timestamp: 'now',
              isOnline: true,
              lastUpdated: c.timestamp || new Date().toISOString(),
            }));
            setContacts(normalized);
          } catch (_) {}
        });
      });
    } catch (_) {}
    return () => {
      ignore = true;
      if (socket) socket.close();
    };
  }, [selectedContact?.id]);

  // Filter contacts based on search term and sort by most recent activity
  const filteredContacts = contacts
    .filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;
    const messageText = newMessage;
    setNewMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/messenger/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedContact.id, text: messageText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send message');
      const msgId = data?.message?.id;
      const userMsg = { id: msgId, sender: 'agent', text: messageText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isRead: true };
      // Add locally only if socket hasn't already added it
      setMessages(prev => {
        const arr = prev[selectedContact.id] || [];
        if (msgId && arr.some(m => m.id === msgId)) return prev; // avoid duplicates
        return { ...prev, [selectedContact.id]: [...arr, userMsg] };
      });
      updateContactPreview(selectedContact.id, messageText);
      // Do NOT trigger AI reply on agent send; server handles auto-replies for customer messages
    } catch (err) {
      setError(err.message);
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
  const toggleAiMode = async () => {
    if (!selectedContact) return;
    const contactId = selectedContact.id;
    const newAiMode = !aiMode[contactId];

    // Optimistic UI update
    setAiMode(prev => ({ ...prev, [contactId]: newAiMode }));

    try {
      await fetch(`${API_BASE}/api/messenger/ai-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: contactId, enabled: newAiMode })
      });
    } catch (_) {}

    if (newAiMode) {
      setAssignments(prev => ({ ...prev, [contactId]: 'Me' }));
      startClientSimulation(contactId);
    } else {
      stopClientSimulation(contactId);
    }
  };

  // Start simulating client messages
  const startClientSimulation = (contactId) => {
    if (isSimulating[contactId]) return;
    
    setIsSimulating(prev => ({ ...prev, [contactId]: true }));
    
    const simulateMessage = async () => {
      if (!aiMode[contactId]) return;
      const randomMessage = clientMessages[Math.floor(Math.random() * clientMessages.length)];
      try {
        // Post customer message to backend so it persists and triggers server auto-reply
        await fetch(`${API_BASE}/api/messenger/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: contactId, text: randomMessage, sender: 'customer' })
        });
      } catch (_) {}
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
            {(filteredContacts || []).map((contact) => (
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-scroll-container">
                {loadingMessages[selectedContact.id] ? (
                  <div className="text-center text-gray-400">Loading messages...</div>
                ) : (
                  (messages[selectedContact.id] || []).map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isAI={message.sender === 'ai'}
                    />
                  ))
                )}
              </div>

              {/* Auto-scroll to bottom when new messages arrive */}
              <AutoScroll conversationId={selectedContact.id} messages={(messages[selectedContact.id] || [])} />

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
                  <button
                    onClick={() => setActiveAITool('ask')}
                    className={`flex-1 py-2 text-sm font-medium ${
                      activeAITool === 'ask' 
                        ? 'text-blue-600 border-b-2 border-blue-500' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Ask AI
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
                ) : activeAITool === 'quickReplies' ? (
                  <QuickReplies 
                    onSelectReply={handleQuickReplySelect}
                    isVisible={true}
                    onToggle={() => {}}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Ask the Global AI about business, products (campaigns), analytics, or any dashboard data.
                    </div>
                    <textarea
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      className="w-full h-24 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., What are our top products? How many messages were received today?"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        onClick={async () => {
                          if (!aiQuestion.trim()) return;
                          setAiAnswerLoading(true);
                          setAiAnswer('');
                          setAiAnswerSources([]);
                          try {
                            const url = `${API_BASE}/api/global-ai/answer`;
                            const res = await fetch(url, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: aiQuestion, userId: selectedContact?.id || 'dashboard', conversationId: selectedContact?.id || '' })
                            });
                            const ct = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
                            if (!ct.includes('application/json')) {
                              const txt = await res.text();
                              throw new Error(`Server returned non-JSON from ${url}: ${String(txt).slice(0,160)}`);
                            }
                            const data = await res.json();
                            if (res.ok && data?.success) {
                              setAiAnswer(data.reply || '');
                              setAiAnswerSources(Array.isArray(data.sources) ? data.sources : []);
                            } else {
                              setAiAnswer(`Failed to get answer${data?.error ? `: ${data.error}` : ''}.`);
                            }
                          } catch (_) {
                            setAiAnswer('Failed to get answer. Ensure API URL points to backend.');
                          } finally {
                            setAiAnswerLoading(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        disabled={aiAnswerLoading}
                      >
                        {aiAnswerLoading ? 'Thinking...' : 'Ask'}
                      </button>
                      {aiAnswerSources.length > 0 && (
                        <div className="text-xs text-gray-500">Sources: {aiAnswerSources.join(', ')}</div>
                      )}
                    </div>
                    {aiAnswer && (
                      <div className="p-2 bg-gray-50 rounded border text-sm whitespace-pre-wrap">
                        {aiAnswer}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Profile Section - Takes remaining space */}
          <div className="flex-1 overflow-y-auto">
            {/* System Prompt Editor */}
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">System Prompt</h3>
              <textarea
                className="w-full h-28 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., You are a sales assistant for ACME. Be concise, helpful, and friendly."
                value={systemPrompts[selectedContact?.id] || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  const id = selectedContact?.id;
                  if (!id) return;
                  setSystemPrompts(prev => ({ ...prev, [id]: v }));
                }}
              />
              <div className="mt-2 text-right">
                <button
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                  onClick={async () => {
                    if (!selectedContact?.id) return;
                    const convId = selectedContact.id;
                    const prompt = systemPrompts[convId] || '';
                    try {
                      const res = await fetch(`${API_BASE}/api/messenger/system-prompt`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ conversationId: convId, systemPrompt: prompt })
                      });
                      if (!res.ok) throw new Error('save_failed');
                    } catch {}
                    // Also persist locally for UI restore
                    try { localStorage.setItem(`wf_sys_prompt_${convId}`, prompt); } catch {}
                  }}
                >
                  Enter
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Used when AI Mode is ON to guide replies for this conversation.</p>
            </div>

            <ProfileSidebar contact={selectedContact} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessengerChat;