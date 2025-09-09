import React, { useEffect, useState } from 'react';
import { X, Zap, Settings, Play, Pause, FileText } from 'lucide-react';

const CustomAutomationModal = ({ 
  isOpen, 
  isEdit, 
  customAutomation, 
  platforms, 
  triggers, 
  actions, 
  onClose, 
  onChange, 
  onSubmit 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4 text-green-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'draft': return <FileText className="w-4 h-4 text-gray-500" />;
      default: return <Settings className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-50 border-green-200 text-green-700';
      case 'paused': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'draft': return 'bg-gray-50 border-gray-200 text-gray-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isAnimating 
          ? ' bg-opacity-50 backdrop-blur-sm' 
          : ' bg-opacity-0 backdrop-blur-sm'
      }`}
      onClick={handleBackdropClick}
    >
      <div className={`
        relative bg-white rounded-2xl shadow-2xl w-full max-w-lg
        transform transition-all duration-300 ease-out
        ${isAnimating 
          ? 'scale-100 translate-y-0 opacity-100 rotate-0' 
          : 'scale-95 translate-y-8 opacity-0 rotate-1'
        }
      `}>
        {/* Header with gradient accent */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
          <div className="relative px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`
                  p-2 rounded-lg transition-all duration-200
                  ${isEdit ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}
                `}>
                  {isEdit ? <Settings className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isEdit ? 'Edit Automation' : 'Create Automation'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {isEdit ? 'Modify your automation settings' : 'Set up a new automation workflow'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white hover:bg-opacity-80 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="px-6 py-6 space-y-6">
          {/* Automation Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Automation Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={customAutomation.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                className={`
                  w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-out
                  placeholder-gray-400 text-gray-900 bg-gray-50
                  hover:bg-white hover:border-gray-300
                  focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none
                  ${focusedField === 'name' ? 'transform scale-[1.01]' : ''}
                `}
                placeholder="e.g., Lead Follow-up Sequence"
              />
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Platform
            </label>
            <select
              value={customAutomation.platform || ''}
              onChange={(e) => handleChange('platform', e.target.value)}
              onFocus={() => setFocusedField('platform')}
              onBlur={() => setFocusedField(null)}
              className={`
                w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-out
                text-gray-900 bg-gray-50 cursor-pointer
                hover:bg-white hover:border-gray-300
                focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none
                ${focusedField === 'platform' ? 'transform scale-[1.01]' : ''}
              `}
            >
              <option value="">Choose a platform...</option>
              {platforms?.map(platform => (
                <option key={platform.id} value={platform.id}>{platform.name}</option>
              ))}
            </select>
          </div>

          {/* Trigger Event */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Trigger Event
            </label>
            <select
              value={customAutomation.trigger || ''}
              onChange={(e) => handleChange('trigger', e.target.value)}
              onFocus={() => setFocusedField('trigger')}
              onBlur={() => setFocusedField(null)}
              className={`
                w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-out
                text-gray-900 bg-gray-50 cursor-pointer
                hover:bg-white hover:border-gray-300
                focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none
                ${focusedField === 'trigger' ? 'transform scale-[1.01]' : ''}
              `}
            >
              <option value="">Select trigger event...</option>
              {triggers?.map(trigger => (
                <option key={trigger.id} value={trigger.name}>{trigger.name}</option>
              ))}
            </select>
          </div>

          {/* Action Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Action Type
            </label>
            <select
              value={customAutomation.action || ''}
              onChange={(e) => handleChange('action', e.target.value)}
              onFocus={() => setFocusedField('action')}
              onBlur={() => setFocusedField(null)}
              className={`
                w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ease-out
                text-gray-900 bg-gray-50 cursor-pointer
                hover:bg-white hover:border-gray-300
                focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none
                ${focusedField === 'action' ? 'transform scale-[1.01]' : ''}
              `}
            >
              <option value="">Choose an action...</option>
              {actions?.map(action => (
                <option key={action.id} value={action.name}>{action.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Status
            </label>
            <div className="relative">
              <select
                value={customAutomation.status || 'draft'}
                onChange={(e) => handleChange('status', e.target.value)}
                onFocus={() => setFocusedField('status')}
                onBlur={() => setFocusedField(null)}
                className={`
                  w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 ease-out
                  text-gray-900 bg-gray-50 cursor-pointer appearance-none
                  hover:bg-white hover:border-gray-300
                  focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none
                  ${focusedField === 'status' ? 'transform scale-[1.01]' : ''}
                  ${getStatusColor(customAutomation.status)}
                `}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {getStatusIcon(customAutomation.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-gray-50 rounded-b-2xl border-t border-gray-100">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:text-gray-800 hover:bg-white hover:shadow-sm transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!customAutomation.name?.trim()}
              className={`
                px-6 py-2.5 font-medium rounded-xl transition-all duration-200 transform
                focus:outline-none focus:ring-4 focus:ring-blue-100
                ${customAutomation.name?.trim() 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                {isEdit ? <Settings className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                <span>{isEdit ? 'Update Automation' : 'Create Automation'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CustomAutomationModal);