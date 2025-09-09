import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link2, FileText, HelpCircle, Plus } from 'lucide-react';

const SourceSelector = ({ onSourceSelect, showAsButton = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const sources = [
    {
      type: 'file',
      icon: Upload,
      title: 'File Upload',
      description: 'Upload documents, PDFs, or text files'
    },
    {
      type: 'url',
      icon: Link2,
      title: 'URL / Website',
      description: 'Add content from websites or links'
    },
    {
      type: 'text',
      icon: FileText,
      title: 'Plain Text',
      description: 'Paste or type content directly'
    },
    {
      type: 'qa',
      icon: HelpCircle,
      title: 'Q&A',
      description: 'Add question and answer pairs'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  const handleSourceClick = (sourceType) => {
    setShowDropdown(false);
    onSourceSelect(sourceType);
  };

  // Button mode - shows as "Add More Content" button with dropdown
  if (showAsButton) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add More Content</span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-2">
              {sources.map((source) => (
                <button
                  key={source.type}
                  onClick={() => handleSourceClick(source.type)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <source.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{source.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{source.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default grid mode - shows as the main selector grid
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Feed your AI</h3>
        <p className="text-gray-600">Choose a content source to train your AI assistant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((source) => (
          <button
            key={source.type}
            onClick={() => onSourceSelect(source.type)}
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all duration-200 group text-left"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <source.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900 mb-1">{source.title}</h4>
                <p className="text-sm text-gray-600">{source.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SourceSelector;