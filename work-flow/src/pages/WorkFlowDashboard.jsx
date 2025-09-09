import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Settings, 
  FileText, 
  Share2,
  X,
  MessagesSquare,
  LogOut,
  BarChart3,
  Users,
  Activity,
  Target
} from 'lucide-react';

// Import dashboard section components
import UserProfile from '../components/DashboardSections/UserProfile/UserProfile';
import Analytics from '../components/DashboardSections/Analytics/AnalyticsDashboard/Analytics';
import AIFineTuning from '../components/DashboardSections/AIFineTuning/AIFineTuning';
import Integration from '../components/DashboardSections/Integration/Integration';

import Navbar from '../components/Navbar/Navbar';
import Chats from '../components/DashboardSections/Chats/Chats';
import SignOutModal from '../components/SignOutModal';
import CampaignsDemo from '../components/CreateCampaign/CampaignsDemo';
import AICounsellor from '../components/DashboardSections/AICounsellor/AICounsellor';
import ContactUploadPage from '../components/DashboardSections/Contacts/ContactUploadPage';
const WorkFlowDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Users, label: 'User Profile', path: 'profile' },
    { icon: BarChart3, label: 'Analytics', path: 'analytics' },
    { icon: Settings, label: 'AI Fine-Tuning', path: 'ai-fine-tuning' },
    { icon: Target, label: 'Campaigns', path: 'campaigns' },
    { icon: Share2, label: 'Integration', path: 'integration' },
    { icon: MessagesSquare, label: 'Chats', path: 'chats' },
    { icon: FileText, label: 'AI Counsellor', path: 'ai-counsellor' },
    { icon: FileText, label: 'Contacts', path: 'contacts' },
  ];

  // Get active section from current path
  const getActiveSection = () => {
    const currentPath = location.pathname.split('/').pop();
    const activeItem = menuItems.find(item => item.path === currentPath);
    return activeItem ? activeItem.label : 'User Profile';
  };

  const handleSectionClick = (item) => {
    navigate(`/dashboard/${item.path}`);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleSignOutClick = () => {
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = () => {
    // Add any cleanup logic here (clear tokens, etc.)
    setShowSignOutModal(false);
    navigate('/');
  };

  const handleCancelSignOut = () => {
    setShowSignOutModal(false);
  };



  const Sidebar = () => (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 animate-fadeIn lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } lg:w-16 lg:shadow-sm flex flex-col z-50`}>
        {/* Logo */}
        <div className="p-4 lg:p-3 flex items-center justify-between lg:justify-center">
          <div className="flex items-center space-x-3 lg:space-x-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 lg:hidden">WorkFlow</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 lg:px-3 py-6 space-y-2">
          {menuItems.map((item, index) => {
            const isActive = getActiveSection() === item.label;
            return (
              <div
                key={index}
                onClick={() => handleSectionClick(item)}
                className={`flex items-center space-x-3 lg:space-x-0 lg:justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600 lg:border-r-0 lg:bg-blue-500 lg:text-white' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 lg:hover:bg-blue-50 lg:hover:text-blue-600'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="lg:hidden font-medium">{item.label}</span>
                
                {/* Tooltip for desktop */}
                <div className="hidden lg:group-hover:block absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-10">
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 lg:p-3 border-t border-gray-200">
          <div 
            onClick={handleSignOutClick}
            className="flex items-center space-x-3 lg:space-x-0 lg:justify-center p-3 rounded-lg cursor-pointer text-red-600 hover:bg-red-50 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="lg:hidden font-medium">Sign Out</span>
            
            {/* Tooltip for desktop */}
            <div className="hidden lg:group-hover:block absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-10">
              Sign Out
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <main className="flex-1 p-2 lg:p-2 overflow-y-auto">
          {/* Content Area with Routes */}
          <Routes>
            <Route path="/dashboard" element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/campaigns" element={<CampaignsDemo />} />
            <Route path="/ai-fine-tuning" element={<AIFineTuning />} />
            <Route path="/integration" element={<Integration />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/ai-counsellor" element={<AICounsellor />} />
            <Route path="/contacts" element={<ContactUploadPage />} />
            <Route path="*" element={<Navigate to="/dashboard/profile" replace />} />
          </Routes>
        </main>
      </div>

      {/* Sign Out Modal */}
      <SignOutModal 
        isOpen={showSignOutModal}
        onConfirm={handleConfirmSignOut}
        onCancel={handleCancelSignOut}
      />
    </div>
  );
};

export default WorkFlowDashboard;