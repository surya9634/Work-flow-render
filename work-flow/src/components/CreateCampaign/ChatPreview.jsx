import React from 'react';
import { Smartphone, Wifi, Battery, Signal } from 'lucide-react';

const ChatPreview = ({ campaignData, currentStep }) => {
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
                {/* Step-specific preview */}
                {currentStep >= 3 && (
                  <div className="flex justify-start">
                    <div className="max-w-xs bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {getPreviewMessage()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">7:31 PM</p>
                    </div>
                  </div>
                )}

                {/* Sample response */}
                {currentStep >= 3 && (
                  <div className="flex justify-end">
                    <div className="max-w-xs bg-green-500 text-white rounded-lg p-3">
                      <p className="text-sm">
                        Hey! My main goal this month is to improve my productivity and stay more organized with my tasks.
                      </p>
                      <p className="text-xs opacity-75 mt-1">7:33 PM</p>
                    </div>
                  </div>
                )}

                {/* Flow steps preview */}
                {currentStep >= 4 && campaignData?.flow?.steps?.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-xs bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm text-gray-800">
                        That's awesome! {getProductName()} is perfect for that. Here are some tips to get started...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">7:35 PM</p>
                    </div>
                  </div>
                )}

                {/* Links preview */}
                {currentStep >= 5 && campaignData?.files?.links?.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-xs bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-900">
                        {campaignData.files.links[0].title}
                      </p>
                      <p className="text-xs text-blue-600 truncate">
                        {campaignData.files.links[0].url}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">7:36 PM</p>
                    </div>
                  </div>
                )}

                {/* Opt-out message */}
                {currentStep >= 3 && campaignData?.message?.hasOptOut && (
                  <div className="flex justify-start">
                    <div className="max-w-xs bg-gray-100 rounded-lg p-2">
                      <p className="text-xs text-gray-600 italic">
                        Reply STOP to opt out of messages
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
                    <p className="text-sm text-gray-500">Type a message...</p>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">➤</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Info Panel */}
      <div className="p-4 bg-white border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">{stepPreview.title}</h4>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {stepPreview.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPreview;
