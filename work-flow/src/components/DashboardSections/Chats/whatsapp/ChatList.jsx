import React from 'react';
import ChatItem from './ChatItem';

const ChatList = ({ chats, activeChat, onChatSelect, searchTerm, statusFilter }) => {
  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || chat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      {filteredChats.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No chats found</p>
          <p className="text-sm mt-2">Try adjusting your search or filter</p>
        </div>
      ) : (
        filteredChats.map(chat => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={activeChat?.id === chat.id}
            onClick={() => onChatSelect(chat)}
          />
        ))
      )}
    </div>
  );
};

export default ChatList;