import React, { useEffect, useState } from 'react';

const WhatsAppSetupGuide = () => {
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState({ connected: false, phoneNumberId: '', verifyTokenSet: false, tokenMasked: null, callbackUrl: '' });

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const resp = await fetch(`${window.location.origin}/api/integrations/whatsapp/config`);
        const data = await resp.json();
        if (!resp.ok || !data?.success) throw new Error('Failed to load WhatsApp config');
        if (!ignore) setCfg({ ...(data.whatsapp || {}) });
      } catch (_) {}
      finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, []);

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Cloud API Setup</h3>
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-700">
            Follow these steps to connect your WhatsApp Business via Meta Cloud API.
          </div>

          <ol className="list-decimal pl-5 space-y-3 text-sm text-gray-800">
            <li>
              Go to Meta for Developers → WhatsApp → Getting Started.
              <div className="mt-1 text-gray-600">Pick or create a phone number, then note its Phone Number ID.</div>
            </li>
            <li>
              Configure webhook subscription to this callback URL:
              <div className="mt-1 flex items-center gap-2">
                <code className="px-2 py-1 bg-gray-100 rounded text-xs break-all">{cfg.callbackUrl || 'http://localhost:10000/webhook'}</code>
                <button onClick={() => copy(cfg.callbackUrl)} className="text-xs px-2 py-1 bg-gray-800 text-white rounded">Copy</button>
              </div>
              <div className="mt-1 text-gray-600">Set Verify Token to the same value you enter below in Integration → Connect → WhatsApp → API.</div>
            </li>
            <li>
              Generate a permanent access token (long-lived):
              <ul className="list-disc pl-5 mt-1 text-gray-600">
                <li>In Business Settings → System Users, create a system user and generate a permanent token with whatsapp_business_messaging, whatsapp_business_management.</li>
                <li>Associate the WhatsApp Business App and phone number to that token.</li>
                <li>Avoid short-lived test tokens; they expire quickly.</li>
              </ul>
            </li>
            <li>
              Enter these in Integration → Connect → WhatsApp → API:
              <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <div className="text-xs text-gray-500">Access Token</div>
                  <div className="text-xs font-mono bg-gray-100 rounded px-2 py-1">{cfg.tokenMasked || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone Number ID</div>
                  <div className="text-xs font-mono bg-gray-100 rounded px-2 py-1">{cfg.phoneNumberId || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Verify Token Set</div>
                  <div className="text-xs font-mono bg-gray-100 rounded px-2 py-1">{cfg.verifyTokenSet ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </li>
            <li>
              Test inbound webhook: send a message to your WA business number, then open Chats. You should see a new conversation starting with wa_…
            </li>
          </ol>

          <div className="pt-2 text-xs text-gray-500">
            Tip: If messages don’t appear, ensure the webhook is subscribed for messages + message status events on your WhatsApp app in Meta.
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSetupGuide;