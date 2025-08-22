import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SignOutModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    
    try {
      // 1. Clear authentication token
      localStorage.removeItem('token');
      
      // 2. Clear user data
      localStorage.removeItem('user');
      
      // 3. Clear any other app-specific data (add more as needed)
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('dashboardSettings');
      
      // 4. Optional: Call backend logout endpoint if you have one
      // This is useful for token blacklisting or session management
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          // Fail silently for logout endpoint - we still want to clear local data
          console.log('Logout endpoint not available or failed:', error);
        }
      }
      
      // 5. Show success message
      toast.success('Signed out successfully!', {
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
      
      // 6. Call the original onConfirm if provided (for any parent component cleanup)
      if (onConfirm) {
        onConfirm();
      }
      
      // 7. Small delay for better UX (let user see the toast)
      setTimeout(() => {
        // 8. Redirect to landing page
        navigate('/', { replace: true });
      }, 500);
      
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('Error signing out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {title || 'Sign Out Confirmation'}
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message || "Are you sure you want to sign out? You'll need to sign in again to access your dashboard."}
          </p>
          
          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              disabled={isSigningOut}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSigningOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing Out...
                </>
              ) : (
                'Sign Out'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignOutModal;