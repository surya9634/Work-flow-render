import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import ChatFilter from './ChatFilter';
import CustomerDetails from './CustomerDetails';

// Mock customer data - in production, this would come from your API
const customerData = {
  1: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA',
    company: 'Tech Solutions Inc.',
    timezone: 'EST (UTC-5)',
    lastSeen: '2 minutes ago',
    joinedDate: 'January 15, 2024',
    totalPurchases: 12,
    lifetimeValue: '$2,450',
    preferredLanguage: 'English',
    customerSince: '1 year ago',
    tags: ['Premium', 'Tech Industry', 'Responsive'],
    notes: 'Prefers email communication. Key decision maker for company purchases.',
    recentOrders: [
      { id: 'ORD-001', date: '2024-12-15', amount: '$350', status: 'Delivered' },
      { id: 'ORD-002', date: '2024-11-28', amount: '$180', status: 'Delivered' }
    ]
  },
  2: {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+1 (555) 234-5678',
    location: 'Los Angeles, CA',
    company: 'Creative Agency',
    timezone: 'PST (UTC-8)',
    lastSeen: '1 hour ago',
    joinedDate: 'March 22, 2024',
    totalPurchases: 8,
    lifetimeValue: '$1,820',
    preferredLanguage: 'English',
    customerSince: '10 months ago',
    tags: ['Regular', 'Creative', 'Mobile User'],
    notes: 'Interested in bulk discounts. Usually orders on behalf of her team.',
    recentOrders: [
      { id: 'ORD-003', date: '2024-12-20', amount: '$220', status: 'Processing' },
      { id: 'ORD-004', date: '2024-12-01', amount: '$150', status: 'Delivered' }
    ]
  },
  3: {
    name: 'Project Team',
    email: 'team@projectgroup.com',
    phone: '+1 (555) 345-6789',
    location: 'Chicago, IL',
    company: 'Project Group LLC',
    timezone: 'CST (UTC-6)',
    lastSeen: '1 day ago',
    joinedDate: 'June 10, 2024',
    totalPurchases: 5,
    lifetimeValue: '$980',
    preferredLanguage: 'English',
    customerSince: '7 months ago',
    tags: ['Team Account', 'B2B', 'Quarterly Orders'],
    notes: 'Group account with multiple stakeholders. Requires approval for orders over $500.',
    recentOrders: [
      { id: 'ORD-005', date: '2024-11-30', amount: '$450', status: 'Delivered' }
    ]
  },
  4: {
    name: 'Client Support',
    email: 'support@clientcorp.com',
    phone: '+1 (555) 456-7890',
    location: 'Austin, TX',
    company: 'Client Corp',
    timezone: 'CST (UTC-6)',
    lastSeen: '3 days ago',
    joinedDate: 'September 5, 2024',
    totalPurchases: 3,
    lifetimeValue: '$560',
    preferredLanguage: 'English',
    customerSince: '4 months ago',
    tags: ['New Customer', 'Support Team'],
    notes: 'Recently onboarded. May need additional guidance with platform features.',
    recentOrders: [
      { id: 'ORD-006', date: '2024-12-10', amount: '$120', status: 'Delivered' }
    ]
  },
  5: {
    name: 'Alex Chen',
    email: 'alex.chen@startup.io',
    phone: '+1 (555) 567-8901',
    location: 'Seattle, WA',
    company: 'Innovation Startup',
    timezone: 'PST (UTC-8)',
    lastSeen: '5 hours ago',
    joinedDate: 'November 1, 2024',
    totalPurchases: 2,
    lifetimeValue: '$320',
    preferredLanguage: 'English',
    customerSince: '2 months ago',
    tags: ['Startup', 'Growth Potential'],
    notes: 'Founder of a growing startup. Interested in partnership opportunities.',
    recentOrders: [
      { id: 'ORD-007', date: '2024-12-22', amount: '$200', status: 'Shipped' }
    ]
  },
  6: {
    name: 'Design Review',
    email: 'design@reviewstudio.com',
    phone: '+1 (555) 678-9012',
    location: 'San Francisco, CA',
    company: 'Review Studio',
    timezone: 'PST (UTC-8)',
    lastSeen: '2 days ago',
    joinedDate: 'August 15, 2024',
    totalPurchases: 7,
    lifetimeValue: '$1,340',
    preferredLanguage: 'English',
    customerSince: '5 months ago',
    tags: ['Design Agency', 'Frequent Buyer'],
    notes: 'Values quick turnaround times. Often needs rush delivery.',
    recentOrders: [
      { id: 'ORD-008', date: '2024-12-18', amount: '$280', status: 'Delivered' },
      { id: 'ORD-009', date: '2024-12-05', amount: '$190', status: 'Delivered' }
    ]
  }
};

function WhatsappChat() {
  const [chats, setChats] = useState([
    { id: 1, name: 'John Doe', lastMessage: 'Hey, how are you?', time: '10:30 AM', status: 'Active', lastMessageTime: new Date().getTime() - 3600000 },
    { id: 2, name: 'Sarah Wilson', lastMessage: 'Meeting tomorrow at 3?', time: '9:45 AM', status: 'Active', lastMessageTime: new Date().getTime() - 7200000 },
    { id: 3, name: 'Project Team', lastMessage: 'Draft is ready for review', time: 'Yesterday', status: 'Draft', lastMessageTime: new Date().getTime() - 86400000 },
    { id: 4, name: 'Client Support', lastMessage: 'Ticket has been resolved', time: 'Yesterday', status: 'Closed', lastMessageTime: new Date().getTime() - 90000000 },
    { id: 5, name: 'Alex Chen', lastMessage: 'Will get back to you soon', time: '2 days ago', status: 'Paused', lastMessageTime: new Date().getTime() - 172800000 },
    { id: 6, name: 'Design Review', lastMessage: 'Please check the mockups', time: '3 days ago', status: 'Assign to me', lastMessageTime: new Date().getTime() - 259200000 },
  ]);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [aiMode, setAiMode] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // Handle status change from ChatWindow
  const handleStatusChange = (chatId, newStatus) => {
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          status: newStatus
        };
      }
      return chat;
    });
    setChats(updatedChats);
    
    // Update activeChat if it's the one being changed
    if (activeChat && activeChat.id === chatId) {
      setActiveChat({
        ...activeChat,
        status: newStatus
      });
    }
  };

  // Simulate incoming client messages when AI mode is active
  useEffect(() => {
    if (aiMode && activeChat) {
      // Simulate a client message after 3 seconds
      const clientMessageTimer = setTimeout(() => {
        const clientMessages = [
          "Can you help me with my order?",
          "I need assistance with the product",
          "When will my delivery arrive?",
          "I have a question about pricing",
          "Is this item available in other colors?"
        ];
        
        const randomMessage = clientMessages[Math.floor(Math.random() * clientMessages.length)];
        const clientMessage = {
          id: messages.length + 1,
          sender: 'other',
          text: randomMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, clientMessage]);
        
        // Update chat's last message
        updateChatLastMessage(activeChat.id, randomMessage, clientMessage.time);
      }, 3000);

      return () => clearTimeout(clientMessageTimer);
    }
  }, [aiMode, activeChat, messages.length]);

  // Auto-reply to client messages when AI mode is active
  useEffect(() => {
    if (aiMode && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Only auto-reply to client messages (not our own)
      if (lastMessage.sender === 'other') {
        const aiReplyTimer = setTimeout(() => {
          const aiReplies = [
            "I understand your concern. Let me help you with that right away.",
            "Thank you for reaching out. I'm checking this for you now.",
            "I'll be happy to assist you with this request.",
            "Let me look into that for you. One moment please.",
            "I've received your message and I'm working on a solution."
          ];
          
          const randomReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
          const aiMessage = {
            id: messages.length + 1,
            sender: 'me',
            text: randomReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          setMessages(prev => [...prev, aiMessage]);
          
          // Update chat's last message
          if (activeChat) {
            updateChatLastMessage(activeChat.id, randomReply, aiMessage.time);
          }
        }, 1500);

        return () => clearTimeout(aiReplyTimer);
      }
    }
  }, [messages, aiMode, activeChat]);

  // Update chat status when AI mode changes
  useEffect(() => {
    if (activeChat && aiMode) {
      handleStatusChange(activeChat.id, 'Assign to me');
    }
  }, [aiMode]);

  useEffect(() => {
    if (activeChat) {
      // Initialize with some messages for the active chat
      setMessages([
        { id: 1, sender: 'other', text: 'Hey there! How can I help you today?', time: '10:00 AM' },
        { id: 2, sender: 'me', text: 'Hi! I need some assistance with my project.', time: '10:02 AM' },
      ]);
    }
  }, [activeChat]);

  const updateChatLastMessage = (chatId, message, time) => {
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          lastMessage: message,
          time: time,
          lastMessageTime: new Date().getTime()
        };
      }
      return chat;
    });
    
    // Sort chats by lastMessageTime (most recent first)
    updatedChats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    setChats(updatedChats);
  };

  const handleSendMessage = (text) => {
    const newMessage = {
      id: messages.length + 1,
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);

    // Update the chat's last message and move it to top
    if (activeChat) {
      updateChatLastMessage(activeChat.id, text, newMessage.time);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col h-full">
        {/* Header with Filters - Fixed */}
        <div className="flex-shrink-0">
          <ChatFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>

        {/* Chat List - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <ChatList
            chats={chats}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
          />
        </div>
      </div>

      {/* Chat Window */}
      <ChatWindow
        activeChat={activeChat ? { ...activeChat, status: chats.find(c => c.id === activeChat.id)?.status } : null}
        messages={messages}
        onSendMessage={handleSendMessage}
        aiMode={aiMode}
        onToggleAI={() => setAiMode(!aiMode)}
        onStatusChange={handleStatusChange}
        isDetailsOpen={isDetailsOpen}
        onToggleDetails={() => setIsDetailsOpen(!isDetailsOpen)}
      />

      {/* Customer Details Panel */}
      {activeChat && (
        <CustomerDetails
          customer={customerData[activeChat.id]}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          messages={messages}
        />
      )}
    </div>
  );
}

export default WhatsappChat;