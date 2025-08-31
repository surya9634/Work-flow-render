import React, { useState } from 'react';
import { MessageCircle, Phone, Instagram } from 'lucide-react';
import MessengerChat from './MessengerChat/MessengerChat';
import WhatsappChat from './whatsapp/WhatsappChat';
import InstagramChat from './Instagram/InstagramChat';

const Chats = () => {
  const [activeChat, setActiveChat] = useState('messenger');

  // Auto-switch to Instagram tab if user_id present in URL
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('user_id');
      if (uid) setActiveChat('instagram');
    } catch {}
  }, []);

  const chatOptions = [
    {
      id: 'messenger',
      name: 'Messenger',
      icon: MessageCircle,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      description: 'Facebook Messenger conversations'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: Phone,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      description: 'WhatsApp business conversations'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600',
      description: 'Instagram Direct Messages'
    }
  ];

  const renderActiveChat = () => {
    switch (activeChat) {
      case 'messenger':
        return <MessengerChat />;
      case 'whatsapp':
        return <WhatsappChat />;
      case 'instagram':
        return <InstagramChat />;
      default:
        return <MessengerChat />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Platform Selector */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">Chat Platforms</h2>
        <div className="flex items-center gap-2">
          {chatOptions.map((option) => {
            const IconComponent = option.icon;
            const isActive = activeChat === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => setActiveChat(option.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ${
                  isActive 
                    ? `${option.color} text-white shadow-sm` 
                    : `bg-gray-100 text-gray-600 ${option.hoverColor} hover:text-white`
                }`}
              >
                <IconComponent size={16} />
                <span className="text-sm font-medium">{option.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Chat Component */}
      <div className="flex-1 overflow-hidden">
        {renderActiveChat()}
      </div>
    </div>
  );
};

export default Chats;
