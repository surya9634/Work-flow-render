import { Instagram, Facebook, MessageCircle } from 'lucide-react';

export const initialMetrics = {
  totalMessages: 15420,
  activeAutomations: 12,
  leadsGenerated: 487,
  engagementRate: 78.5,
  messageGrowth: 12.5,
  leadGrowth: 8.3,
  engagementGrowth: -2.1,
  automationGrowth: 3.2
};

export const recentActivityData = [
  { 
    id: 1, 
    type: 'automation', 
    name: 'Welcome Series', 
    action: 'Started', 
    time: '2 mins ago', 
    status: 'active' 
  },
  { 
    id: 2, 
    type: 'lead', 
    name: 'John Doe', 
    action: 'Generated', 
    time: '5 mins ago', 
    status: 'new' 
  },
  { 
    id: 3, 
    type: 'message', 
    name: 'Newsletter Campaign', 
    action: 'Sent', 
    time: '12 mins ago', 
    status: 'sent' 
  },
  { 
    id: 4, 
    type: 'automation', 
    name: 'Abandoned Cart', 
    action: 'Paused', 
    time: '1 hour ago', 
    status: 'paused' 
  },
  { 
    id: 5, 
    type: 'lead', 
    name: 'Sarah Smith', 
    action: 'Generated', 
    time: '2 hours ago', 
    status: 'new' 
  }
];

export const platforms = [
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle }
];

export const triggers = [
  { id: 'new_message', name: 'New Message' },
  { id: 'new_comment', name: 'New Comment' },
  { id: 'new_follower', name: 'New Follower' },
  { id: 'story_view', name: 'Story View' }
];

export const actions = [
  { id: 'send_dm', name: 'Send DM' },
  { id: 'auto_reply', name: 'Auto Reply' },
  { id: 'add_tag', name: 'Add Tag' },
  { id: 'send_notification', name: 'Send Notification' }
];