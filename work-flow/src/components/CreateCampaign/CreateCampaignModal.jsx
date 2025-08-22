import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import CampaignBrief from './steps/CampaignBrief';
import PersonaDefinition from './steps/PersonaDefinition';
import TargetLeads from './steps/TargetLeads';
import OutreachMessage from './steps/OutreachMessage';
import ChatFlow from './steps/ChatFlow';
import FilesAndLinks from './steps/FilesAndLinks';
import ChatPreview from './ChatPreview';

const STEPS = [
  { id: 'brief', title: 'Campaign Brief', component: CampaignBrief },
  { id: 'persona', title: 'Persona Definition', component: PersonaDefinition },
  { id: 'leads', title: 'Target Leads', component: TargetLeads },
  { id: 'message', title: 'Outreach Message', component: OutreachMessage },
  { id: 'flow', title: 'Chat Flow', component: ChatFlow },
  { id: 'files', title: 'Files & Links', component: FilesAndLinks },
];

const CreateCampaignModal = ({ isOpen, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignData, setCampaignData] = useState({
    brief: {
      description: '',
      channels: [],
    },
    persona: {
      name: '',
      position: '',
      tone: '',
      notes: '',
    },
    leads: {
      targetAudience: '',
      leadSource: '',
    },
    message: {
      initialMessage: '',
      hasOptOut: true,
      followUpMessage: '',
    },
    flow: {
      objective: '',
      steps: [],
    },
    files: {
      links: [],
      attachments: [],
    },
  });
  const [stepValidation, setStepValidation] = useState({});

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setStepValidation({});
    }
  }, [isOpen]);

  const updateCampaignData = (stepKey, data) => {
    setCampaignData(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...data }
    }));
  };

  const validateStep = (stepIndex) => {
    const step = STEPS[stepIndex];
    const stepData = campaignData[step.id];
    
    switch (step.id) {
      case 'brief':
        return stepData.description.trim().length > 10;
      case 'persona':
        return stepData.name.trim() && stepData.position.trim() && stepData.tone;
      case 'leads':
        return stepData.targetAudience.trim() && stepData.leadSource.trim();
      case 'message':
        return stepData.initialMessage.trim().length > 10;
      case 'flow':
        return stepData.objective.trim() && stepData.steps.length > 0;
      case 'files':
        return true; // Optional step
      default:
        return true;
    }
  };

  const handleNext = () => {
    const isValid = validateStep(currentStep);
    setStepValidation(prev => ({ ...prev, [currentStep]: isValid }));
    
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    const isValid = validateStep(currentStep);
    setStepValidation(prev => ({ ...prev, [currentStep]: isValid }));
    
    if (isValid) {
      onSave(campaignData);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const CurrentStepComponent = STEPS[currentStep].component;
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden"
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Left Panel - Form */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Previous step"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 id="modal-title" className="text-2xl font-bold text-gray-900">
                  {STEPS[currentStep].title}
                </h1>
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {STEPS.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    index <= currentStep
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <CurrentStepComponent
                  data={campaignData[STEPS[currentStep].id]}
                  onChange={(data) => updateCampaignData(STEPS[currentStep].id, data)}
                  validation={stepValidation[currentStep]}
                  campaignData={campaignData}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <div className="flex space-x-3">
              {!isLastStep ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                >
                  Create Campaign
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Chat Preview */}
        <div className="w-96 border-l border-gray-200 bg-gray-50">
          <ChatPreview campaignData={campaignData} currentStep={currentStep} />
        </div>
      </motion.div>
    </div>
  );
};

export default CreateCampaignModal;
