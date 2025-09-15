import React, { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || '';

// Simple helper to build a system prompt from sources now; later can expand to vector DB
function buildSystemPrompt({ fileText, urls, plainText, qa }) {
  const parts = [];
  if (fileText?.trim()) parts.push(`FILE UPLOAD NOTES:\n${fileText.trim()}`);
  if (urls?.length) parts.push(`URL SOURCES:\n${urls.join('\n')}`);
  if (plainText?.trim()) parts.push(`PLAIN TEXT:\n${plainText.trim()}`);
  if (qa?.length) {
    const qaText = qa.map(({ q, a }, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${a}`).join('\n\n');
    parts.push(`Q&A PAIRS:\n${qaText}`);
  }
  return parts.join('\n\n---\n\n');
}

export default function AIFinetune() {
  const [profileId, setProfileId] = useState('default');
  const [profiles, setProfiles] = useState(['default']);

  // Sources
  const [fileText, setFileText] = useState('');
  const [urls, setUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [plainText, setPlainText] = useState('');
  const [qa, setQa] = useState([{ q: '', a: '' }]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load existing profiles list from backend file store
    fetch(`${API}/api/profiles/prompts`)
      .then(r => r.json())
      .then((data) => {
        const keys = Object.keys(data?.profiles || {});
        if (keys.length) {
          setProfiles(Array.from(new Set(['default', ...keys])));
          if (!keys.includes(profileId)) setProfileId(keys[0]);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const systemPrompt = useMemo(() => buildSystemPrompt({ fileText, urls, plainText, qa }), [fileText, urls, plainText, qa]);

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    try {
      // basic validation
      const parsed = new URL(u);
      setUrls(prev => Array.from(new Set([...prev, parsed.toString()])));
      setUrlInput('');
    } catch (_) {
      alert('Enter a valid URL');
    }
  };

  const updateQa = (i, key, val) => {
    setQa(prev => prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));
  };

  const addQaRow = () => setQa(prev => [...prev, { q: '', a: '' }]);
  const removeQaRow = (i) => setQa(prev => prev.filter((_, idx) => idx !== i));

  const onFile = async (file) => {
    const text = await file.text();
    setFileText(prev => (prev ? prev + '\n\n' : '') + text.slice(0, 20000)); // keep it light
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        profileId,
        systemPrompt: systemPrompt.slice(0, 8000),
        sources: {
          urls,
          hasFile: !!fileText,
          plainTextLength: plainText.length,
          qaCount: qa.filter(x => x.q || x.a).length,
        },
      };
      const r = await fetch(`${API}/api/profiles/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok || !data?.success) throw new Error('Save failed');
      setMessage('Saved ✓');
      if (!profiles.includes(profileId)) setProfiles(prev => [...prev, profileId]);
    } catch (e) {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 2500);
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Feed your AI</h1>
        <p className="text-gray-600 mb-6">Choose a content source to train your AI assistant (per profile). For now we combine these into the profile's system prompt.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Profile ID</label>
            <input value={profileId} onChange={(e) => setProfileId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="default or custom key" />
            <p className="text-xs text-gray-500 mt-1">Each profile has isolated memory.</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Existing Profiles</label>
            <div className="flex gap-2 flex-wrap">
              {profiles.map((p) => (
                <button key={p} onClick={() => setProfileId(p)} className={`px-3 py-1 rounded border ${p === profileId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">File Upload</h2>
          <div className="border-2 border-dashed rounded p-4 text-center">
            <input type="file" accept=".txt,.md,.pdf,.csv,.json,.html" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            {fileText && <p className="text-xs text-gray-500 mt-2">Loaded {fileText.length} chars</p>}
          </div>
        </div>

        {/* URL / Website */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">URL / Website</h2>
          <div className="flex gap-2">
            <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="flex-1 border border-gray-300 rounded px-3 py-2" placeholder="https://example.com/page" />
            <button onClick={addUrl} className="px-4 py-2 rounded bg-blue-600 text-white">Add</button>
          </div>
          {urls.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
              {urls.map((u) => <li key={u}>{u}</li>)}
            </ul>
          )}
        </div>

        {/* Plain Text */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Plain Text</h2>
          <textarea value={plainText} onChange={(e) => setPlainText(e.target.value)} rows={5} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Paste or type content..." />
        </div>

        {/* Q&A */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Q&A</h2>
          <div className="space-y-3">
            {qa.map((row, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
                <input value={row.q} onChange={(e) => updateQa(i, 'q', e.target.value)} className="border border-gray-300 rounded px-3 py-2" placeholder={`Question ${i + 1}`} />
                <div className="flex gap-2">
                  <input value={row.a} onChange={(e) => updateQa(i, 'a', e.target.value)} className="flex-1 border border-gray-300 rounded px-3 py-2" placeholder={`Answer ${i + 1}`} />
                  <button onClick={() => removeQaRow(i)} className="px-3 py-2 border border-gray-300 rounded">Remove</button>
                </div>
              </div>
            ))}
            <button onClick={addQaRow} className="px-4 py-2 rounded bg-gray-100 border border-gray-300">+ Add Q&A</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button disabled={saving} onClick={save} className="px-5 py-2 rounded bg-blue-600 text-white disabled:bg-gray-300">{saving ? 'Saving...' : 'Save for Profile'}</button>
          {message && <span className="text-sm text-gray-600">{message}</span>}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Preview of system prompt (sent to AI for this profile)</h3>
          <pre className="text-xs p-3 border rounded bg-gray-50 whitespace-pre-wrap max-h-64 overflow-auto">{systemPrompt || 'Empty'}</pre>
        </div>
      </div>
    </div>
  );
}