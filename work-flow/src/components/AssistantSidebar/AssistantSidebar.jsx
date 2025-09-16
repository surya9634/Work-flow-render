import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_URL, apiFetch } from '../../lib/api';

// Right-side assistant sidebar similar to Brave's, minimal UI impact
export default function AssistantSidebar() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {id, role: 'user'|'assistant'|'system', content}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Small memory of page context
  const pageContext = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const title = document.title || '';
    const url = window.location.href || '';
    return `Page: ${title}\nURL: ${url}`;
  }, []);

  useEffect(() => {
    // Preload with a greeting when first opened
    if (open && messages.length === 0) {
      setMessages([
        { id: 'sys1', role: 'system', content: 'You are an AI assistant pinned to the right sidebar. Help briefly and clearly.' },
        { id: 'as1', role: 'assistant', content: 'Hi! I\'m here to help. Ask about this page or anything else.' },
      ]);
    }
  }, [open]);

  const sendText = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setError('');
    const uid = `u_${Date.now()}`;
    setMessages(prev => [...prev, { id: uid, role: 'user', content: text }]);
    setLoading(true);
    try {
      // Reuse existing simple AI endpoint
      const res = await apiFetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${pageContext}\n\nUser: ${text}` })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'AI request failed');
      const replyText = data.text || 'No response';
      setMessages(prev => [...prev, { id: `a_${Date.now()}`, role: 'assistant', content: replyText }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    // Display file names locally; hook up to backend when upload endpoint is ready
    const names = Array.from(files).map(f => f.name).join(', ');
    setMessages(prev => [
      ...prev,
      { id: `u_file_${Date.now()}`, role: 'user', content: `Attached files: ${names}` },
    ]);
    // TODO: Integrate with backend file upload endpoint when available
  };

  return (
    <>
      {/* Narrow toggle on the right edge */}
      <button
        aria-label="Toggle Assistant"
        onClick={() => setOpen(o => !o)}
        className="fixed top-1/2 -translate-y-1/2 right-0 z-[60] bg-gradient-to-b from-indigo-600 to-blue-600 text-white px-2 py-3 rounded-l-md shadow hover:opacity-90"
      >
        AI
      </button>

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-screen w-[28rem] max-w-[90vw] bg-white border-l border-gray-200 z-[59] transition-transform duration-300 ease-in-out shadow-xl flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="font-semibold">Assistant</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const selection = typeof window !== 'undefined' ? String(window.getSelection?.() || '') : '';
                if (selection) setInput(prev => (prev ? prev + '\n' : '') + `Selected: ${selection}`);
              }}
              className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
            >
              Use selection
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div className={`inline-block max-w-[85%] whitespace-pre-wrap text-sm rounded-lg px-3 py-2 ${m.role === 'user' ? 'bg-indigo-600 text-white' : m.role === 'assistant' ? 'bg-gray-100 text-gray-900' : 'bg-amber-50 text-amber-900'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>

        {/* Composer */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-end gap-2">
            <button
              onClick={handleAttachClick}
              className="px-2 py-2 border rounded hover:bg-gray-50 text-sm"
              title="Attach files"
            >
              📎
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about this page or anything..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm min-h-[42px] max-h-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendText}
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:bg-gray-300"
            >
              {loading ? '...' : 'Send'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
          <div className="flex justify-between mt-2">
            <button
              onClick={() => setMessages([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
            <button
              onClick={() => setInput(prev => (prev ? prev + '\n' : '') + pageContext)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Add page context
            </button>
          </div>
        </div>
      </div>
    </>
  );
}