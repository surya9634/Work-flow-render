import React from 'react';
import { Activity, Users, MessageSquare, CheckCircle } from 'lucide-react';

const ActivityItem = ({ activity }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'automation': return <Activity className="w-4 h-4" />;
      case 'lead': return <Users className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        {getIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900 truncate">{activity.name}</p>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
            {activity.status}
          </span>
        </div>
        <p className="text-xs text-gray-500">{activity.action} • {activity.time}</p>
      </div>
    </div>
  );
};

export default React.memo(ActivityItem);