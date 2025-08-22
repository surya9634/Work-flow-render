import React from 'react';
import { Bot, User } from 'lucide-react';

const Message = ({ message, isAI }) => {
  return (
    <div className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-2 max-w-[70%] ${message.sender === 'me' ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          message.sender === 'me' 
            ? isAI 
              ? 'bg-gradient-to-r from-green-500 to-pink-500 text-white'
              : 'bg-gradient-to-r from-green-500 to-green-500 text-white'
            : 'bg-gray-300 text-gray-700'
        }`}>
          {message.sender === 'me' 
            ? isAI 
              ? <Bot className="w-4 h-4" /> 
              : 'Y'
            : <User className="w-4 h-4" />
          }
        </div>
        <div>
          <div className={`px-4 py-2 rounded-2xl ${
            message.sender === 'me' 
              ? isAI
                ? 'bg-gradient-to-r from-green-500 to-pink-500 text-white'
                : 'bg-gradient-to-r from-green-500 to-green-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}>
            <p className="text-sm break-words">{message.text}</p>
            <p className={`text-xs mt-1 ${
              message.sender === 'me' 
                ? 'text-white/80' 
                : 'text-gray-500'
            }`}>
              {message.time}
            </p>
          </div>
          {message.sender === 'me' && isAI && (
            <p className="text-xs text-green-600 mt-1 text-right">AI Generated</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;