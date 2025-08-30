import React, { useEffect, useState } from 'react';
import WhatsAppSetupGuide from './WhatsAppSetupGuide';

// Inline controls for registration/config without cluttering UI
const RegisterControls = () => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creds, setCreds] = useState({ token: '', phoneNumberId: '', mode: 'test' });
  const [codeMethod, setCodeMethod] = useState('SMS');
  const [language, setLanguage] = useState('en');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  const saveCreds = async () => {
    setSaving(true); setMsg('');
    try {
      const resp = await fetch(`${window.location.origin}/api/integrations/whatsapp/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || 'save_failed');
      setMsg('Saved');
    } catch (e) {
      setMsg('Save failed');
    } finally { setSaving(false); }
  };

  const requestCode = async () => {
    setSaving(true); setMsg('');
    try {
      const resp = await fetch(`${window.location.origin}/api/whatsapp/request-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeMethod, language })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error('request_failed');
      setMsg('Code sent');
    } catch { setMsg('Request failed'); } finally { setSaving(false); }
  };

  const verifyCode = async () => {
    setSaving(true); setMsg('');
    try {
      const resp = await fetch(`${window.location.origin}/api/whatsapp/verify-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error('verify_failed');
      setMsg('Verified');
    } catch { setMsg('Verify failed'); } finally { setSaving(false); }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(v=>!v)} className="text-xs px-2 py-1 border rounded">Register</button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 bg-white border rounded shadow p-3 space-y-2">
          <div className="text-xs text-gray-700 font-medium">WhatsApp Config</div>
          <input placeholder="Token" className="w-full px-2 py-1 border rounded" value={creds.token} onChange={e=>setCreds({...creds, token: e.target.value})} />
          <input placeholder="Phone Number ID" className="w-full px-2 py-1 border rounded" value={creds.phoneNumberId} onChange={e=>setCreds({...creds, phoneNumberId: e.target.value})} />
          <select className="w-full px-2 py-1 border rounded" value={creds.mode} onChange={e=>setCreds({...creds, mode: e.target.value})}>
            <option value="test">Test</option>
            <option value="production">Production</option>
          </select>
          <button onClick={saveCreds} disabled={saving} className="w-full text-xs px-2 py-1 bg-gray-900 text-white rounded">{saving? 'Saving…':'Save'}</button>
          <div className="h-px bg-gray-200" />
          <div className="text-xs text-gray-700 font-medium">Request Code (Prod)</div>
          <div className="flex gap-2">
            <select className="flex-1 px-2 py-1 border rounded" value={codeMethod} onChange={e=>setCodeMethod(e.target.value)}>
              <option>SMS</option>
              <option>VOICE</option>
            </select>
            <input placeholder="lang (en)" className="w-24 px-2 py-1 border rounded" value={language} onChange={e=>setLanguage(e.target.value)} />
          </div>
          <button onClick={requestCode} disabled={saving} className="w-full text-xs px-2 py-1 border rounded">Send Code</button>
          <div className="flex gap-2 items-center">
            <input placeholder="123456" className="flex-1 px-2 py-1 border rounded" value={code} onChange={e=>setCode(e.target.value)} />
            <button onClick={verifyCode} disabled={saving} className="text-xs px-2 py-1 border rounded">Verify</button>
          </div>
          {!!msg && <div className="text-xs text-gray-600">{msg}</div>}
        </div>
      )}
    </div>
  );
};

const WhatsAppIntegrationPanel = () => {
  const [status, setStatus] = useState({ connected: false, phoneNumberId: null, mode: 'test' });
  const [test, setTest] = useState({ phoneNumber: '', message: 'Hello from Work-Flow!', mode: 'test' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [diag, setDiag] = useState({ running: false, data: null });

  const runDiagnose = async () => {
    setDiag({ running: true, data: null });
    try {
      const r = await fetch(`${window.location.origin}/api/whatsapp/diagnose`);
      const d = await r.json();
      setDiag({ running: false, data: { ok: r.ok, ...d } });
    } catch (_) {
      setDiag({ running: false, data: { ok: false, issues: ['diagnose_call_failed'] } });
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/integrations/status`);
        const data = await res.json();
        if (!ignore && res.ok) setStatus(data.whatsapp || { connected: false });
      } catch {}
    })();
    return () => { ignore = true; };
  }, []);

  const sendTest = async () => {
    setSending(true); setResult(null);
    try {
      const resp = await fetch(`${window.location.origin}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: String(test.phoneNumber || '').replace(/\D/g, ''), message: test.message, mode: test.mode })
      });
      const data = await resp.json();
      if (!resp.ok) {
        const detail = data?.details ? ` (${data.details.message || ''}${data.details.code ? `, code ${data.details.code}` : ''}${data.details.subcode ? `/${data.details.subcode}` : ''})` : '';
        throw new Error((data?.error || 'Send failed') + detail);
      }
      setResult({ ok: true, data });
    } catch (e) {
      setResult({ ok: false, error: String(e.message || e) });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">WhatsApp Integration</h3>
        <div className="flex items-center gap-3">

          <span className={`px-2 py-1 text-xs rounded ${status.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {status.connected ? `Connected (Phone ID: ${status.phoneNumberId || '—'})` : 'Not Connected'}
          </span>
        </div>
      </div>

      {/* hidden diagnose banner and setup guide for cleaner UI */}
      {/* <WhatsAppSetupGuide /> */}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Send WhatsApp Message</h4>
          <RegisterControls />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Recipient Phone (E.164, digits only)</label>
            <input type="text" value={test.phoneNumber} onChange={e=>setTest({...test, phoneNumber: e.target.value})} placeholder="15551234567" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Message</label>
            <input type="text" value={test.message} onChange={e=>setTest({...test, message: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mode</label>
            <select value={test.mode} onChange={e=>setTest({...test, mode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="test">Test</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={sendTest} disabled={sending} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
            {sending ? 'Sending…' : 'Send Test via WhatsApp'}
          </button>
          {result && (
            <span className={`text-sm ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
              {result.ok ? 'Sent!' : `Failed: ${result.error}`}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">Note: Requires your Access Token, Phone Number ID and Webhook to be set and connected.</p>
      </div>
    </div>
  );
};

export default WhatsAppIntegrationPanel;