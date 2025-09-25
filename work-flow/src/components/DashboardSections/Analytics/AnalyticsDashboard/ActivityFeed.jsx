import React from 'react';
import { 
  FiMessageSquare, 
  FiUser, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiArrowUpRight
} from 'react-icons/fi';

const ActivityFeed = ({ data = [], loading = false, maxItems = 6 }) => {
  // Skeleton loader
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 animate-pulse">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Process and limit items
  const items = Array.isArray(data) ? data.slice(0, maxItems) : [];
  
  // If no data but not loading
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
          <FiMessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-gray-500 text-sm">No recent activity</h4>
        <p className="text-xs text-gray-400 mt-1">Activity will appear here</p>
      </div>
    );
  }

  // Get platform icon
  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return <span className="text-blue-600">FB</span>;
      case 'whatsapp':
        return <span className="text-green-500">WA</span>;
      case 'instagram':
        return <span className="text-pink-600">IG</span>;
      case 'web':
        return <span className="text-blue-500">Web</span>;
      default:
        return <FiUser className="text-gray-500" />;
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return {
          icon: <FiCheckCircle className="w-4 h-4 text-green-500" />,
          color: 'text-green-500',
          bg: 'bg-green-50'
        };
      case 'error':
        return {
          icon: <FiAlertCircle className="w-4 h-4 text-red-500" />,
          color: 'text-red-500',
          bg: 'bg-red-50'
        };
      case 'pending':
        return {
          icon: <FiClock className="w-4 h-4 text-yellow-500" />,
          color: 'text-yellow-500',
          bg: 'bg-yellow-50'
        };
      default:
        return {
          icon: <FiMessageSquare className="w-4 h-4 text-gray-400" />,
          color: 'text-gray-500',
          bg: 'bg-gray-50'
        };
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-4">
        {items.map((item, index) => {
          const statusInfo = getStatusInfo(item.status);
          
          return (
            <li key={item.id || index} className="py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${statusInfo.bg} ${statusInfo.color}`}>
                  {statusInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.message || 'New activity'}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatTime(item.timestamp)}</span>
                    {item.platform && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center">
                          <span className="inline-flex items-center justify-center w-4 h-4 mr-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                            {getPlatformIcon(item.platform)}
                          </span>
                          {item.platform}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {item.link && (
                  <a 
                    href={item.link} 
                    className="text-gray-400 hover:text-gray-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FiArrowUpRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      
      {data.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
