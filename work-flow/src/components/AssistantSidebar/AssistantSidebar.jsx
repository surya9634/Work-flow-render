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
    // derive active tab from route path
    const path = window.location.pathname || '';
    let tab = 'Landing';
    if (path.startsWith('/dashboard')) tab = 'Dashboard';
    else if (path === '/admin') tab = 'Admin';
    else if (path === '/onboarding') tab = 'Onboarding';
    else if (path === '/ai-chat') tab = 'AI Chat';
    return `Page: ${title}\nURL: ${url}\nActiveTab: ${tab}`;
  }, []);

  useEffect(() => {
    // Preload with a greeting when first opened
    if (open && messages.length === 0) {
      const appGuide = `You are Workflow Assistant, the in-app copilot for the Work-flow platform.
- Tone: emotionally warm yet professional.
- Be concise and helpful.
- IMPORTANT: Do NOT discuss the current page or tab unless the user explicitly asks about the page/tab; otherwise answer normally.
- If the user asks about the current page, tailor answers to that tab with purpose, key actions, and common pitfalls.
- You can analyze pasted reports or datasets and provide insights, summaries, and recommendations.
- Ask brief follow-up questions when needed.
- Never expose internal tokens or secrets.`;
      setMessages([
        { id: 'sys1', role: 'system', content: appGuide },
        { id: 'as1', role: 'assistant', content: 'Hi! I\'m your Workflow Assistant. How can I support you right now?' },
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
      // Reuse existing simple AI endpoint with richer system prompt + page context
      const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
      // Only include page context if user explicitly references the page/tab
      const mentionsPage = /\b(page|this page|current page|tab|this tab|dashboard|admin|onboarding|ai chat)\b/i.test(text);
      const finalPrompt = mentionsPage
        ? `${systemPrompt}\n\nContext:\n${pageContext}\n\nUser:\n${text}`
        : `${systemPrompt}\n\nUser:\n${text}`;
      const res = await apiFetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt })
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

  // Keep app content width responsive to sidebar state
  useEffect(() => {
    const setOffset = () => {
      const offset = open ? Math.min(Math.max(window.innerWidth * 0.2, 320), 560) : 0;
      document.documentElement.style.setProperty('--assistant-offset', `${offset}px`);
    };
    setOffset();
    window.addEventListener('resize', setOffset);
    return () => window.removeEventListener('resize', setOffset);
  }, [open]);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const form = new FormData();
    Array.from(files).forEach(f => form.append('files', f));

    try {
      setLoading(true);
      setError('');
      // 1) Upload files
      const uploadRes = await fetch(`${API_URL || ''}/api/assistant/upload`, { method: 'POST', body: form });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson?.success) throw new Error('Upload failed');

      const names = (uploadJson.files || []).map(f => `${f.originalname} (${Math.round(f.size/1024)} KB)`).join(', ');
      setMessages(prev => [
        ...prev,
        { id: `u_file_${Date.now()}`, role: 'user', content: `Analyze this report/data: ${names}` },
      ]);

      // 2) Ask AI to analyze based on filenames (placeholder until parsing is added)
      const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
      const analyzeRes = await apiFetch('/api/assistant/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `We uploaded files for analysis: ${names}. Summarize insights.`,
          // Do not include page context here unless user specifically asked about the page
          context: '',
          systemPrompt,
        })
      });
      const analyzeJson = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeJson?.error || 'Analyze failed');
      setMessages(prev => [...prev, { id: `a_${Date.now()}`, role: 'assistant', content: analyzeJson.text || 'No analysis' }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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
        className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-200 z-[59] transition-transform duration-300 ease-in-out shadow-xl flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: '20vw', minWidth: 320, maxWidth: 560 }}
        onTransitionEnd={() => {
          // update CSS var for app content shift
          const offset = open ? Math.min(Math.max(window.innerWidth * 0.2, 320), 560) : 0;
          document.documentElement.style.setProperty('--assistant-offset', `${offset}px`);
        }}
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
                {(() => {
                  // Minimal markdown: **bold**, ## / ### headings
                  const renderInline = (str) => {
                    const parts = [];
                    const regex = /\*\*(.+?)\*\*/g; // capture **bold**
                    let last = 0;
                    let match;
                    while ((match = regex.exec(str)) !== null) {
                      if (match.index > last) parts.push(str.slice(last, match.index));
                      parts.push(<strong key={`b-${match.index}`}>{match[1]}</strong>);
                      last = regex.lastIndex;
                    }
                    if (last < str.length) parts.push(str.slice(last));
                    return parts;
                  };

                  return m.content.split('\n').map((line, i) => {
                    if (line.startsWith('### ')) {
                      return (
                        <div key={i} className="font-semibold text-base leading-snug">
                          {renderInline(line.slice(4))}
                        </div>
                      );
                    }
                    if (line.startsWith('## ')) {
                      return (
                        <div key={i} className="font-bold text-lg leading-snug">
                          {renderInline(line.slice(3))}
                        </div>
                      );
                    }
                    return <div key={i}>{renderInline(line)}</div>;
                  });
                })()}
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