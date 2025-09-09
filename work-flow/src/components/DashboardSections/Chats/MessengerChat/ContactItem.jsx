import React from 'react';

const ContactItem = ({ contact, isSelected, onClick }) => {
  return (
    <div
      className={`flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 border-b border-gray-100 ${
        isSelected ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
      }`}
      onClick={() => onClick(contact)}
    >
      {/* Avatar with online status */}
      <div className="relative flex-shrink-0 mr-3">
        <img
          src={contact.avatar}
          alt={contact.name}
          onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`; }}
          className="w-12 h-12 rounded-full object-cover"
        />
        {contact.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      {/* Contact info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {contact.name}
          </h4>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            {contact.timestamp}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate leading-tight">
          {contact.lastMessage}
        </p>
      </div>
    </div>
  );
};

export default ContactItem;
