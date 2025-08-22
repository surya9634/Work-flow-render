import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Loader2 } from 'lucide-react';
import { platforms } from '../../data/platformData';

const ConnectionModal = ({ platform, editingConnection, onClose, onSave }) => {
  const [connectionType, setConnectionType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    apiKey: '',
    pageNames: [],
    username: '',
    followers: ''
  });

  useEffect(() => {
    if (editingConnection) {
      setConnectionType(editingConnection.connectionType);
      setFormData({
        phoneNumber: editingConnection.phoneNumber || '',
        apiKey: editingConnection.apiKey || '',
        pageNames: editingConnection.pageNames || [],
        username: editingConnection.username || '',
        followers: editingConnection.followers || ''
      });
    }
  }, [editingConnection]);

  const platformConfig = platforms[platform];

  const handleConnect = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const connectionData = {
        platform,
        connectionType,
        ...formData
      };
      
      onSave(connectionData);
      setIsLoading(false);
    }, 1500);
  };

  const renderConnectionForm = () => {
    if (platform === 'whatsapp') {
      switch (connectionType) {
        case 'api':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your WhatsApp Business API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          );
        case 'new':
          return (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  We'll help you create a new WhatsApp Business number. This process typically takes 2-3 business days.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                  <option>Australia</option>
                </select>
              </div>
            </div>
          );
        default:
          return null;
      }
    } else if (platform === 'facebook') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Click "Connect with Facebook" to authorize access to your Facebook Pages and Messenger.
            </p>
          </div>
          <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            Connect with Facebook
          </button>
        </div>
      );
    } else if (platform === 'instagram') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="@username"
            />
          </div>
          <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity">
            Connect Instagram Business Account
          </button>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingConnection ? 'Edit Connection' : `Connect ${platformConfig.name}`}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingConnection ? 'Update your connection settings' : 'Choose how you want to connect'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!connectionType && !editingConnection ? (
            <div className="space-y-3">
              {platformConfig.connectionTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setConnectionType(type.id)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{type.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            renderConnectionForm()
          )}
        </div>

        {/* Footer */}
        {(connectionType || editingConnection) && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => editingConnection ? onClose() : setConnectionType('')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {editingConnection ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  editingConnection ? 'Save Changes' : 'Connect'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionModal;