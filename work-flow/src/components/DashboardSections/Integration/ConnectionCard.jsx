import React from 'react';
import { Edit2, X, Eye } from 'lucide-react';
import { platforms } from '../../data/platformData';

const ConnectionCard = ({ connection, onEdit, onDisconnect }) => {
  const platform = platforms[connection.platform] || { name: connection.platform || 'Platform', icon: () => null, color: 'bg-gray-400' };
  const Icon = platform.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${platform.color} text-white`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{platform.name}</h3>
            <p className="text-sm text-gray-500">{connection.connectionType}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          connection.status === 'active' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {connection.status === 'active' ? 'Active' : 'Inactive'}
        </div>
      </div>
      
      {/* Platform-specific information */}
      <div className="space-y-1 mb-4">
        {connection.platform === 'whatsapp' && connection.phoneNumber && (
          <p className="text-sm text-gray-600">Number: {connection.phoneNumber}</p>
        )}
        {connection.platform === 'facebook' && connection.pageNames && (
          <p className="text-sm text-gray-600">Pages: {connection.pageNames.join(', ')}</p>
        )}
        {connection.platform === 'instagram' && connection.username && (
          <p className="text-sm text-gray-600">@{connection.username}</p>
        )}
        {connection.followers && (
          <p className="text-sm text-gray-600">Followers: {connection.followers.toLocaleString()}</p>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(connection)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          <Edit2 size={14} />
          Edit
        </button>
        <button
          onClick={() => onDisconnect(connection.id)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:border-red-300 transition-colors"
        >
          <X size={14} />
          Disconnect
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <Eye size={14} />
          View Logs
        </button>
      </div>
    </div>
  );
};

export default ConnectionCard;