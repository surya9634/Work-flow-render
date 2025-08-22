import React from 'react';
import { Edit2, Trash2, Zap, Calendar, Power } from 'lucide-react';
import { platforms } from '../../data/platformData';

const AutomationCard = ({ automation, onToggle, onEdit, onDelete }) => {
  const platform = platforms[automation.platform];
  const Icon = platform.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${platform.color} text-white`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{automation.name}</h3>
            <p className="text-sm text-gray-500">{automation.trigger}</p>
          </div>
        </div>
        <button
          onClick={() => onToggle(automation.id)}
          className={`p-2 rounded-lg transition-colors ${
            automation.active 
              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          title={automation.active ? 'Deactivate' : 'Activate'}
        >
          <Power size={20} />
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Zap size={14} className="text-yellow-500" />
          <span>{automation.logic}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="text-blue-500" />
          <span>{automation.schedule || 'Event-driven'}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(automation)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          <Edit2 size={14} />
          Edit
        </button>
        <button
          onClick={() => onDelete(automation.id)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:border-red-300 transition-colors"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
};

export default AutomationCard;