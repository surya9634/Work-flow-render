import React, { useEffect, useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import ChatFilter from './ChatFilter';
import CustomerDetails from './CustomerDetails';

// Use same-origin by default or Vite env override
const API_BASE = (import.meta?.env?.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

function WhatsappChat() {
  const [chats, setChats] = useState([]); // [{id,name,lastMessage,time,status,lastMessageTime}]
  const [selectedChat, setSelectedChat] = useState(null);
  const [messagesByConv, setMessagesByConv] = useState({}); // convId -> []
  const [loadingMessages, setLoadingMessages] = useState({}); // convId -> boolean
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [aiModeByConv, setAiModeByConv] = useState({}); // convId -> boolean
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // Load WhatsApp conversations from backend (filter by id starting with wa_)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messenger/conversations`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load conversations');
        if (ignore) return;
        const waConvs = (Array.isArray(data) ? data : []).filter(c => String(c.id || '').startsWith('wa_'));
        const normalized = waConvs.map(c => ({
          id: c.id,
          name: c.name || c.username || 'WhatsApp User',
          lastMessage: c.lastMessage || '',
          time: '',
          status: 'Active',
          lastMessageTime: Date.parse(c.timestamp || '') || Date.now(),
        })).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        setChats(normalized);
        if (normalized[0]) setSelectedChat(normalized[0]);
      } catch (_) {}
    })();
    return () => { ignore = true; };
  }, []);

  // Load messages for selected chat and subscribe to realtime events
  useEffect(() => {
    let ignore = false;
    let socket;

    async function load(convId) {
      try {
        if (!convId) return;
        setLoadingMessages(prev => ({ ...prev, [convId]: true }));
        const res = await fetch(`${API_BASE}/api/messenger/messages?conversationId=${encodeURIComponent(convId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load messages');
        if (ignore) return;
        const arr = Array.isArray(data) ? data : (data.messages || []);
        const aiEnabled = Array.isArray(data) ? false : Boolean(data.aiMode);
        const normalized = (arr || []).map(m => ({
          ...m,
          _iso: m.timestamp,
          timestamp: (() => {
            const d = new Date(m.timestamp);
            return isNaN(d.getTime()) ? (m.timestamp || '') : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          })()
        }));
        setMessagesByConv(prev => ({ ...prev, [convId]: normalized }));
        if (aiEnabled) setAiModeByConv(prev => ({ ...prev, [convId]: true }));
      } catch (_) {
      } finally {
        setLoadingMessages(prev => ({ ...prev, [convId]: false }));
      }
    }

    if (selectedChat?.id && !messagesByConv[selectedChat.id]) {
      load(selectedChat.id);
    }

    // Socket subscribe
    try {
      import('socket.io-client').then(({ io }) => {
        if (ignore) return;
        socket = io(API_BASE, { transports: ['websocket'] });
        socket.on('messenger:message_created', (payload) => {
          if (!payload?.conversationId || !payload?.message) return;
          if (!String(payload.conversationId).startsWith('wa_')) return;
          const incoming = payload.message;
          const normalized = {
            ...incoming,
            text: (incoming.text ?? incoming.message ?? ''),
            _iso: incoming.timestamp,
            timestamp: (() => {
              const d = new Date(incoming.timestamp);
              return isNaN(d.getTime()) ? (incoming.timestamp || '') : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            })()
          };
          setMessagesByConv(prev => {
            const arr = prev[payload.conversationId] || [];
            if (arr.some(m => m.id === normalized.id)) return prev; // avoid duplicates
            return { ...prev, [payload.conversationId]: [...arr, normalized] };
          });
          const preview = normalized.text || '';
          setChats(prev => {
            const next = prev.map(c => c.id === payload.conversationId ? { ...c, lastMessage: preview, lastMessageTime: Date.now() } : c);
            next.sort((a,b)=>b.lastMessageTime - a.lastMessageTime);
            return next;
          });
        });
        socket.on('messenger:conversation_created', (conv) => {
          if (!conv?.id || !String(conv.id).startsWith('wa_')) return;
          const normalized = {
            id: conv.id,
            name: conv.name || 'WhatsApp User',
            lastMessage: conv.lastMessage || '',
            time: '',
            status: 'Active',
            lastMessageTime: Date.parse(conv.timestamp || '') || Date.now(),
          };
          setChats(prev => [normalized, ...prev]);
        });
      });
    } catch {}

    return () => { ignore = true; if (socket) socket.close(); };
  }, [selectedChat?.id]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || !selectedChat) return;
    try {
      const res = await fetch(`${API_BASE}/api/messenger/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedChat.id, text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Send failed');
      const msgId = data?.message?.id || ('wa_local_' + Date.now());
      const userMsg = { id: msgId, sender: 'agent', text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isRead: true };
      setMessagesByConv(prev => {
        const arr = prev[selectedChat.id] || [];
        if (msgId && arr.some(m => m.id === msgId)) return prev; // avoid duplicates
        return { ...prev, [selectedChat.id]: [...arr, userMsg] };
      });
      setChats(prev => {
        const next = prev.map(c => c.id === selectedChat.id ? { ...c, lastMessage: text, lastMessageTime: Date.now() } : c);
        next.sort((a,b)=>b.lastMessageTime - a.lastMessageTime);
        return next;
      });
    } catch (_) {}
  };

  const toggleAiMode = async () => {
    if (!selectedChat) return;
    const convId = selectedChat.id;
    const newVal = !aiModeByConv[convId];
    setAiModeByConv(prev => ({ ...prev, [convId]: newVal }));
    try {
      await fetch(`${API_BASE}/api/messenger/ai-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, enabled: newVal })
      });
    } catch {}
  };

  const activeMessages = selectedChat ? (messagesByConv[selectedChat.id] || []) : [];

  // Minimal customer details derived from chat; can be enhanced
  const customer = selectedChat ? {
    name: selectedChat.name || 'WhatsApp User',
    email: '',
    phone: selectedChat.id?.slice(3) || '',
    location: '',
    company: '',
    timezone: '',
    lastSeen: '',
    joinedDate: '',
    totalPurchases: 0,
    lifetimeValue: '$0',
    preferredLanguage: '',
    customerSince: '',
    tags: ['WhatsApp'],
    notes: '',
    recentOrders: []
  } : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col h-full">
        {/* Filters */}
        <div className="flex-shrink-0">
          <ChatFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
        {/* Chat List */}
        <div className="flex-1 overflow-hidden">
          <ChatList
            chats={chats}
            activeChat={selectedChat}
            onChatSelect={setSelectedChat}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
          />
        </div>
      </div>

      {/* Chat Window */}
      <ChatWindow
        activeChat={selectedChat ? { ...selectedChat, status: selectedChat.status || 'Active' } : null}
        messages={activeMessages}
        onSendMessage={handleSendMessage}
        aiMode={selectedChat ? !!aiModeByConv[selectedChat.id] : false}
        onToggleAI={toggleAiMode}
        onStatusChange={() => {}}
        isDetailsOpen={isDetailsOpen}
        onToggleDetails={() => setIsDetailsOpen(!isDetailsOpen)}
      />

      {/* Customer Details */}
      {selectedChat && (
        <CustomerDetails
          customer={customer}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          messages={activeMessages}
        />
      )}
    </div>
  );
}

export default WhatsappChat;
