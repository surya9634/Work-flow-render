import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Wifi, Battery, Signal, Send, RotateCcw, BarChart3, MessageSquare } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const ChatPreview = ({ campaignData, currentStep }) => {
  const [conversation, setConversation] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(`preview-${Date.now()}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const getPersonaName = () => {
    return campaignData?.persona?.name || 'Team Member';
  };

  const getProductName = () => {
    const brief = campaignData?.brief?.description || '';
    const match = brief.match(/for\s+(\w+)/i);
    return match ? match[1] : 'WorkFlow';
  };

  const getPreviewMessage = () => {
    let message = campaignData?.message?.initialMessage || '';
    if (!message) {
      message = `Hey {{name}}, this is ${getPersonaName()} from Team ${getProductName()}! We're excited to help you achieve your ambitions. What's your first choice?`;
    }

    // Replace variables with preview values
    message = message.replace(/\{\{name\}\}/g, '[name]');
    message = message.replace(/\{\{sender\}\}/g, getPersonaName());
    message = message.replace(/\{\{product\}\}/g, getProductName());
    message = message.replace(/\{\{team\}\}/g, `Team ${getProductName()}`);
    message = message.replace(/\{\{company\}\}/g, '[company]');
    message = message.replace(/\{\{position\}\}/g, '[position]');

    return message;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to conversation
    const newConversation = [...conversation, {
      id: Date.now(),
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    }];
    setConversation(newConversation);

    try {
      // Call global AI API
      const response = await apiFetch('/api/global-ai/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMessage,
          userId: 'preview-user',
          conversationId: conversationId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add AI response to conversation
        setConversation(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          text: data.reply || 'Sorry, I couldn\'t generate a response.',
          timestamp: new Date(),
          sources: data.sources
        }]);
      } else {
        setConversation(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          text: 'Error: Could not get AI response.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setConversation(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: 'Error: Failed to connect to AI service.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setConversation([]);
    setConversationId(`preview-${Date.now()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStepPreview = () => {
    switch (currentStep) {
      case 0: // Campaign Brief
        return {
          title: 'Campaign Overview',
          content: campaignData?.brief?.description || 'Your campaign description will appear here...'
        };
      case 1: // Persona
        return {
          title: 'Chat Persona',
          content: `Name: ${campaignData?.persona?.name || '[Name]'}\nPosition: ${campaignData?.persona?.position || '[Position]'}\nTone: ${campaignData?.persona?.tone || '[Tone]'}`
        };
      case 2: // Target Leads
        return {
          title: 'Target Audience',
          content: `Audience: ${campaignData?.leads?.targetAudience || '[Target Audience]'}\n\nSource: ${campaignData?.leads?.leadSource || '[Lead Source]'}`
        };
      case 3: // Outreach Message
        return {
          title: 'Initial Message',
          content: getPreviewMessage()
        };
      case 4: // Chat Flow
        return {
          title: 'Conversation Flow',
          content: campaignData?.flow?.objective || 'Your conversation objective will appear here...'
        };
      case 5: // Files & Links
        return {
          title: 'Resources',
          content: `Links: ${campaignData?.files?.links?.length || 0}\nFiles: ${campaignData?.files?.attachments?.length || 0}`
        };
      default:
        return {
          title: 'Preview',
          content: 'Campaign preview will appear here...'
        };
    }
  };

  const stepPreview = getStepPreview();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Simulate and test how your prospects might chat!
        </h3>
        <p className="text-sm text-gray-600">
          Preview how your campaign will look to recipients
        </p>
      </div>

      {/* Phone Mockup */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-80 h-[600px] bg-black rounded-[3rem] p-2 shadow-2xl">
            <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col">
              {/* Status Bar */}
              <div className="flex items-center justify-between px-6 py-2 bg-gray-50 text-xs">
                <span className="font-medium">7:28</span>
                <div className="flex items-center space-x-1">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-4 h-3" />
                </div>
              </div>

              {/* Chat Header */}
              <div className="flex items-center space-x-3 p-4 bg-green-500 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {getProductName().charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{getProductName()}</h4>
                  <p className="text-xs opacity-90">● Online</p>
                </div>
                <div className="flex space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">📞</span>
                  </div>
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">⋮</span>
                  </div>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
                {/* Initial campaign message if no conversation */}
                {conversation.length === 0 && currentStep >= 3 && (
                  <div className="flex justify-start">
                    <div className="max-w-xs bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {getPreviewMessage()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">7:31 PM</p>
                    </div>
                  </div>
                )}

                {/* Conversation messages */}
                {conversation.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-lg p-3 shadow-sm ${
                      msg.type === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <p className="text-xs opacity-75 mt-1">
                          Sources: {msg.sources.join(', ')}
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${
                        msg.type === 'user' ? 'opacity-75' : 'text-gray-500'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-xs bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-xs text-gray-500">AI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message to test Global AI..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Info Panel */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">{stepPreview.title}</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetConversation}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Analytics */}
        {conversation.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-2 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-xs text-blue-600 font-medium">Messages</div>
                <div className="text-sm font-semibold text-blue-800">
                  {conversation.filter(m => m.type === 'user').length} sent, {conversation.filter(m => m.type === 'ai').length} received
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-xs text-green-600 font-medium">Session</div>
                <div className="text-sm font-semibold text-green-800">
                  {Math.round((new Date() - new Date(conversationId.split('-')[1])) / 1000 / 60)} min
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {stepPreview.content}
          </p>
        </div>

        {/* Global AI Status */}
        <div className="mt-3 text-xs text-gray-500 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Global AI ready for testing</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPreview;
