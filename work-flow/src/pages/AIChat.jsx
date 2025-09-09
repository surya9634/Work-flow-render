import React, { useState } from 'react';

const API_BASE = (import.meta?.env?.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

export default function AIChat() {
  const [prompt, setPrompt] = useState('Hi! What can you do?');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReply('');
    try {
      const res = await fetch(`${API_BASE}/api/ai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setReply(data.text || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold mb-4">Gemini AI Chat Test</h1>
        <form onSubmit={ask} className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Type a prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-300"
          >
            {loading ? 'Asking...' : 'Ask'}
          </button>
        </form>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {reply && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 whitespace-pre-wrap">
            {reply}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4">Backend: {API_BASE}</p>
      </div>
    </div>
  );
}