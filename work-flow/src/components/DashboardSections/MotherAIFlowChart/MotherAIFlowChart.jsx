import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../lib/api';
import { Plus, Trash2, Save, Power, GitBranch } from 'lucide-react';

// MotherAIFlowChart: build a Mother AI config that maps flow elements to existing campaigns.
// - System prompt for the Mother AI
// - Elements: each links to a campaign and optional label/keywords for routing hints
// Note: Save/Activate expects backend endpoints that we will add: 
//   GET  /api/mother-ai
//   POST /api/mother-ai (create/update)
//   POST /api/mother-ai/activate/:id
// Until backend is ready, Save will noop with a toast-like message.

const defaultMotherAI = () => ({
  id: '',
  name: 'Mother AI',
  systemPrompt: '',
  elements: [], // { id, campaignId, label, keywords: [] }
});

export default function MotherAIFlowChart() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [motherAIs, setMotherAIs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [current, setCurrent] = useState(defaultMotherAI());
  const [statusMsg, setStatusMsg] = useState('');

  // Fetch campaigns for dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/api/campaigns');
        const data = await res.json();
        if (mounted) setCampaigns(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setCampaigns([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Try to load existing Mother AI configs if backend endpoint exists
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/api/mother-ai');
        if (!res.ok) throw new Error('not-ready');
        const data = await res.json();
        if (!mounted) return;
        setMotherAIs(Array.isArray(data?.items) ? data.items : []);
        setActiveId(data?.activeMotherAIId || null);
        if (Array.isArray(data?.items) && data.items.length > 0) {
          setCurrent(data.items[0]);
        }
      } catch (_) {
        // Backend not ready yet; keep local state
      }
    })();
    return () => { mounted = false; };
  }, []);

  const campaignOptions = useMemo(() => campaigns.map(c => ({
    id: c.id, name: c.name || c.id, description: c?.brief?.description || ''
  })), [campaigns]);

  const addElement = () => {
    setCurrent(prev => ({
      ...prev,
      elements: [
        ...prev.elements,
        { id: 'el_' + Date.now(), campaignId: '', label: '', keywords: [] }
      ]
    }));
  };

  const removeElement = (id) => {
    setCurrent(prev => ({ ...prev, elements: prev.elements.filter(e => e.id !== id) }));
  };

  const updateElement = (id, patch) => {
    setCurrent(prev => ({
      ...prev,
      elements: prev.elements.map(e => e.id === id ? { ...e, ...patch } : e)
    }));
  };

  const handleSave = async () => {
    try {
      setStatusMsg('Saving...');
      const res = await apiFetch('/api/mother-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: current })
      });
      if (!res.ok) throw new Error('save_failed');
      const data = await res.json();
      setMotherAIs(data.items || []);
      setActiveId(data.activeMotherAIId || null);
      setCurrent(data.items?.find(i => i.id === (current.id || data.lastId)) || current);
      setStatusMsg('Saved');
    } catch (e) {
      setStatusMsg('Saved locally. Backend endpoint not ready yet.');
    } finally {
      setTimeout(() => setStatusMsg(''), 2500);
    }
  };

  const handleActivate = async () => {
    try {
      if (!current.id) throw new Error('no_id');
      setStatusMsg('Activating...');
      const res = await apiFetch(`/api/mother-ai/activate/${current.id}`, { method: 'POST' });
      if (!res.ok) throw new Error('activate_failed');
      const data = await res.json();
      setActiveId(data.activeMotherAIId || current.id);
      setStatusMsg('Activated');
    } catch (e) {
      setActiveId(current.id || null);
      setStatusMsg('Activated locally. Backend endpoint not ready yet.');
    } finally {
      setTimeout(() => setStatusMsg(''), 2500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <GitBranch className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-semibold">Flow-Chart</h1>
        {activeId && (
          <span className="ml-auto text-sm text-green-600">Active: {activeId}</span>
        )}
      </div>

      {/* Mother AI Header */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mother AI Name</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="e.g., Universal Router"
              value={current.name}
              onChange={e => setCurrent(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ID</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 bg-gray-50"
              placeholder="auto-generated"
              value={current.id}
              onChange={e => setCurrent(prev => ({ ...prev, id: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mother AI System Prompt</label>
          <textarea
            className="mt-1 w-full border rounded px-3 py-2 min-h-[140px]"
            placeholder="Define how the Mother AI routes user intent across campaigns..."
            value={current.systemPrompt}
            onChange={e => setCurrent(prev => ({ ...prev, systemPrompt: e.target.value }))}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <Save className="w-4 h-4" /> Save
          </button>
          <button onClick={handleActivate} className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            <Power className="w-4 h-4" /> Activate
          </button>
          {statusMsg && <span className="text-sm text-gray-600 self-center">{statusMsg}</span>}
        </div>
      </div>

      {/* Elements */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Flow Elements (Knots)</h2>
          <button onClick={addElement} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded hover:bg-black">
            <Plus className="w-4 h-4" /> Add Element
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading campaigns...</div>
        ) : (
          <div className="space-y-4">
            {current.elements.length === 0 && (
              <div className="text-sm text-gray-500">No elements yet. Click "Add Element" to start mapping campaigns.</div>
            )}
            {current.elements.map((el) => (
              <div key={el.id} className="border rounded p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Campaign</label>
                    <select
                      className="mt-1 w-full border rounded px-3 py-2"
                      value={el.campaignId}
                      onChange={e => updateElement(el.id, { campaignId: e.target.value })}
                    >
                      <option value="">Select campaign</option>
                      {campaignOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Label (optional)</label>
                    <input
                      className="mt-1 w-full border rounded px-3 py-2"
                      placeholder="e.g., Product A"
                      value={el.label || ''}
                      onChange={e => updateElement(el.id, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Keywords (comma-separated)</label>
                    <input
                      className="mt-1 w-full border rounded px-3 py-2"
                      placeholder="e.g., starter, basic, A-series"
                      value={(el.keywords || []).join(', ')}
                      onChange={e => updateElement(el.id, { keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <div className="truncate">
                    {el.campaignId && (
                      <span>
                        {campaignOptions.find(c => c.id === el.campaignId)?.description || 'No description'}
                      </span>
                    )}
                  </div>
                  <button onClick={() => removeElement(el.id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}