import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ message, isAI = false }) => {
  const isCustomer = message.sender === 'customer';
  const text = message.text || message.message || '';
  // Always show only HH:mm; if timestamp looks ISO, convert, else show as-is
  const time = (() => {
    const t = message.timestamp || '';
    const d = new Date(t);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If already a short time like "15:07", just return
    if (/^\d{1,2}:\d{2}$/.test(String(t))) return t;
    return String(t);
  })();
  
  return (
    <div className={`flex mb-4 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
        isCustomer 
          ? 'bg-gray-100 text-gray-800 rounded-bl-md' 
          : 'bg-blue-500 text-white rounded-br-md'
      }`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {text}
        </p>
        
        {/* Timestamp and read status */}
        <div className={`flex items-center justify-end mt-1 space-x-1 ${
          isCustomer ? 'text-gray-500' : 'text-blue-100'
        }`}>
          <span className="text-xs">
            {time}
          </span>
          {!isCustomer && (
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
