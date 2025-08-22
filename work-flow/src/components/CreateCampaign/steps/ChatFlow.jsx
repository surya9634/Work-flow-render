import React, { useState } from 'react';
import { MessageCircle, Plus, Trash2, ChevronUp, ChevronDown, Edit3 } from 'lucide-react';

const DEFAULT_STEPS = [
  'Start with greeting and ask what their #1 goal is',
  'Listen to their response and provide personalized achievement tips',
  'Introduce your product as a solution to help them reach their goals',
  'Share success stories or testimonials from similar users',
  'Offer a free trial or demo of your product',
  'Follow up with additional resources and support'
];

const ChatFlow = ({ data, onChange, validation }) => {
  const [editingStep, setEditingStep] = useState(null);
  const [newStepText, setNewStepText] = useState('');

  const steps = data.steps.length > 0 ? data.steps : DEFAULT_STEPS;

  const handleObjectiveChange = (e) => {
    onChange({ objective: e.target.value });
  };

  const handleStepEdit = (index, newText) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = newText;
    onChange({ steps: updatedSteps });
    setEditingStep(null);
  };

  const handleAddStep = () => {
    if (newStepText.trim()) {
      const updatedSteps = [...steps, newStepText.trim()];
      onChange({ steps: updatedSteps });
      setNewStepText('');
    }
  };

  const handleRemoveStep = (index) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    onChange({ steps: updatedSteps });
  };

  const moveStepUp = (index) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    onChange({ steps: newSteps });
  };

  const moveStepDown = (index) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    onChange({ steps: newSteps });
  };

  const isFieldInvalid = (field) => {
    if (field === 'objective') {
      return validation === false && !data[field]?.trim();
    }
    if (field === 'steps') {
      return validation === false && steps.length === 0;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
          <MessageCircle className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Chat Flow</h2>
        <p className="text-gray-600">Design your conversation strategy</p>
      </div>

      {/* Campaign Objective */}
      <div className="space-y-2">
        <label htmlFor="campaign-objective" className="block text-sm font-medium text-gray-700">
          Campaign Objective *
        </label>
        <textarea
          id="campaign-objective"
          value={data.objective}
          onChange={handleObjectiveChange}
          placeholder="Create awareness and sell WorkFlow to over 100 users within the first month by engaging them through personalized conversations."
          rows={3}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
            isFieldInvalid('objective') ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          aria-describedby={isFieldInvalid('objective') ? 'objective-error' : undefined}
        />
        {isFieldInvalid('objective') && (
          <p id="objective-error" className="text-red-600 text-sm">
            Please provide a campaign objective
          </p>
        )}
      </div>

      {/* Chat Flow Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Conversation Flow</h3>
          <span className="text-sm text-gray-500">{steps.length} steps</span>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                {/* Move Controls */}
                <div className="flex flex-col space-y-1 mt-1">
                  <button
                    onClick={() => moveStepUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveStepDown(index)}
                    disabled={index === steps.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Step Number */}
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  {editingStep === index ? (
                    <div className="space-y-2">
                      <textarea
                        value={step}
                        onChange={(e) => {
                          const updatedSteps = [...steps];
                          updatedSteps[index] = e.target.value;
                          onChange({ steps: updatedSteps });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingStep(null)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingStep(null)}
                          className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-800 text-sm leading-relaxed">{step}</p>
                  )}
                </div>

                {/* Actions */}
                {editingStep !== index && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingStep(index)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      aria-label="Edit step"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveStep(index)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label="Remove step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Step */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
          <div className="space-y-3">
            <textarea
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="Add a new step to your conversation flow..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
            <button
              onClick={handleAddStep}
              disabled={!newStepText.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Step</span>
            </button>
          </div>
        </div>
      </div>

      {/* Flow Summary */}
      {data.objective && steps.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Flow Summary:</h4>
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-1">Objective:</h5>
              <p className="text-sm text-gray-600">{data.objective}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Conversation Steps:</h5>
              <div className="space-y-1">
                {steps.slice(0, 3).map((step, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {index + 1}. {step.length > 60 ? step.substring(0, 60) + '...' : step}
                  </p>
                ))}
                {steps.length > 3 && (
                  <p className="text-sm text-gray-500 italic">
                    +{steps.length - 3} more steps...
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
                Campaign objective and at least one conversation step are required.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatFlow;
