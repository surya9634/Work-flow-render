import React, { useState } from 'react';
import {
  Upload,
  Users,
  Mail,
  Phone,
  Trash2,
  Download,
  Plus,
  X,
  MessageCircle,
  Instagram,
  Link2,
} from 'lucide-react';

// Contact upload/management page (light theme)
// Extended to include Messenger username, Instagram username, and an optional connected user ID
const ContactUploadPage = () => {
  const [uploadedContacts, setUploadedContacts] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualContact, setManualContact] = useState({
    name: '',
    email: '',
    phone: '',
    messenger: '',
    instagram: '',
    connectedUserId: '', // e.g., Messenger PSID or IG user id if already connected
  });
  const [showManualForm, setShowManualForm] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setSelectedFile(file);
      processCSV(file);
    } else {
      alert('Please upload a CSV file');
    }
  };

  const processCSV = (file) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        setUploadedContacts([]);
        setIsProcessing(false);
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const idx = {
        name: headers.indexOf('name'),
        email: headers.indexOf('email'),
        phone: headers.indexOf('phone'),
        messenger: headers.indexOf('messenger'),
        instagram: headers.indexOf('instagram'),
        connectedUserId: headers.indexOf('connecteduserid'),
      };

      const contacts = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line, index) => {
          const values = line.split(',').map((v) => v.trim());
          const get = (i, fallback = '') => (i >= 0 && i < values.length ? values[i] : fallback);
          return {
            id: Date.now() + index,
            name: get(idx.name) || values[0] || 'Unknown',
            email: get(idx.email),
            phone: get(idx.phone),
            messenger: get(idx.messenger),
            instagram: get(idx.instagram),
            connectedUserId: get(idx.connectedUserId),
          };
        });

      setUploadedContacts(contacts);
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const addManualContact = () => {
    const hasAnyContactMethod =
      manualContact.email ||
      manualContact.phone ||
      manualContact.messenger ||
      manualContact.instagram ||
      manualContact.connectedUserId;

    if (manualContact.name && hasAnyContactMethod) {
      setUploadedContacts((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...manualContact,
        },
      ]);
      setManualContact({ name: '', email: '', phone: '', messenger: '', instagram: '', connectedUserId: '' });
      setShowManualForm(false);
    } else {
      alert('Please provide a name and at least one contact method (email, phone, messenger, instagram, or connected user id).');
    }
  };

  const removeContact = (id) => {
    setUploadedContacts((prev) => prev.filter((contact) => contact.id !== id));
  };

  const downloadTemplate = () => {
    const csvContent =
      'name,email,phone,messenger,instagram,connectedUserId\n' +
      'John Doe,john@example.com,+1234567890,john.doe.fb,johndoe,psid_or_igid\n' +
      'Jane Smith,jane@example.com,+0987654321,,janes_ig,';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const startAutomation = async () => {
    if (uploadedContacts.length === 0) {
      alert('Please upload contacts first');
      return;
    }

    const API = import.meta.env.VITE_API_BASE || '';
    const prompt = window.prompt('Custom initial message to send (used when possible):', 'Hi! This is our assistant. How can we help you today?');
    const initialMessage = (prompt || '').trim();

    let ok = 0, fail = 0, pending = 0;

    // Local helper to push notifications into the navbar dropdown
    const notify = (type, title, message) => {
      import('../../lib/events').then(({ emitEvent }) => {
        emitEvent('notify', { id: Date.now() + Math.random(), type, title, message, time: 'just now' });
      }).catch(() => {});
    };

    for (const c of uploadedContacts) {
      const name = c.name || '';
      const messenger = (c.messenger || '').trim();
      const psid = (c.connectedUserId || '').trim();

      // If we have PSID, try to find the thread and turn AI on + send now
      if (psid) {
        try {
          const r = await fetch(`${API}/api/automation/start-for-contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, messenger, connectedUserId: psid, initialMessage })
          });
          const data = await r.json();
          if (data && data.success) {
            ok++;
            notify('success', 'Campaign started', `Sent to ${name || psid} on Messenger.`);
          } else {
            fail++;
            notify('warning', 'Failed to start', `Could not start for ${name || psid}.`);
          }
        } catch {
          fail++;
          notify('warning', 'Failed to start', `Could not start for ${name || psid}.`);
        }
        continue;
      }

      // If only username, we try to match to existing FB conversations by display name, else store for auto-start later
      if (messenger) {
        try {
          // Create a memo entry so when this username messages first time, AI will auto-start
          const payload = {
            name,
            username: messenger,
            autoStartIfFirstMessage: true,
            systemPrompt: '',
            initialMessage,
            profileId: 'default'
          };
          await fetch(`${API}/api/messenger/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          pending++;
          notify('info', 'Campaign pending', `Will auto-start when ${name || messenger} messages first.`);
        } catch {
          // ignore
        }

        // Best-effort: ask backend to try to start immediately by matching username to existing convs
        try {
          const r = await fetch(`${API}/api/automation/start-for-contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, messenger, connectedUserId: '', initialMessage, profileId: 'default' })
          });
          const data = await r.json();
          if (data && data.success) {
            ok++;
            notify('success', 'Campaign started', `Matched and sent to ${name || messenger}.`);
          } else {
            // remains pending
          }
        } catch {
          // remains pending
        }
      }
    }

    notify('info', 'Campaign request', `Requested automation • Sent: ${ok}, Failed: ${fail}, Pending: ${pending}`);
    alert(`Requested automation. Sent now: ${ok}, failed: ${fail}, pending until first message: ${pending}.`);
  };

  // Start for a single contact (immediate if PSID; otherwise pending/match by username)
  const startForUser = async (c) => {
    const API = import.meta.env.VITE_API_BASE || '';
    const name = c.name || '';
    const messenger = (c.messenger || '').trim();
    const psid = (c.connectedUserId || '').trim();
    const initialMessage = (window.prompt('Initial message:', 'Hi! This is our assistant. How can we help you today?') || '').trim();

    const notify = (type, title, message) => {
      import('../../lib/events').then(({ emitEvent }) => {
        emitEvent('notify', { id: Date.now(), type, title, message, time: 'just now' });
      }).catch(() => {});
    };

    if (psid) {
      try {
        const r = await fetch(`${API}/api/automation/start-for-contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, messenger, connectedUserId: psid, initialMessage, profileId: 'default' })
        });
        const data = await r.json();
        if (data?.success) {
          notify('success', 'Campaign started', `Sent to ${name || psid} on Messenger.`);
          alert('Sent now ✅');
        } else if (data?.pending) {
          notify('info', 'Campaign pending', `Will auto-start when ${name || messenger} messages first.`);
          alert('Pending until user sends first message ⏳');
        } else {
          notify('warning', 'Failed to start', `Could not start for ${name || psid}.`);
          alert('Failed to start ❌');
        }
      } catch {
        notify('warning', 'Failed to start', `Could not start for ${name || psid}.`);
        alert('Failed to start ❌');
      }
      return;
    }

    if (messenger) {
      try {
        await fetch(`${API}/api/messenger/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            username: messenger,
            autoStartIfFirstMessage: true,
            systemPrompt: '',
            initialMessage
          })
        });
      } catch {}
      try {
        const r = await fetch(`${API}/api/automation/start-for-contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, messenger, connectedUserId: '', initialMessage })
        });
        const data = await r.json();
        if (data?.success) {
          notify('success', 'Campaign started', `Matched and sent to ${name || messenger}.`);
          alert('Matched and sent now ✅');
        } else {
          notify('info', 'Campaign pending', `Will auto-start when ${name || messenger} messages first.`);
          alert('Pending until user sends first message ⏳');
        }
      } catch {
        notify('info', 'Campaign pending', `Will auto-start when ${name || messenger} messages first.`);
        alert('Pending until user sends first message ⏳');
      }
      return;
    }

    alert('Provide Messenger username or connectedUserId (PSID) to start.');
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Contact Management</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your contact lists to start automation campaigns. Supported columns: name, email, phone, messenger, instagram, connectedUserId.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Upload Contacts</h2>
            <button
              onClick={downloadTemplate}
              className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your CSV file here, or
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer ml-1">
                browse
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>
            </p>
            <p className="text-sm text-gray-500">
              Supports CSV files with columns: name, email, phone, messenger, instagram, connectedUserId
            </p>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-900 font-medium">✓ File uploaded: {selectedFile.name}</p>
              {isProcessing && (
                <p className="text-gray-600 text-sm mt-1">Processing contacts...</p>
              )}
            </div>
          )}
        </div>

        {/* Manual Contact Addition */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add Contact Manually</h2>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showManualForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showManualForm ? 'Cancel' : 'Add Contact'}
            </button>
          </div>

          {showManualForm && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Name"
                value={manualContact.name}
                onChange={(e) => setManualContact({ ...manualContact, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={manualContact.email}
                onChange={(e) => setManualContact({ ...manualContact, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={manualContact.phone}
                onChange={(e) => setManualContact({ ...manualContact, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Messenger username (optional)"
                  value={manualContact.messenger}
                  onChange={(e) => setManualContact({ ...manualContact, messenger: e.target.value })}
                  className="pl-9 px-3 py-2 w-full border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Instagram className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Instagram username (optional)"
                  value={manualContact.instagram}
                  onChange={(e) => setManualContact({ ...manualContact, instagram: e.target.value })}
                  className="pl-9 px-3 py-2 w-full border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="relative md:col-span-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Link2 className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Connected user ID (PSID/IG ID)"
                  value={manualContact.connectedUserId}
                  onChange={(e) => setManualContact({ ...manualContact, connectedUserId: e.target.value })}
                  className="pl-9 px-3 py-2 w-full border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button
                  onClick={addManualContact}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contacts List */}
        {uploadedContacts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Uploaded Contacts ({uploadedContacts.length})
              </h2>
              <button
                onClick={startAutomation}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Mail className="h-5 w-5 mr-2" />
                Start Automation
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Messenger</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Instagram</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Linked</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploadedContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {contact.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {contact.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-2 text-gray-400" />
                          {contact.messenger || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <Instagram className="h-4 w-4 mr-2 text-gray-400" />
                          {contact.instagram || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {contact.connectedUserId ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
                            Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            Not linked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex gap-3">
                          <button
                            onClick={() => startForUser(contact)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Start campaign for this user"
                          >
                            Start for this user
                          </button>
                          <button
                            onClick={() => removeContact(contact.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {uploadedContacts.length === 0 && !isProcessing && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts uploaded yet</h3>
            <p className="text-gray-600">Upload a CSV file or add contacts manually to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactUploadPage;