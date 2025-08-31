import React, { useEffect, useState } from 'react';
import ChatList from '../whatsapp/ChatList';
import ChatWindow from '../whatsapp/ChatWindow';
import ChatFilter from '../whatsapp/ChatFilter';
import CustomerDetails from '../whatsapp/CustomerDetails';
import { apiFetch } from '../../../../lib/api';
import toast from 'react-hot-toast';

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
  const [manualRecipient, setManualRecipient] = useState('');

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
  const [postComments, setPostComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
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

  const handleSendMessage = async (text) => {
    const newMsg = { id: messages.length + 1, sender: 'me', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    if (activeChat) updateChatLastMessage(activeChat.id, text, newMsg.time);
    // Send to backend if username present and userId set
    try {
      const rawUsername = activeChat?.name || manualRecipient;
      const username = String(rawUsername || '').trim().replace(/^@+/, '');
      if (userId && username) {
        const resp = await apiFetch('/api/instagram/send-dm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, username, message: text })
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data?.error) {
          throw new Error(data?.error || 'Send failed');
        }
        toast.success(`Sent to @${username}`);
      } else if (!userId) {
        toast('Connect Instagram first', { icon: 'ℹ️' });
      } else {
        toast('Enter a username to DM', { icon: 'ℹ️' });
      }
    } catch (e) {
      toast.error(e.message || 'Failed to send');
    }
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

  const fetchComments = async (pid) => {
    if (!userId || !pid) return;
    try {
      setLoadingComments(true);
      const resp = await apiFetch(`/api/instagram/comments?userId=${encodeURIComponent(userId)}&postId=${encodeURIComponent(pid)}`);
      const data = await resp.json();
      setPostComments(Array.isArray(data) ? data : []);
    } catch {
      setPostComments([]);
    } finally {
      setLoadingComments(false);
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
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Recipient username (e.g., @creator)"
              value={manualRecipient}
              onChange={e => setManualRecipient(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <button onClick={fetchPosts} className="px-2 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-50" disabled={!userId || loadingPosts}>
                {loadingPosts ? 'Fetching…' : 'Fetch Posts'}
              </button>
            </div>
            {/* Posts grid */}
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-auto">
              {posts.map(p => (
                <button key={p.id} onClick={() => { setSelectedPostId(p.id); fetchComments(p.id); }} className={`border rounded overflow-hidden text-left ${selectedPostId===p.id ? 'ring-2 ring-indigo-500' : ''}`}>
                  <img src={p.media_url} alt={p.caption?.slice(0,40) || 'post'} className="w-full h-20 object-cover" />
                  <div className="p-1 text-[10px] text-gray-700 truncate">{p.caption || p.id}</div>
                </button>
              ))}
            </div>
            {/* Comments list for selected post */}
            {selectedPostId && (
              <div className="mt-2 border rounded p-2 bg-white">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-gray-700">Comments</div>
                  <button onClick={() => fetchComments(selectedPostId)} className="text-xs text-indigo-600">{loadingComments ? '…' : 'Refresh'}</button>
                </div>
                <div className="max-h-36 overflow-auto mt-1 space-y-1">
                  {postComments.length === 0 && (
                    <div className="text-xs text-gray-500">No comments.</div>
                  )}
                  {postComments.map(c => (
                    <div key={c.id} className="text-xs text-gray-800 flex items-start gap-2">
                      <div className="font-medium">@{c.username}</div>
                      <div className="flex-1">{c.text}</div>
                      <button onClick={() => setActiveChat({ id: c.username || c.id, name: (c.username || '').trim().replace(/^@+/, '') || manualRecipient, lastMessage: '', time: '' })} className="text-[10px] px-2 py-0.5 border rounded">DM</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            title="Instagram Chats"
            theme="instagram"
          />
        </div>
        {/* Chat List */}
        <div className="flex-1 overflow-hidden">
          <ChatList
            chats={Array.isArray(chats) ? chats : []}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            searchTerm={searchTerm || ''}
            statusFilter={statusFilter || 'All'}
            theme="instagram"
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
        theme="instagram"
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