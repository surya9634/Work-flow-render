import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Edit, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SignOutModal from '../SignOutModal';

const UserDropdown = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Sample user data - in a real app, this would come from props or context
  const userData = user || {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: null
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOutClick = () => {
    setIsOpen(false); // Close dropdown first
    setShowSignOutModal(true); // Then show modal
  };

  const handleConfirmSignOut = () => {
    setShowSignOutModal(false);
    
    // Call parent's sign out function if provided
    if (onSignOut) {
      onSignOut();
    }
    
    // Navigate to landing page
    navigate('/');
  };

  const handleCancelSignOut = () => {
    setShowSignOutModal(false);
  };

  const handleEditProfile = () => {
    // This would typically open a modal or navigate to an edit page
    console.log('Edit profile clicked');
    setIsOpen(false);
  };

  const handleSettings = () => {
    // This would typically navigate to settings page
    console.log('Settings clicked');
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* User Button */}
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-2 focus:outline-none"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {userData.avatar ? (
              <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-gray-700" />
            )}
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
            >
              {/* User Info Section */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {userData.avatar ? (
                      <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{userData.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{userData.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{userData.phone}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleEditProfile}
                  className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                  <span>Edit Profile</span>
                </button>
                
                <button
                  onClick={handleSettings}
                  className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Settings</span>
                </button>

                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={handleSignOutClick}
                  className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sign Out Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onConfirm={handleConfirmSignOut}
        onCancel={handleCancelSignOut}
      />
    </>
  );
};

export default UserDropdown;