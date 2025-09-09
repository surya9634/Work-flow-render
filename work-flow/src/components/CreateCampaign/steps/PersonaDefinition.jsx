import React from 'react';
import { User, Briefcase, MessageSquare, FileText } from 'lucide-react';

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and informal' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and excited' },
  { value: 'helpful', label: 'Helpful', description: 'Supportive and solution-focused' },
  { value: 'confident', label: 'Confident', description: 'Assertive and self-assured' },
];

const PersonaDefinition = ({ data, onChange, validation }) => {
  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  const isFieldInvalid = (field) => {
    return validation === false && !data[field]?.trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Create Persona</h2>
        <p className="text-gray-600">Give your chat an identity</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="persona-name" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Name *</span>
            </div>
          </label>
          <input
            id="persona-name"
            type="text"
            value={data.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter name"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              isFieldInvalid('name') ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            aria-describedby={isFieldInvalid('name') ? 'name-error' : undefined}
          />
          {isFieldInvalid('name') && (
            <p id="name-error" className="text-red-600 text-sm">Name is required</p>
          )}
        </div>

        {/* Position Field */}
        <div className="space-y-2">
          <label htmlFor="persona-position" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span>Position *</span>
            </div>
          </label>
          <input
            id="persona-position"
            type="text"
            value={data.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            placeholder="Enter position"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              isFieldInvalid('position') ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            aria-describedby={isFieldInvalid('position') ? 'position-error' : undefined}
          />
          {isFieldInvalid('position') && (
            <p id="position-error" className="text-red-600 text-sm">Position is required</p>
          )}
        </div>

        {/* Tone Dropdown */}
        <div className="space-y-2">
          <label htmlFor="persona-tone" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Tone *</span>
            </div>
          </label>
          <div className="relative">
            <select
              id="persona-tone"
              value={data.tone}
              onChange={(e) => handleInputChange('tone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white ${
                isFieldInvalid('tone') ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              aria-describedby={isFieldInvalid('tone') ? 'tone-error' : undefined}
            >
              <option value="">Select a tone</option>
              {TONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {isFieldInvalid('tone') && (
            <p id="tone-error" className="text-red-600 text-sm">Please select a tone</p>
          )}
        </div>

        {/* Notes Field */}
        <div className="space-y-2">
          <label htmlFor="persona-notes" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Anything to keep in mind</span>
            </div>
          </label>
          <textarea
            id="persona-notes"
            value={data.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Enter description"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          />
        </div>
      </div>

      {/* Persona Preview */}
      {(data.name || data.position || data.tone) && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Persona Preview:</h4>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {data.name ? data.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-gray-900">
                    {data.name || 'Your Name'}
                  </h5>
                  {data.tone && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {TONE_OPTIONS.find(t => t.value === data.tone)?.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {data.position || 'Your Position'}
                </p>
                {data.notes && (
                  <p className="text-sm text-gray-500 mt-1 italic">
                    "{data.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>
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
                Name, Position, and Tone are required to proceed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaDefinition;
