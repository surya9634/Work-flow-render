import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Activity, 
  Target, 
  TrendingUp,
  Plus
} from 'lucide-react';

// Import sub-components
import MetricsGrid from './MetricsGrid';
import EngagementChart from './EngagementChart';
import RecentActivity from './RecentActivity';
import QuickLaunch from './QuickLaunch';
import CustomAutomationModal from './CustomAutomationModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import Toast from './Toast';

// Import data and constants
import { 
  initialMetrics, 
  recentActivityData, 
  platforms, 
  triggers, 
  actions
} from '../../data/userProfileData';

const UserProfile = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [customQuickLaunch, setCustomQuickLaunch] = useState([]);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [deletingAutomation, setDeletingAutomation] = useState(null);
  const navigate = useNavigate();

  const [animatedMetrics, setAnimatedMetrics] = useState({
    totalMessages: 0,
    activeAutomations: 0,
    leadsGenerated: 0,
    engagementRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [profileMetrics, setProfileMetrics] = useState({ totalMessagesSent: 0, activeAutomations: 0, leadsGenerated: 0, engagementRate: 0 });

  const [customAutomation, setCustomAutomation] = useState({
    name: '',
    platform: '',
    trigger: '',
    action: '',
    status: 'active'
  });

  // Load real metrics from backend and animate to them
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/analytics');
        const data = await res.json();
        if (ignore) return;
        const p = data?.profile || {};
        const target = {
          totalMessages: Number(p.totalMessagesSent || 0),
          activeAutomations: Number(p.activeAutomations || 0),
          leadsGenerated: Number(p.leadsGenerated || 0),
          engagementRate: Number(p.engagementRate || 0)
        };
        setProfileMetrics({
          totalMessagesSent: target.totalMessages,
          activeAutomations: target.activeAutomations,
          leadsGenerated: target.leadsGenerated,
          engagementRate: target.engagementRate
        });
        // animate to fetched values
        const animateValue = (start, end, duration, key) => {
          const range = end - start;
          const increment = range / (duration / 16);
          let current = start;
          const timer = setInterval(() => {
            current += increment;
            const done = (range >= 0 ? current >= end : current <= end);
            if (done) { current = end; clearInterval(timer); }
            setAnimatedMetrics(prev => ({
              ...prev,
              [key]: key === 'engagementRate' ? parseFloat(current.toFixed(1)) : Math.floor(current)
            }));
          }, 16);
        };
        setTimeout(() => animateValue(animatedMetrics.totalMessages, target.totalMessages, 200, 'totalMessages'), 20);
        setTimeout(() => animateValue(animatedMetrics.activeAutomations, target.activeAutomations, 200, 'activeAutomations'), 20);
        setTimeout(() => animateValue(animatedMetrics.leadsGenerated, target.leadsGenerated, 200, 'leadsGenerated'), 40);
        setTimeout(() => animateValue(animatedMetrics.engagementRate, target.engagementRate, 200, 'engagementRate'), 60);
      } catch (e) {
        // fallback: keep zeros
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    const id = setInterval(() => { load(); }, 3000);
    return () => { ignore = true; clearInterval(id); };
  }, []);

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRedirect = (cardType) => {
    switch (cardType) {
      case 'messages':
        showNotification('Redirecting to Chats page...');
        navigate('/dashboard/chats');
        break;
      case 'automations':
        showNotification('Redirecting to Integration page...');
        navigate('/dashboard/integration');
        break;
      default:
        break;
    }
  };

  const handleCreateCustom = () => {
    if (!customAutomation.name || !customAutomation.platform || !customAutomation.trigger || !customAutomation.action) {
      showNotification('Please fill in all fields');
      return;
    }

    const platformIcon = platforms.find(p => p.id === customAutomation.platform)?.icon;
    const newQuickLaunch = {
      id: editingAutomation ? editingAutomation.id : Date.now(),
      name: customAutomation.name,
      icon: platformIcon,
      description: `${customAutomation.trigger} → ${customAutomation.action}`,
      color: 'bg-indigo-500',
      isCustom: true,
      platform: customAutomation.platform,
      trigger: customAutomation.trigger,
      action: customAutomation.action,
      status: customAutomation.status
    };

    if (editingAutomation) {
      setCustomQuickLaunch(prev => prev.map(item => 
        item.id === editingAutomation.id ? newQuickLaunch : item
      ));
      setShowEditModal(false);
      setEditingAutomation(null);
      showNotification('Automation updated successfully!');
    } else {
      setCustomQuickLaunch(prev => [...prev, newQuickLaunch]);
      setShowCustomModal(false);
      showNotification('Custom automation created successfully!');
    }

    setCustomAutomation({ name: '', platform: '', trigger: '', action: '', status: 'active' });
  };

  const handleEditAutomation = (automation) => {
    setEditingAutomation(automation);
    setCustomAutomation({
      name: automation.name,
      platform: automation.platform,
      trigger: automation.trigger,
      action: automation.action,
      status: automation.status
    });
    setShowEditModal(true);
  };

  const handleDeleteAutomation = (automation) => {
    setDeletingAutomation(automation);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deletingAutomation) {
      setCustomQuickLaunch(prev => prev.filter(item => item.id !== deletingAutomation.id));
      setShowDeleteModal(false);
      setDeletingAutomation(null);
      showNotification('Automation deleted successfully!');
    }
  };

  const cancelModal = () => {
    setShowCustomModal(false);
    setShowEditModal(false);
    setEditingAutomation(null);
    setCustomAutomation({ name: '', platform: '', trigger: '', action: '', status: 'active' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Automation Performance</h2>
          <p className="text-gray-600 mt-2">Track and optimize your automation campaigns</p>
        </div>

        {/* Metrics Cards */}
        <MetricsGrid
          animatedMetrics={animatedMetrics}
          metrics={{
            messageGrowth: 0,
            automationGrowth: 0,
            leadGrowth: 0,
            engagementGrowth: 0
          }}
          onRedirect={handleRedirect}
        />

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <EngagementChart
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <RecentActivity activities={recentActivityData} />
        </div>

        {/* Quick Launch Section */}
        <QuickLaunch
          customQuickLaunch={customQuickLaunch}
          onCreateNew={() => setShowCustomModal(true)}
          onEdit={handleEditAutomation}
          onDelete={handleDeleteAutomation}
        />

        {/* Modals */}
        <CustomAutomationModal
          isOpen={showCustomModal}
          isEdit={false}
          customAutomation={customAutomation}
          platforms={platforms}
          triggers={triggers}
          actions={actions}
          onClose={cancelModal}
          onChange={setCustomAutomation}
          onSubmit={handleCreateCustom}
        />

        <CustomAutomationModal
          isOpen={showEditModal}
          isEdit={true}
          customAutomation={customAutomation}
          platforms={platforms}
          triggers={triggers}
          actions={actions}
          onClose={cancelModal}
          onChange={setCustomAutomation}
          onSubmit={handleCreateCustom}
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          automationName={deletingAutomation?.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />

        {/* Toast Notification */}
        <Toast
          show={showToast}
          message={toastMessage}
        />
      </main>
    </div>
  );
};

export default UserProfile;