import React, { useState } from 'react';
import { MessageSquare, Send, UserX, Plus } from 'lucide-react';

const VARIABLE_SUGGESTIONS = [
  { variable: '{{name}}', description: 'Recipient\'s name' },
  { variable: '{{company}}', description: 'Company name' },
  { variable: '{{position}}', description: 'Job position' },
  { variable: '{{product}}', description: 'Your product name' },
  { variable: '{{sender}}', description: 'Your name' },
  { variable: '{{team}}', description: 'Your team name' },
];

const OutreachMessage = ({ data, onChange, validation, campaignData }) => {
  const [showVariables, setShowVariables] = useState(false);

  const handleInitialMessageChange = (e) => {
    onChange({ initialMessage: e.target.value });
  };

  const handleFollowUpMessageChange = (e) => {
    onChange({ followUpMessage: e.target.value });
  };

  const handleOptOutToggle = (e) => {
    onChange({ hasOptOut: e.target.checked });
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('initial-message');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = data.initialMessage;
    const newText = text.substring(0, start) + variable + text.substring(end);
    
    onChange({ initialMessage: newText });
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const getPersonaName = () => {
    return campaignData?.persona?.name || '[Sender]';
  };

  const getProductName = () => {
    // Extract product name from campaign brief
    const brief = campaignData?.brief?.description || '';
    const match = brief.match(/for\s+(\w+)/i);
    return match ? match[1] : '[YourProduct]';
  };

  const getTeamName = () => {
    return `Team ${getProductName()}`;
  };

  const previewMessage = () => {
    let preview = data.initialMessage;
    preview = preview.replace(/\{\{name\}\}/g, '[Recipient Name]');
    preview = preview.replace(/\{\{sender\}\}/g, getPersonaName());
    preview = preview.replace(/\{\{product\}\}/g, getProductName());
    preview = preview.replace(/\{\{team\}\}/g, getTeamName());
    preview = preview.replace(/\{\{company\}\}/g, '[Company]');
    preview = preview.replace(/\{\{position\}\}/g, '[Position]');
    return preview;
  };

  const isFieldInvalid = (field) => {
    return validation === false && !data[field]?.trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
          <Send className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Outreach Message</h2>
        <p className="text-gray-600">Craft your initial outreach template</p>
      </div>

      {/* Initial Message */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="initial-message" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Initial Message *</span>
            </div>
          </label>
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Variable</span>
          </button>
        </div>

        {/* Variable Suggestions */}
        {showVariables && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-blue-900">Available Variables:</h4>
            <div className="grid grid-cols-2 gap-2">
              {VARIABLE_SUGGESTIONS.map((item) => (
                <button
                  key={item.variable}
                  onClick={() => insertVariable(item.variable)}
                  className="text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                >
                  <div className="font-mono text-sm text-blue-700">{item.variable}</div>
                  <div className="text-xs text-blue-600">{item.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          id="initial-message"
          value={data.initialMessage}
          onChange={handleInitialMessageChange}
          placeholder={`Hey {{name}}, this is ${getPersonaName()} from ${getTeamName()}! We're excited to help you achieve your ambitions. What's your #1 goal this month?`}
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none font-mono text-sm ${
            isFieldInvalid('initialMessage') ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          aria-describedby={isFieldInvalid('initialMessage') ? 'message-error' : undefined}
        />
        {isFieldInvalid('initialMessage') && (
          <p id="message-error" className="text-red-600 text-sm">
            Please provide an initial message (minimum 10 characters)
          </p>
        )}

        {/* Message Preview */}
        {data.initialMessage && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {previewMessage()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Opt-out Option */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <input
            id="opt-out-toggle"
            type="checkbox"
            checked={data.hasOptOut}
            onChange={handleOptOutToggle}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="opt-out-toggle" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <UserX className="w-4 h-4" />
            <span>Give opt-out option to users</span>
          </label>
        </div>
        {data.hasOptOut && (
          <div className="ml-7 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ An opt-out option will be automatically added to your messages to comply with messaging regulations.
            </p>
          </div>
        )}
      </div>

      {/* Follow-up Message */}
      <div className="space-y-2">
        <label htmlFor="followup-message" className="block text-sm font-medium text-gray-700">
          Followup Message (Optional)
        </label>
        <textarea
          id="followup-message"
          value={data.followUpMessage}
          onChange={handleFollowUpMessageChange}
          placeholder="Hi there! I'm following up to see if you had a chance to think about your goals this month. Would love to chat"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
        />
      </div>

      {/* Message Statistics */}
      {data.initialMessage && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Message Statistics:</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {data.initialMessage.length}
              </div>
              <div className="text-xs text-gray-600">Characters</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {data.initialMessage.split(' ').filter(word => word.length > 0).length}
              </div>
              <div className="text-xs text-gray-600">Words</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${
                data.initialMessage.length > 160 ? 'text-amber-600' : 'text-green-600'
              }`}>
                {data.initialMessage.length <= 160 ? '✓' : '⚠️'}
              </div>
              <div className="text-xs text-gray-600">SMS Length</div>
            </div>
          </div>
          {data.initialMessage.length > 160 && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              Message exceeds standard SMS length (160 characters)
            </p>
          )}
        </div>
      )}

      {/* Validation Summary */}
      {validation === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
            <div>
              <h4 className="text-red-800 font-medium">Please complete required fields</h4>
              <p className="text-red-700 text-sm mt-1">
                An initial outreach message is required to proceed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutreachMessage;
