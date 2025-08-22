import React, { useState, useEffect } from 'react';
import { MessageCircle, Instagram, Linkedin, Facebook, Mail, Phone } from 'lucide-react';
import { FaWhatsapp, FaTwitter, FaTelegram } from 'react-icons/fa';

const AVAILABLE_CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: FaWhatsapp, color: 'text-green-500' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-500'}
  
];

const CampaignBrief = ({ data, onChange, validation }) => {
  const [detectedChannels, setDetectedChannels] = useState([]);

  // Auto-detect channels from description text
  useEffect(() => {
    if (data.description) {
      const text = data.description.toLowerCase();
      const detected = AVAILABLE_CHANNELS.filter(channel => 
        text.includes(channel.name.toLowerCase()) || 
        text.includes(channel.id)
      );
      setDetectedChannels(detected.map(c => c.id));
    }
  }, [data.description]);

  const handleDescriptionChange = (e) => {
    onChange({ description: e.target.value });
  };

  const toggleChannel = (channelId) => {
    const newChannels = data.channels.includes(channelId)
      ? data.channels.filter(id => id !== channelId)
      : [...data.channels, channelId];
    onChange({ channels: newChannels });
  };

  const isChannelSelected = (channelId) => {
    return data.channels.includes(channelId) || detectedChannels.includes(channelId);
  };

  return (
    <div className="space-y-6">
      {/* Helper Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-amber-500 text-lg">🌟</span>
          <p className="text-amber-800 text-sm">
            Talk about what you want to achieve with this campaign
          </p>
        </div>
      </div>

      {/* Description Textarea */}
      <div className="space-y-2">
        <label 
          htmlFor="campaign-description"
          className="block text-sm font-medium text-gray-700"
        >
          Describe your campaign in a short brief.
        </label>
        <textarea
          id="campaign-description"
          value={data.description}
          onChange={handleDescriptionChange}
          placeholder="Launching an online campaign for WorkFlow can position your product as the ultimate tool for productivity and goal-setting, especially among college students, creatives, and startup enthusiasts. Start by clearly defining the campaign's purpose: 'to create awareness and sell WorkFlow to 100+ users within the first month by leveraging Instagram and WhatsApp.'"
          className={`w-full h-32 px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            validation === false ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          aria-describedby={validation === false ? 'description-error' : undefined}
        />
        {validation === false && (
          <p id="description-error" className="text-red-600 text-sm">
            Please provide a campaign description (minimum 10 characters)
          </p>
        )}
      </div>

      {/* Channel Detection and Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Choose Platform</h3>
          {detectedChannels.length > 0 && (
            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {detectedChannels.length} detected
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {AVAILABLE_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const isSelected = isChannelSelected(channel.id);
            const isDetected = detectedChannels.includes(channel.id);
            
            return (
              <button
                key={channel.id}
                onClick={() => toggleChannel(channel.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isDetected ? 'ring-2 ring-blue-200' : ''}`}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? 'Remove' : 'Add'} ${channel.name}`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : channel.color}`} />
                <span className={`text-sm font-medium ${
                  isSelected ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  {channel.name}
                </span>
                {isDetected && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Auto-detected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Channels Summary */}
      {(data.channels.length > 0 || detectedChannels.length > 0) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Channels:</h4>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CHANNELS
              .filter(channel => isChannelSelected(channel.id))
              .map(channel => {
                const Icon = channel.icon;
                return (
                  <span
                    key={channel.id}
                    className="inline-flex items-center space-x-1 bg-white px-3 py-1 rounded-full border text-sm"
                  >
                    <Icon className={`w-4 h-4 ${channel.color}`} />
                    <span>{channel.name}</span>
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignBrief;
