import React, { useState } from 'react';
import { MessageCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import SourceSelector from './SourceSelector';
import UploadModal from './UploadModal';

const AIFineTuning = () => {
  const [selectedSource, setSelectedSource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentItems, setContentItems] = useState([]);
  const [showFABMenu, setShowFABMenu] = useState(false);

  const handleSourceSelect = (sourceType) => {
    setSelectedSource(sourceType);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSource(null);
  };

  const handleContentSubmit = (sourceType, data) => {
    // Process the submitted content based on type
    const newItem = {
      id: Date.now(),
      type: sourceType,
      data,
      status: 'processing',
      timestamp: new Date().toISOString()
    };
    
    setContentItems(prev => [...prev, newItem]);
    
    // Simulate processing
    setTimeout(() => {
      setContentItems(prev => 
        prev.map(item => 
          item.id === newItem.id 
            ? { ...item, status: 'completed' }
            : item
        )
      );
    }, 2000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'file': return 'File Upload';
      case 'url': return 'URL';
      case 'text': return 'Plain Text';
      case 'qa': return 'Q&A';
      default: return 'Content';
    }
  };

  return (
    <div className="h-full w-full">
      <div className="bg-white rounded-xl shadow-sm h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">AI Fine-Tuning</h2>
          <p className="text-gray-600 mt-1">
            Train your AI with custom content sources
          </p>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {contentItems.length === 0 ? (
            // Empty State with Source Selector
            <div className="p-6 h-full flex items-center justify-center">
              <SourceSelector onSourceSelect={handleSourceSelect} />
            </div>
          ) : (
            // Content List View
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Training Content ({contentItems.length})
                </h3>
                <button
                  onClick={() => setShowFABMenu(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Add More Content</span>
                </button>
              </div>

              {/* Content Items Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contentItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">
                        {getTypeLabel(item.type)}
                      </span>
                      {getStatusIcon(item.status)}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {item.type === 'file' && (
                        <span>{item.data.files?.length || 0} file(s)</span>
                      )}
                      {item.type === 'url' && (
                        <span>{item.data.urls?.filter(url => url.trim()).length || 0} URL(s)</span>
                      )}
                      {item.type === 'text' && (
                        <span>{item.data.text?.length || 0} characters</span>
                      )}
                      {item.type === 'qa' && (
                        <span>{item.data.qaItems?.length || 0} Q&A pair(s)</span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Content Button (Centered) */}
              <div className="mt-12 text-center">
                <SourceSelector onSourceSelect={handleSourceSelect} />
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button (FAB) - Relative to container */}
        <div className="absolute bottom-6 right-6">
          <div className="relative">
            {/* FAB Menu */}
            {showFABMenu && (
              <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px]">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Help & Support
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Training Guide
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Best Practices
                </button>
              </div>
            )}
            
            {/* FAB Button */}
            <button
              onClick={() => setShowFABMenu(!showFABMenu)}
              className="w-14 h-14 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* FAB Overlay */}
        {showFABMenu && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowFABMenu(false)}
          />
        )}
      </div>

      {/* Upload Modal - Outside the main container */}
      <UploadModal
        sourceType={selectedSource}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleContentSubmit}
      />
    </div>
  );
};

export default AIFineTuning;