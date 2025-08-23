import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const ChatSummary = ({ contact, messages, isVisible, onToggle }) => {
  const generateSummary = () => {
    if (!messages || messages.length === 0) {
      return {
        highlights: ['No conversation yet'],
        products: [],
        decision: 'Pending initial contact',
        nextSteps: ['Initiate conversation']
      };
    }

    // Simple summary generation based on contact data and stage
    const highlights = [];
    const products = [];
    let decision = 'In progress';
    const nextSteps = [];

    const stage = contact?.stage || 'new';
    const intent = (contact?.intent || '').toLowerCase();
    const tags = Array.isArray(contact?.tags) ? contact.tags : [];

    // Generate highlights based on contact stage and intent
    switch (stage) {
      case 'contacted':
        highlights.push('Initial contact established');
        if (intent) highlights.push(`Interested in ${intent}`);
        nextSteps.push('Schedule demo or provide more information');
        break;
      case 'qualified':
        highlights.push('Lead qualified and showing strong interest');
        highlights.push('Budget and authority confirmed');
        nextSteps.push('Prepare proposal or schedule implementation call');
        break;
      case 'demo_completed':
        highlights.push('Product demo completed successfully');
        highlights.push('Positive feedback received');
        nextSteps.push('Follow up on decision timeline');
        break;
      case 'pricing_inquiry':
        highlights.push('Pricing information requested');
        highlights.push('Cost-conscious buyer');
        nextSteps.push('Provide pricing options and value proposition');
        break;
      case 'negotiation':
        highlights.push('In active negotiation phase');
        highlights.push('Discussing terms and pricing');
        nextSteps.push('Finalize contract terms');
        break;
      case 'converted':
        highlights.push('Successfully converted to customer');
        decision = 'Closed - Won';
        nextSteps.push('Begin onboarding process');
        break;
      case 'lost':
        highlights.push('Lead did not convert');
        decision = 'Closed - Lost';
        nextSteps.push('Add to nurture campaign');
        break;
      default:
        highlights.push('New lead requiring qualification');
        nextSteps.push('Qualify lead and understand needs');
    }

    // Add product mentions based on tags
    if (tags.includes('premium')) products.push('Premium Package');
    if (tags.includes('enterprise')) products.push('Enterprise Solution');
    if (tags.includes('basic-plan')) products.push('Basic Plan');
    if (tags.includes('annual-discount')) products.push('Annual Subscription');

    return {
      highlights,
      products,
      decision,
      nextSteps
    };
  };

  const summary = generateSummary();

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
      >
        <Sparkles size={16} />
        AI Summary
        <ChevronUp size={14} />
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-3">
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <span className="text-sm font-medium text-gray-700">AI Chat Summary</span>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronDown size={16} />
        </button>
      </div>
      
      <div className="p-3 space-y-3">
        {/* Highlights */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Key Highlights
          </h4>
          <ul className="space-y-1">
            {summary.highlights.map((highlight, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        {/* Products Mentioned */}
        {summary.products.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Products Discussed
            </h4>
            <div className="flex flex-wrap gap-1">
              {summary.products.map((product, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {product}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Decision Status */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Decision Status
          </h4>
          <span className={`px-2 py-1 text-xs rounded-full ${
            summary.decision.includes('Won') 
              ? 'bg-green-100 text-green-700'
              : summary.decision.includes('Lost')
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {summary.decision}
          </span>
        </div>

        {/* Next Steps */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Next Steps
          </h4>
          <ul className="space-y-1">
            {summary.nextSteps.map((step, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChatSummary;
