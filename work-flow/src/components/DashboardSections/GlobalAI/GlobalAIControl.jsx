import React, { useEffect, useState } from 'react';
import { Power, Zap, Brain, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../../lib/api';

export default function GlobalAIControl() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [mode, setMode] = useState('replace');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/api/ai/config');
        if (res.ok) {
          const data = await res.json();
          if (!mounted) return;
          setEnabled(!!data?.config?.globalAiEnabled);
          setMode(data?.config?.globalAiMode || 'replace');
          setMemoryEnabled(!!data?.config?.memoryEnabled);
        }
      } catch (_) {
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggle = async () => {
    try {
      setStatus('Updating...');
      const res = await apiFetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalAiEnabled: !enabled, globalAiMode: mode, memoryEnabled })
      });
      if (res.ok) {
        const data = await res.json();
        setEnabled(!!data?.config?.globalAiEnabled);
        setMode(data?.config?.globalAiMode || 'replace');
        setMemoryEnabled(!!data?.config?.memoryEnabled);
        setStatus(enabled ? 'Global AI stopped' : 'Global AI started');
      } else {
        setStatus('Failed to update');
      }
    } catch (e) {
      setStatus('Failed to update');
    } finally {
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const containerStyle = enabled
    ? 'from-emerald-500/20 to-cyan-500/20 ring-emerald-400/40'
    : 'from-slate-700/10 to-slate-900/10 ring-slate-400/20';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className={`rounded-3xl border backdrop-blur-xl bg-gradient-to-br ${containerStyle} ring-1 p-6 shadow-xl`}
           style={{ boxShadow: enabled ? '0 0 40px rgba(16, 185, 129, 0.25)' : '0 0 24px rgba(15, 23, 42, 0.15)' }}>
        <div className="flex items-center gap-3">
          <Brain className={enabled ? 'w-7 h-7 text-emerald-500' : 'w-7 h-7 text-slate-600'} />
          <h1 className="text-2xl font-semibold">Global AI</h1>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Central AI that answers across all campaigns using your business profile, campaign briefs, and conversation memory.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <button onClick={toggle}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white shadow-lg transition-all duration-300 ${enabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-black'}`}>
            <Power className="w-5 h-5" /> {enabled ? 'Stop Global AI' : 'Start Global AI'}
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShieldCheck className="w-4 h-4" /> Mode:
            <select value={mode} onChange={e => setMode(e.target.value)} className="border rounded-lg px-2 py-1">
              <option value="replace">Replace</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={memoryEnabled} onChange={e => setMemoryEnabled(e.target.checked)} />
            Enable Memory
          </label>

          {status && <span className="text-sm text-gray-500">{status}</span>}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/70 border">
            <div className="text-xs uppercase text-gray-500">Status</div>
            <div className="mt-1 font-semibold">{loading ? 'Loading...' : (enabled ? 'Running' : 'Stopped')}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/70 border">
            <div className="text-xs uppercase text-gray-500">Memory</div>
            <div className="mt-1 font-semibold">{memoryEnabled ? 'Enabled' : 'Disabled'}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/70 border">
            <div className="text-xs uppercase text-gray-500">Mode</div>
            <div className="mt-1 font-semibold">{mode}</div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          When started, Global AI will auto-reply on connected channels (WhatsApp, Facebook Messenger) using your configured tokens.
        </div>
      </div>
    </div>
  );
}