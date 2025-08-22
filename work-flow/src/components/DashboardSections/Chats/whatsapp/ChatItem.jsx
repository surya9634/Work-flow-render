import React from 'react';
import { X, Pause, FileText, UserCheck } from 'lucide-react';

const ChatItem = ({ chat, isActive, onClick }) => {
  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Closed: 'bg-red-100 text-red-800',
    Paused: 'bg-yellow-100 text-yellow-800',
    Draft: 'bg-gray-100 text-gray-800',
    'Assign to me': 'bg-purple-100 text-purple-800'
  };

  const statusIcons = {
    Active: <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />,
    Closed: <X className="w-3 h-3" />,
    Paused: <Pause className="w-3 h-3" />,
    Draft: <FileText className="w-3 h-3" />,
    'Assign to me': <UserCheck className="w-3 h-3" />
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
        isActive ? 'bg-gradient-to-r from-green-50 to-green-50 border-l-4 border-purple-500' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-500 flex items-center justify-center text-white font-semibold">
          {chat.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{chat.name}</h3>
            <span className="text-xs text-gray-500">{chat.time}</span>
          </div>
          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
          <div className="flex items-center mt-2 space-x-2">
            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[chat.status]}`}>
              {statusIcons[chat.status]}
              <span>{chat.status}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatItem;