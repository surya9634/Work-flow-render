import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ message, isAI = false }) => {
  const isCustomer = message.sender === 'customer';
  
  return (
    <div className={`flex mb-4 ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
        isCustomer 
          ? 'bg-blue-500 text-white rounded-br-md' 
          : 'bg-gray-100 text-gray-800 rounded-bl-md'
      }`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.message}
        </p>
        
        {/* Timestamp and read status */}
        <div className={`flex items-center justify-end mt-1 space-x-1 ${
          isCustomer ? 'text-blue-100' : 'text-gray-500'
        }`}>
          <span className="text-xs">
            {message.timestamp}
          </span>
          {isCustomer && (
            <div className="flex items-center">
              {message.isRead ? (
                <CheckCheck className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
