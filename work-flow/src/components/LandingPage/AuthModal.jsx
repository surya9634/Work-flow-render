import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// API URL configuration - works with both Create React App and Vite
const getApiUrl = () => {
  // For Create React App
  if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // For Vite
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default fallback to same origin
  return typeof window !== 'undefined' ? window.location.origin : '';
};

const API_URL = getApiUrl();

const Auth = ({
  showModal,
  setShowModal,
  isLogin,
  setIsLogin,
  onAuthSuccess, // Add this prop to handle successful authentication
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Add this hook

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Something went wrong' });
        }
        return;
      }

      // Success
      // Store token in localStorage (support both keys used elsewhere)
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Call success callback if provided
      if (onAuthSuccess) {
        onAuthSuccess(data.user, data.token);
      }

      // Reset form and close modal
      setEmail('');
      setPassword('');
      setErrors({});
      setShowModal(false);
      

      // Navigate to dashboard
    // In handleSubmit after successful auth
if (data.user.role === 'admin') {
  navigate('/admin');
} else {
  navigate('/dashboard');
}

      // Show success message (you can use a toast library here)
      toast.success('Authentication successful!');
      console.log(data.message);

    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ 
        general: `Network error: ${error.message}. Make sure the backend server is running on ${API_URL}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-lg z-101 animate-fadeIn">
      <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700/50 animate-slideUp">
        {/* Animated background elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full blur-xl opacity-20 animate-pulse delay-1000"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2 animate-slideDown">
              {isLogin ? 'Welcome Back' : 'Join Workflow'}
            </h2>
            <p className="text-gray-300 text-sm animate-slideDown delay-100">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700/50 rounded-xl text-red-300 text-sm animate-slideDown">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div className="animate-slideUp delay-200">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: '' });
                }}
                onKeyPress={handleKeyPress}
                className="block w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 p-3 rounded-xl 
                         placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 
                         focus:border-transparent transition-all duration-300 hover:bg-gray-800/90
                         focus:scale-[1.02] transform"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1 animate-slideDown">{errors.email}</p>
              )}
            </div>

            <div className="animate-slideUp delay-300">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: '' });
                }}
                onKeyPress={handleKeyPress}
                className="block w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 p-3 rounded-xl 
                         placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 
                         focus:border-transparent transition-all duration-300 hover:bg-gray-800/90
                         focus:scale-[1.02] transform"
                disabled={loading}
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1 animate-slideDown">{errors.password}</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl 
                       font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 
                       transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] animate-slideUp delay-400
                       relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 
                            group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div className="text-center animate-slideUp delay-500">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                disabled={loading}
                className="text-sm text-gray-300 hover:text-purple-400 transition-colors duration-300 
                         hover:underline underline-offset-4 disabled:opacity-50"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                setEmail('');
                setPassword('');
                setErrors({});
              }}
              disabled={loading}
              className="w-full text-gray-400 hover:text-gray-200 transition-all duration-300 
                       py-2 rounded-xl hover:bg-gray-800/50 animate-slideUp delay-600
                       disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;