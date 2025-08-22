import { MessageCircle, Facebook, Instagram } from 'lucide-react';

export const platforms = {
  whatsapp: {
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500',
    connectionTypes: [
      { id: 'api', name: 'Connect via API', description: 'Use your WhatsApp Business API credentials' },
      { id: 'new', name: 'Create New Number', description: 'Generate a new WhatsApp Business number' }
    ]
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    connectionTypes: [
      { id: 'graph', name: 'Connect via Graph API', description: 'Link your Facebook Pages and Messenger' }
    ]
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-600 to-pink-500',
    connectionTypes: [
      { id: 'business', name: 'Connect Business Account', description: 'Link your Instagram Business profile' }
    ]
  }
};

export const triggers = {
  whatsapp: ['New Message', 'Keyword Detection', 'New Contact', 'Message Reaction'],
  facebook: ['Page Comment', 'Messenger Message', 'Post Reaction', 'Page Mention'],
  instagram: ['New Reel', 'Post Comment', 'Story Mention', 'DM Received']
};

export const automationLogics = [
  { id: 'ai_response', name: 'AI Response', description: 'Generate intelligent responses using AI' },
  { id: 'follow_up', name: 'Follow-up Messages', description: 'Send scheduled follow-up messages' },
  { id: 'cta', name: 'Call to Action', description: 'Send CTA messages with buttons' },
  { id: 'data_collection', name: 'Data Collection', description: 'Collect user information via forms' }
];