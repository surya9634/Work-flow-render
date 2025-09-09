import { Mail, Users, MessageSquare, Target } from 'lucide-react';

export const defaultQuickLaunchOptions = [
  { 
    id: 1, 
    name: 'Email Sequence', 
    icon: Mail, 
    description: 'Create automated email flow', 
    color: 'bg-blue-500',
    isCustom: false
  },
  { 
    id: 2, 
    name: 'Lead Nurturing', 
    icon: Users, 
    description: 'Nurture leads automatically', 
    color: 'bg-green-500',
    isCustom: false
  },
  { 
    id: 3, 
    name: 'Welcome Series', 
    icon: MessageSquare, 
    description: 'Onboard new subscribers', 
    color: 'bg-purple-500',
    isCustom: false
  },
  { 
    id: 4, 
    name: 'Re-engagement', 
    icon: Target, 
    description: 'Win back inactive users', 
    color: 'bg-orange-500',
    isCustom: false
  }
];