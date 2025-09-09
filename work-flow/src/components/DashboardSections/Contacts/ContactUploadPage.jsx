import React, { useState } from 'react';
import { Upload, Users, Mail, Phone, Trash2, Download, Plus, X } from 'lucide-react';

// Contact upload/management page
// Ported from call-automation.txt and placed under DashboardSections to appear as a tab in the dashboard
const ContactUploadPage = () => {
  const [uploadedContacts, setUploadedContacts] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualContact, setManualContact] = useState({ name: '', email: '', phone: '' });
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
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const contacts = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line, index) => {
          const values = line.split(',').map((v) => v.trim());
          return {
            id: Date.now() + index,
            name: values[headers.indexOf('name')] || values[0] || 'Unknown',
            email: values[headers.indexOf('email')] || values[1] || '',
            phone: values[headers.indexOf('phone')] || values[2] || '',
          };
        });

      setUploadedContacts(contacts);
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const addManualContact = () => {
    if (manualContact.name && (manualContact.email || manualContact.phone)) {
      setUploadedContacts((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...manualContact,
        },
      ]);
      setManualContact({ name: '', email: '', phone: '' });
      setShowManualForm(false);
    }
  };

  const removeContact = (id) => {
    setUploadedContacts((prev) => prev.filter((contact) => contact.id !== id));
  };

  const downloadTemplate = () => {
    const csvContent =
      'name,email,phone\nJohn Doe,john@example.com,+1234567890\nJane Smith,jane@example.com,+0987654321';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const startAutomation = () => {
    if (uploadedContacts.length === 0) {
      alert('Please upload contacts first');
      return;
    }
    alert(`Starting automation for ${uploadedContacts.length} contacts!`);
    // Integrate with automation system here
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-[#1F7D53] mr-3" />
            <h1 className="text-3xl font-bold text-white">Contact Management</h1>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Upload your contact lists to start automation campaigns. Support CSV format
            with name, email, and phone columns.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-8 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Upload Contacts</h2>
            <button
              onClick={downloadTemplate}
              className="flex items-center px-4 py-2 text-sm font-medium text-[#1F7D53] bg-[#255F38] rounded-lg hover:bg-[#1F7D53] hover:text-white transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-[#1F7D53] bg-[#255F38]' : 'border-gray-700 hover:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-300 mb-2">
              Drop your CSV file here, or
              <label className="text-[#1F7D53] hover:text-white cursor-pointer ml-1">
                browse
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>
            </p>
            <p className="text-sm text-gray-400">
              Supports CSV files with name, email, and phone columns
            </p>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-[#255F38] rounded-lg border border-[#1F7D53]">
              <p className="text-white font-medium">✓ File uploaded: {selectedFile.name}</p>
              {isProcessing && (
                <p className="text-gray-300 text-sm mt-1">Processing contacts...</p>
              )}
            </div>
          )}
        </div>

        {/* Manual Contact Addition */}
        <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-8 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Add Contact Manually</h2>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1F7D53] rounded-lg hover:bg-[#255F38] transition-colors"
            >
              {showManualForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showManualForm ? 'Cancel' : 'Add Contact'}
            </button>
          </div>

          {showManualForm && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#255F38] rounded-lg">
              <input
                type="text"
                placeholder="Name"
                value={manualContact.name}
                onChange={(e) => setManualContact({ ...manualContact, name: e.target.value })}
                className="px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7D53] placeholder-gray-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={manualContact.email}
                onChange={(e) => setManualContact({ ...manualContact, email: e.target.value })}
                className="px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7D53] placeholder-gray-400"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={manualContact.phone}
                  onChange={(e) => setManualContact({ ...manualContact, phone: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7D53] placeholder-gray-400"
                />
                <button
                  onClick={addManualContact}
                  className="px-4 py-2 bg-[#1F7D53] text-white rounded-lg hover:bg-black transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contacts List */}
        {uploadedContacts.length > 0 && (
          <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-8 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Uploaded Contacts ({uploadedContacts.length})
              </h2>
              <button
                onClick={startAutomation}
                className="flex items-center px-6 py-3 bg-[#1F7D53] text-white rounded-lg hover:bg-[#255F38] transition-colors font-medium"
              >
                <Mail className="h-5 w-5 mr-2" />
                Start Automation
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-[#255F38]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {uploadedContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {contact.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {contact.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {contact.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <button
                          onClick={() => removeContact(contact.id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No contacts uploaded yet</h3>
            <p className="text-gray-400">Upload a CSV file or add contacts manually to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactUploadPage;