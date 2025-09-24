import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Play, Pause, Eye, Instagram, Facebook } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import CreateCampaignModal from './CreateCampaignModal';

const CampaignsList = () => {
  const [campaigns, setCampaigns] = useState([]);

  // Fetch campaigns from backend on mount
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/campaigns');
        const data = await res.json();
        if (!ignore && Array.isArray(data)) {
          setCampaigns(data);
        }
      } catch (_) {}
    })();
    return () => { ignore = true; };
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const handleCreateCampaign = async (campaignData) => {
    // Refresh from backend to get the real stored campaign list
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (Array.isArray(data)) setCampaigns(data);
    } catch (_) {}
  };

  const extractCampaignName = (description) => {
    // Extract product name or create a meaningful campaign name
    const match = description.match(/for\s+(\w+)/i);
    const productName = match ? match[1] : 'Product';
    return `${productName} Awareness Campaign`;
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}`, { method: 'DELETE' });
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      }
    } catch (_) {}
  };

  const handleToggleCampaignStatus = async (campaignId) => {
    try {
      const camp = campaigns.find(c => c.id === campaignId);
      if (!camp) return;
      if (camp.status === 'active') {
        const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/stop`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && data?.success) {
          setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c));
        }
      } else {
        const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: camp.conversationId || null }) });
        const data = await res.json();
        if (res.ok && data?.success) {
          setCampaigns(prev => prev.map(c => c.id === campaignId ? data.campaign : c));
        }
      }
    } catch (_) {}
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const name = (campaign?.name || '').toLowerCase();
    const audience = (campaign?.targetAudience || campaign?.leads?.targetAudience || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || audience.includes(searchTerm.toLowerCase());
    const status = campaign?.status || 'active';
    const matchesFilter = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel) => {
    const map = {
      whatsapp: <FaWhatsapp className="w-5 h-5 text-green-500" />,
      instagram: <Instagram className="w-5 h-5 text-pink-500" />,
      facebook: <Facebook className="w-5 h-5 text-blue-600" />,
    };
    return map[channel] || '📱';
  };

  const getCampaignChannels = (campaign) => {
    // Prefer flat channels; fallback to campaign.brief.channels
    return Array.isArray(campaign?.channels) && campaign.channels.length > 0
      ? campaign.channels
      : (Array.isArray(campaign?.brief?.channels) ? campaign.brief.channels : []);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage your outreach campaigns</p>
        </div>
        <button
          onClick={() => {
            setSelectedCampaign(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your search'}
          </h3>
          <p className="text-gray-600 mb-6">
            {campaigns.length === 0 
              ? 'Create your first campaign to start reaching out to prospects'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {campaigns.length === 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCampaigns.map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Campaign Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {campaign?.name || extractCampaignName(campaign?.brief?.description || '')}
                    </h3>
                    {(() => { 
                      const status = (campaign?.status || 'draft');
                      return (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="relative">
                    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Campaign Details */}
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Target Audience</p>
                    <p className="text-sm font-medium text-gray-900">{campaign?.targetAudience || campaign?.leads?.targetAudience || '—'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Channels</p>
                    <div className="flex space-x-1">
                      {getCampaignChannels(campaign).map((channel) => (
                        <span key={channel} className="text-lg" title={channel}>
                          {getChannelIcon(channel)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Persona</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(campaign?.persona?.name || 'Persona')} • {(campaign?.persona?.tone || 'Neutral')}
                    </p>
                  </div>
                </div>

                {/* Campaign Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{(campaign?.stats?.sent ?? 0)}</div>
                    <div className="text-xs text-gray-600">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{(campaign?.stats?.replied ?? 0)}</div>
                    <div className="text-xs text-gray-600">Replied</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {(() => { const status = (campaign?.status || 'draft'); return (
                  <button
                    onClick={() => handleToggleCampaignStatus(campaign.id)}
                    className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      status === 'active'
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {status === 'active' ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </>
                    )}
                  </button> ); })()}
                  <button
                    onClick={() => handleEditCampaign(campaign)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit campaign"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Created Date */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created {campaign?.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCampaign(null);
        }}
        onSave={handleCreateCampaign}
        initialData={selectedCampaign}
      />
    </div>
  );
};

export default CampaignsList;
