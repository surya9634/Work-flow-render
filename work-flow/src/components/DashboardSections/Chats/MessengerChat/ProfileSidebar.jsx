import React from 'react';
import { MapPin, MessageCircle } from 'lucide-react';

const ProfileSidebar = ({ contact }) => {
  if (!contact) {
    return (
      <div className="p-6 flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Select a conversation to view contact details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Profile Header */}
      <div className="text-center mb-6">
        <div className="relative inline-block mb-4">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-16 h-16 rounded-full object-cover mx-auto"
          />
          {contact.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {contact.name}
        </h3>
        
        <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{contact.location}</span>
        </div>

        <button className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
          <MessageCircle className="w-4 h-4" />
          <span>Say Hi</span>
        </button>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">About</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {contact.bio}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Sales Intent</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {contact.intent}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Contact Info</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 text-gray-700">{contact.email}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2 text-gray-700">{contact.phone}</span>
            </div>
            <div>
              <span className="text-gray-500">Company:</span>
              <span className="ml-2 text-gray-700">{contact.company}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Lead Score</h4>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  contact.leadScore >= 80 ? 'bg-green-500' :
                  contact.leadScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${contact.leadScore}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {contact.leadScore}/100
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Status</h4>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            contact.isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              contact.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            {contact.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Tags</h4>
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;