import React, { useState } from 'react';
import { 
  X, User, Mail, Phone, MapPin, Building, Globe, Clock, Calendar, 
  Tag, ShoppingBag, DollarSign, FileText, Sparkles, Package, 
  CheckCircle, TrendingUp
} from 'lucide-react';

const CustomerDetails = ({ customer, messages }) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [chatSummary, setChatSummary] = useState('');

  if (!customer) return null;

  const generateChatSummary = () => {
    setIsGeneratingSummary(true);
    
    // Simulate AI summary generation
    setTimeout(() => {
      const summary = `**Conversation Summary**

**Customer Intent:** The customer initiated contact regarding assistance with their project implementation.

**Key Discussion Points:**
• Initial greeting and offer of support
• Customer expressed need for project-related assistance
• Agent acknowledged the request and indicated readiness to help

**Customer Sentiment:** Positive and engaged

**Action Items:**
• Awaiting specific details about the project requirements
• Ready to provide tailored assistance based on customer needs

**Recommended Next Steps:**
1. Gather detailed project specifications
2. Provide relevant solution recommendations
3. Schedule follow-up if necessary`;

      setChatSummary(summary);
      setIsGeneratingSummary(false);
    }, 1500);
  };

  const clearSummary = () => {
    setChatSummary('');
  };

  return (
    <div className="w-96 bg-white shadow-xl border-l border-gray-200 h-full overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50- to-green-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Customer Details</h3>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Profile Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-500 flex items-center justify-center text-white text-xl font-bold">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-800">{customer.name}</h4>
                <p className="text-sm text-gray-500">Customer since {customer.customerSince}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {customer.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-3 text-gray-400" />
                {customer.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-3 text-gray-400" />
                {customer.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                {customer.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Building className="w-4 h-4 mr-3 text-gray-400" />
                {customer.company}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Globe className="w-4 h-4 mr-3 text-gray-400" />
                {customer.preferredLanguage}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-3 text-gray-400" />
                {customer.timezone} • Last seen {customer.lastSeen}
              </div>
            </div>
          </div>



          {/* Chat Summary Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-semibold text-gray-700">Conversation Summary</h5>
              {chatSummary && (
                <button
                  onClick={clearSummary}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            
            {!chatSummary ? (
              <button
                onClick={generateChatSummary}
                disabled={isGeneratingSummary}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingSummary ? 'Generating Summary...' : 'Generate AI Summary'}</span>
              </button>
            ) : (
              <div className="bg-purple-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
                {chatSummary}
              </div>
            )}
          </div>
                    {/* Customer Stats */}
          <div className="p-6 border-b border-gray-100">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Customer Statistics</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-semibold text-gray-800">{customer.totalPurchases}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Total Orders</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold text-gray-800">{customer.lifetimeValue}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Lifetime Value</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-800">{customer.joinedDate}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Member Since</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-semibold text-gray-800">Active</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Account Status</p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="p-6 border-b border-gray-100">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Recent Orders</h5>
            <div className="space-y-3">
              {customer.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{order.id}</p>
                      <p className="text-xs text-gray-500">{order.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{order.amount}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="p-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">Internal Notes</h5>
            <div className="bg-yellow-50 rounded-lg p-4">
              <FileText className="w-4 h-4 text-yellow-600 mb-2" />
              <p className="text-sm text-gray-700">{customer.notes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;