import React, { useEffect, useState } from 'react';
import ChatList from '../whatsapp/ChatList';
import ChatWindow from '../whatsapp/ChatWindow';
import ChatFilter from '../whatsapp/ChatFilter';
import CustomerDetails from '../whatsapp/CustomerDetails';
import { apiFetch } from '../../../../lib/api';

// NOTE: This mirrors WhatsApp UI to keep consistent UX. Replace mock data with real IG DM data later.
function InstagramChat() {
  const [chats, setChats] = useState([
    { id: 101, name: 'IG User One', lastMessage: 'Hey! Loved your post 🔥', time: '10:12 AM', status: 'Active', lastMessageTime: Date.now() - 3600000 },
    { id: 102, name: 'IG Creator', lastMessage: 'Can we collaborate?', time: 'Yesterday', status: 'Assign to me', lastMessageTime: Date.now() - 86400000 },
    { id: 103, name: 'New Lead', lastMessage: 'DM from story reply', time: '2 days ago', status: 'Paused', lastMessageTime: Date.now() - 172800000 },
  ]);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [aiMode, setAiMode] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // OAuth URL (provided)
  const IG_OAUTH_URL = 'https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1477959410285896&redirect_uri=https://work-flow-render.onrender.com/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights';

  // Auto-capture user_id from redirect query if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('user_id');
      if (id) setUserId(id);
    } catch {}
  }, []);

  // Automation states
  const [userId, setUserId] = useState(''); // supply ig user id from auth redirect or input
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [autoMessage, setAutoMessage] = useState('Hi! How are you doing?');
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Basic seed messages when a chat is opened (mock)
  useEffect(() => {
    if (activeChat) {
      setMessages([
        { id: 1, sender: 'other', text: 'Thanks for reaching out on Instagram!', time: '9:58 AM' },
        { id: 2, sender: 'me', text: 'Hi! How can we help you today?', time: '10:01 AM' },
      ]);
    }
  }, [activeChat]);

  const updateChatLastMessage = (chatId, message, time) => {
    const updated = chats.map(c => c.id === chatId ? { ...c, lastMessage: message, time, lastMessageTime: Date.now() } : c);
    updated.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    setChats(updated);
  };

  const handleSendMessage = (text) => {
    const newMsg = { id: messages.length + 1, sender: 'me', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    if (activeChat) updateChatLastMessage(activeChat.id, text, newMsg.time);
  };

  const handleStatusChange = (chatId, newStatus) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, status: newStatus } : c));
    if (activeChat?.id === chatId) setActiveChat({ ...activeChat, status: newStatus });
  };

  // Placeholder customer details; reuse WhatsApp structure to keep UI consistent
  const customerDetails = {
    101: { name: 'IG User One', email: 'user.one@instagram.test', phone: '', location: '—', company: '', timezone: '—', lastSeen: 'Just now', joinedDate: '—', totalPurchases: 0, lifetimeValue: '$0', preferredLanguage: '—', customerSince: '—', tags: ['Instagram'], notes: 'Imported from IG DMs', recentOrders: [] },
    102: { name: 'IG Creator', email: 'creator@instagram.test', phone: '', location: '—', company: '', timezone: '—', lastSeen: '1h ago', joinedDate: '—', totalPurchases: 0, lifetimeValue: '$0', preferredLanguage: '—', customerSince: '—', tags: ['Instagram'], notes: 'Potential collab', recentOrders: [] },
    103: { name: 'New Lead', email: 'lead@instagram.test', phone: '', location: '—', company: '', timezone: '—', lastSeen: '2d ago', joinedDate: '—', totalPurchases: 0, lifetimeValue: '$0', preferredLanguage: '—', customerSince: '—', tags: ['Instagram'], notes: 'Came from story reply', recentOrders: [] },
  };

  const fetchPosts = async () => {
    if (!userId) return;
    try {
      setLoadingPosts(true);
      setSaveMsg('');
      const resp = await apiFetch(`/api/instagram/posts?userId=${encodeURIComponent(userId)}`);
      const data = await resp.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const saveAutomation = async () => {
    if (!userId || !selectedPostId || !autoMessage) return;
    try {
      setSaving(true);
      setSaveMsg('');
      const resp = await apiFetch('/api/instagram/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, postId: selectedPostId, keyword, response: autoMessage })
      });
      const data = await resp.json();
      if (data && data.success) setSaveMsg('Automation saved. Comments will trigger an auto-DM.');
      else setSaveMsg(data?.error || 'Save failed');
    } catch (e) {
      setSaveMsg('Save error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 border-r border-gray-200 flex flex-col h-full">
        {/* Automation Setup */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Instagram Automation</h3>
            <a href={IG_OAUTH_URL} className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700" target="_blank" rel="noreferrer">
              Connect Instagram
            </a>
          </div>
          <div className="space-y-2">
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Instagram User ID"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <button onClick={fetchPosts} className="px-2 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-50" disabled={!userId || loadingPosts}>
                {loadingPosts ? 'Fetching…' : 'Fetch Posts'}
              </button>
              <select className="flex-1 border rounded px-2 py-1 text-sm" value={selectedPostId} onChange={e => setSelectedPostId(e.target.value)}>
                <option value="">Select a post</option>
                {posts.map(p => (
                  <option key={p.id} value={p.id}>{p.caption?.slice(0,40) || p.id}</option>
                ))}
              </select>
            </div>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Keyword (optional)"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <textarea
              className="w-full border rounded px-2 py-1 text-sm"
              rows={2}
              placeholder="Auto DM message"
              value={autoMessage}
              onChange={e => setAutoMessage(e.target.value)}
            />
            <button onClick={saveAutomation} className="w-full px-2 py-1 text-sm rounded bg-green-600 text-white disabled:opacity-50" disabled={!userId || !selectedPostId || saving}>
              {saving ? 'Saving…' : 'Save Automation'}
            </button>
            {saveMsg && <p className="text-xs text-gray-600">{saveMsg}</p>}
          </div>
        </div>

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
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
          />
        </div>
      </div>

      {/* Chat Window */}
      <ChatWindow
        activeChat={activeChat ? { ...activeChat, status: chats.find(c => c.id === activeChat.id)?.status } : null}
        messages={messages}
        onSendMessage={handleSendMessage}
        aiMode={aiMode}
        onToggleAI={() => setAiMode(!aiMode)}
        onStatusChange={handleStatusChange}
        isDetailsOpen={isDetailsOpen}
        onToggleDetails={() => setIsDetailsOpen(!isDetailsOpen)}
      />

      {/* Details */}
      {activeChat && (
        <CustomerDetails
          customer={customerDetails[activeChat.id]}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          messages={messages}
        />
      )}
    </div>
  );
}

export default InstagramChat;