import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const OnboardingForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    userName: '',
    businessDescription: '',
    idealCustomer: '',
    leadSources: [],
    leadSourcesOther: '',
    dealSize: '',
    communicationPlatforms: [],
    communicationOther: '',
    leadHandling: '',
    salesGoal: '',
    customerQuestions: ['', '', ''],
    websiteLinks: '',
    urgency: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;

  // Check if user should be here (only new signups)
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const isNewSignup = localStorage.getItem('isNewSignup');
    
    if (!userString) {
      navigate('/');
      return;
    }

    try {
      const user = JSON.parse(userString);
      
      // If user is admin, redirect to admin panel
      if (user.role === 'admin') {
        navigate('/admin');
        return;
      }
      
      // If user has already completed onboarding and this is not a new signup, redirect to dashboard
      if (user.onboardingCompleted && !isNewSignup) {
        navigate('/dashboard');
        return;
      }
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/');
    }
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCheckboxChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleCustomerQuestionChange = (index, value) => {
    const newQuestions = [...formData.customerQuestions];
    newQuestions[index] = value;
    setFormData(prev => ({
      ...prev,
      customerQuestions: newQuestions
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
        if (!formData.userName.trim()) newErrors.userName = 'Your name is required';
        if (!formData.businessDescription.trim()) newErrors.businessDescription = 'Business description is required';
        if (!formData.idealCustomer.trim()) newErrors.idealCustomer = 'Ideal customer description is required';
        break;
      case 2:
        if (formData.leadSources.length === 0) newErrors.leadSources = 'Please select at least one lead source';
        if (!formData.dealSize) newErrors.dealSize = 'Please select your deal size range';
        break;
      case 3:
        if (formData.communicationPlatforms.length === 0) newErrors.communicationPlatforms = 'Please select at least one platform';
        if (!formData.leadHandling) newErrors.leadHandling = 'Please select how to handle leads';
        if (!formData.salesGoal.trim()) newErrors.salesGoal = 'Sales goal is required';
        break;
      case 4:
        if (!formData.urgency) newErrors.urgency = 'Please select your urgency level';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Get user info from localStorage
      const userString = localStorage.getItem('user');
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      // Resolve API base
      const API_BASE = (import.meta?.env?.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
      
      if (!userString || !token) {
        toast.error('Authentication required. Please login again.');
        navigate('/');
        return;
      }
      
      const user = JSON.parse(userString);
      
      // Send onboarding data to backend
      const response = await fetch(`${API_BASE}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Mark onboarding as completed and remove new signup flag
        const updatedUser = { ...user, onboardingCompleted: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.removeItem('isNewSignup'); // Clear the new signup flag
        
        toast.success('Onboarding completed successfully! 🎉');
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Failed to save onboarding data');
      }
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Name *
        </label>
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Enter your business name"
        />
        {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Name *
        </label>
        <input
          type="text"
          value={formData.userName}
          onChange={(e) => handleInputChange('userName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Enter your full name"
        />
        {errors.userName && <p className="text-red-500 text-sm mt-1">{errors.userName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What does your business sell? *
        </label>
        <p className="text-sm text-gray-500 mb-2">Briefly explain your product/service</p>
        <textarea
          value={formData.businessDescription}
          onChange={(e) => handleInputChange('businessDescription', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          rows="3"
          placeholder="Describe what your business offers..."
        />
        {errors.businessDescription && <p className="text-red-500 text-sm mt-1">{errors.businessDescription}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Who is your ideal customer? *
        </label>
        <p className="text-sm text-gray-500 mb-2">E.g. gym owners, ecommerce brands, real estate agents, etc.</p>
        <input
          type="text"
          value={formData.idealCustomer}
          onChange={(e) => handleInputChange('idealCustomer', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Describe your ideal customer..."
        />
        {errors.idealCustomer && <p className="text-red-500 text-sm mt-1">{errors.idealCustomer}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Where do you want leads from? *
        </label>
        <div className="space-y-2">
          {['Local', 'India', 'USA', 'Global'].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.leadSources.includes(option)}
                onChange={(e) => handleCheckboxChange('leadSources', option, e.target.checked)}
                className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.leadSources.includes('Other')}
              onChange={(e) => handleCheckboxChange('leadSources', 'Other', e.target.checked)}
              className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 mr-2">Other:</span>
            <input
              type="text"
              value={formData.leadSourcesOther}
              onChange={(e) => handleInputChange('leadSourcesOther', e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Specify other..."
              disabled={!formData.leadSources.includes('Other')}
            />
          </div>
        </div>
        {errors.leadSources && <p className="text-red-500 text-sm mt-1">{errors.leadSources}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What is your average deal size or main offer price? *
        </label>
        <div className="space-y-2">
          {[
            'Under ₹5,000',
            '₹5,000 – ₹20,000',
            '₹20,000 – ₹50,000',
            '₹50,000+'
          ].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name="dealSize"
                value={option}
                checked={formData.dealSize === option}
                onChange={(e) => handleInputChange('dealSize', e.target.value)}
                className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        {errors.dealSize && <p className="text-red-500 text-sm mt-1">{errors.dealSize}</p>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Which platforms do you use to talk to clients? *
        </label>
        <div className="space-y-2">
          {['WhatsApp', 'Instagram', 'Facebook Messenger', 'Email', 'Website Chat'].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.communicationPlatforms.includes(option)}
                onChange={(e) => handleCheckboxChange('communicationPlatforms', option, e.target.checked)}
                className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.communicationPlatforms.includes('Others')}
              onChange={(e) => handleCheckboxChange('communicationPlatforms', 'Others', e.target.checked)}
              className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 mr-2">Others:</span>
            <input
              type="text"
              value={formData.communicationOther}
              onChange={(e) => handleInputChange('communicationOther', e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Specify other platforms..."
              disabled={!formData.communicationPlatforms.includes('Others')}
            />
          </div>
        </div>
        {errors.communicationPlatforms && <p className="text-red-500 text-sm mt-1">{errors.communicationPlatforms}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How should we handle your leads? *
        </label>
        <div className="space-y-2">
          {[
            'Send to my sales team',
            'Let your AI agent handle it',
            'Both'
          ].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name="leadHandling"
                value={option}
                checked={formData.leadHandling === option}
                onChange={(e) => handleInputChange('leadHandling', e.target.value)}
                className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        {errors.leadHandling && <p className="text-red-500 text-sm mt-1">{errors.leadHandling}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly sales goal? *
        </label>
        <p className="text-sm text-gray-500 mb-2">₹ or $ amount you want to earn per month</p>
        <input
          type="text"
          value={formData.salesGoal}
          onChange={(e) => handleInputChange('salesGoal', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="e.g., ₹50,000 or $1,000"
        />
        {errors.salesGoal && <p className="text-red-500 text-sm mt-1">{errors.salesGoal}</p>}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Top 3 customer questions or objections?
        </label>
        <p className="text-sm text-gray-500 mb-3">Helps us train your AI sales agent</p>
        <div className="space-y-3">
          {formData.customerQuestions.map((question, index) => (
            <input
              key={index}
              type="text"
              value={question}
              onChange={(e) => handleCustomerQuestionChange(index, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder={`Question/Objection ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Drop your website or active social media links:
        </label>
        <input
          type="text"
          value={formData.websiteLinks}
          onChange={(e) => handleInputChange('websiteLinks', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="https://yourwebsite.com or social media links"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How urgently do you want to start getting leads? *
        </label>
        <div className="space-y-2">
          {[
            'ASAP',
            'Within this week',
            'Within this month',
            'Just exploring'
          ].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name="urgency"
                value={option}
                checked={formData.urgency === option}
                onChange={(e) => handleInputChange('urgency', e.target.value)}
                className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        {errors.urgency && <p className="text-red-500 text-sm mt-1">{errors.urgency}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🚀 Welcome to Work Flow!
          </h1>
          <p className="text-gray-600">
            Let's get you set up in under 2 mins. Just reply to these questions 👇
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-lg font-medium transition-all transform ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105'
              } text-white`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit and Continue 🎉'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm;