// Dummy data for MessengerChat component with CRM features
export const contacts = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    lastMessage: "I'm interested in your premium package. Can you tell me more about the features?",
    timestamp: "2 min",
    isOnline: true,
    location: "New York, USA",
    bio: "Looking for a comprehensive solution for my growing business. Interested in premium features and long-term partnership.",
    intent: "High-value prospect - Premium package inquiry",
    stage: "contacted",
    status: "open",
    assignedTo: null,
    email: "sarah.johnson@email.com",
    phone: "+1-555-0123",
    company: "Johnson Enterprises",
    leadScore: 85,
    lastUpdated: "2024-01-23T11:42:00Z",
    tags: ["premium", "high-value", "enterprise"]
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Thanks for the demo! I'll discuss with my team and get back to you.",
    timestamp: "15 min",
    isOnline: true,
    location: "San Francisco, USA",
    bio: "Tech startup founder evaluating solutions for team productivity. Decision maker with budget approval.",
    intent: "Warm lead - Post-demo follow-up",
    stage: "demo_completed",
    status: "open",
    assignedTo: "John Smith",
    email: "michael@techstartup.com",
    phone: "+1-555-0456",
    company: "TechStartup Inc",
    leadScore: 92,
    lastUpdated: "2024-01-23T11:29:00Z",
    tags: ["startup", "decision-maker", "post-demo"]
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    lastMessage: "What's your pricing for the basic plan?",
    timestamp: "1 hour",
    isOnline: false,
    location: "Austin, USA",
    bio: "Small business owner looking for cost-effective solutions. Price-sensitive but interested in core features.",
    intent: "Price inquiry - Basic plan interest",
    stage: "pricing_inquiry",
    status: "open",
    assignedTo: null,
    email: "emma@smallbiz.com",
    phone: "+1-555-0789",
    company: "Rodriguez Solutions",
    leadScore: 65,
    lastUpdated: "2024-01-23T10:44:00Z",
    tags: ["small-business", "price-sensitive", "basic-plan"]
  },
  {
    id: 4,
    name: "David Park",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Can we schedule a call to discuss implementation?",
    timestamp: "3 hours",
    isOnline: false,
    location: "Seattle, USA",
    bio: "Enterprise client interested in custom implementation. Looking for scalable solution for 500+ employees.",
    intent: "Enterprise prospect - Implementation discussion",
    stage: "qualified",
    status: "open",
    assignedTo: "Sarah Wilson",
    email: "david.park@enterprise.com",
    phone: "+1-555-0321",
    company: "Enterprise Corp",
    leadScore: 95,
    lastUpdated: "2024-01-23T08:44:00Z",
    tags: ["enterprise", "implementation", "high-priority"]
  },
  {
    id: 5,
    name: "Lisa Thompson",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    lastMessage: "I love the features! When can we start?",
    timestamp: "5 hours",
    isOnline: true,
    location: "Chicago, USA",
    bio: "Ready to purchase and implement. Excited about the product features and eager to get started quickly.",
    intent: "Hot lead - Ready to purchase",
    stage: "converted",
    status: "closed",
    assignedTo: "Me",
    email: "lisa@thompson.com",
    phone: "+1-555-0654",
    company: "Thompson Marketing",
    leadScore: 98,
    lastUpdated: "2024-01-23T06:44:00Z",
    tags: ["hot-lead", "ready-to-buy", "converted"]
  },
  {
    id: 6,
    name: "James Wilson",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Do you offer any discounts for annual subscriptions?",
    timestamp: "1 day",
    isOnline: false,
    location: "Miami, USA",
    bio: "Interested in long-term commitment with cost savings. Looking for annual subscription benefits and discounts.",
    intent: "Discount inquiry - Annual subscription",
    stage: "negotiation",
    status: "snoozed",
    assignedTo: "Mike Johnson",
    email: "james.wilson@company.com",
    phone: "+1-555-0987",
    company: "Wilson & Associates",
    leadScore: 75,
    lastUpdated: "2024-01-22T11:44:00Z",
    tags: ["annual-discount", "negotiation", "cost-conscious"]
  }
];

// Sales agents for assignment
export const salesAgents = [
  { id: 'me', name: 'Me', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' },
  { id: 'john', name: 'John Smith', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' },
  { id: 'sarah', name: 'Sarah Wilson', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' },
  { id: 'mike', name: 'Mike Johnson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face' }
];

// Quick reply templates
export const quickReplies = [
  {
    id: 1,
    title: "Pricing Info",
    message: "Our pricing starts at $99/month for the premium package with all features included. Would you like me to schedule a demo to show you the value?"
  },
  {
    id: 2,
    title: "Schedule Demo",
    message: "I'd be happy to schedule a personalized demo for you! What time works best for you this week?"
  },
  {
    id: 3,
    title: "Feature Overview",
    message: "Our platform includes project management, team collaboration, advanced analytics, and 24/7 support. Which features are most important for your business?"
  },
  {
    id: 4,
    title: "Discount Available",
    message: "Great news! We're currently offering 20% off annual subscriptions and have special startup rates available. Would you like to learn more?"
  },
  {
    id: 5,
    title: "Implementation Support",
    message: "Our implementation typically takes 1-2 weeks with full onboarding support. We'll guide you through every step of the process."
  },
  {
    id: 6,
    title: "Follow Up",
    message: "Thanks for your interest! I'll follow up with you in a few days. In the meantime, feel free to reach out if you have any questions."
  }
];

// Lead stages with colors
export const leadStages = {
  new: { label: 'New', color: 'bg-gray-500', textColor: 'text-gray-700' },
  contacted: { label: 'Contacted', color: 'bg-blue-500', textColor: 'text-blue-700' },
  qualified: { label: 'Qualified', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  demo_completed: { label: 'Demo Done', color: 'bg-purple-500', textColor: 'text-purple-700' },
  pricing_inquiry: { label: 'Pricing', color: 'bg-orange-500', textColor: 'text-orange-700' },
  negotiation: { label: 'Negotiation', color: 'bg-indigo-500', textColor: 'text-indigo-700' },
  converted: { label: 'Converted', color: 'bg-green-500', textColor: 'text-green-700' },
  lost: { label: 'Lost', color: 'bg-red-500', textColor: 'text-red-700' }
};

// Status filters
export const statusFilters = {
  open: { label: 'Open', count: 4 },
  snoozed: { label: 'Snoozed', count: 1 },
  closed: { label: 'Closed', count: 1 }
};

// Assignment filters
export const assignmentFilters = {
  assigned_to_me: { label: 'Assigned to Me', count: 2 },
  unassigned: { label: 'Unassigned', count: 2 }
};

export const messages = {
  1: [
    {
      id: 1,
      sender: "customer",
      message: "Hi! I've been looking at your website and I'm really interested in your services.",
      timestamp: "10:30 AM",
      isRead: true
    },
    {
      id: 2,
      sender: "ai",
      message: "Hello Sarah! Thank you for your interest. I'd be happy to help you learn more about our solutions. What specific challenges are you looking to solve?",
      timestamp: "10:31 AM",
      isRead: true
    },
    {
      id: 3,
      sender: "customer",
      message: "We're a growing company and need better project management tools. Our current system isn't scaling well.",
      timestamp: "10:33 AM",
      isRead: true
    },
    {
      id: 4,
      sender: "ai",
      message: "That's a common challenge for growing businesses! Our premium package is designed exactly for companies in your situation. It includes advanced project management, team collaboration tools, and unlimited scalability.",
      timestamp: "10:34 AM",
      isRead: true
    },
    {
      id: 5,
      sender: "customer",
      message: "That sounds perfect! Can you tell me more about the pricing and what's included?",
      timestamp: "10:36 AM",
      isRead: true
    },
    {
      id: 6,
      sender: "ai",
      message: "Absolutely! The premium package is $99/month and includes:\n\n• Unlimited projects and team members\n• Advanced analytics and reporting\n• Priority customer support\n• Custom integrations\n• Advanced security features\n\nWould you like me to schedule a demo to show you these features in action?",
      timestamp: "10:37 AM",
      isRead: true
    },
    {
      id: 7,
      sender: "customer",
      message: "I'm interested in your premium package. Can you tell me more about the features?",
      timestamp: "10:45 AM",
      isRead: false
    }
  ],
  2: [
    {
      id: 1,
      sender: "ai",
      message: "Hi Michael! Thanks for joining our demo session today. How did you find the presentation?",
      timestamp: "2:00 PM",
      isRead: true
    },
    {
      id: 2,
      sender: "customer",
      message: "It was really impressive! The automation features would save us so much time.",
      timestamp: "2:02 PM",
      isRead: true
    },
    {
      id: 3,
      sender: "ai",
      message: "I'm glad you found it valuable! Those automation features are one of our most popular benefits. Many of our clients report saving 15-20 hours per week.",
      timestamp: "2:03 PM",
      isRead: true
    },
    {
      id: 4,
      sender: "customer",
      message: "That would be huge for our team. What's the next step if we want to move forward?",
      timestamp: "2:05 PM",
      isRead: true
    },
    {
      id: 5,
      sender: "ai",
      message: "Great question! I can set up a trial account for your team right away. This would give you 14 days to test everything with your actual projects. Would that work for you?",
      timestamp: "2:06 PM",
      isRead: true
    },
    {
      id: 6,
      sender: "customer",
      message: "Thanks for the demo! I'll discuss with my team and get back to you.",
      timestamp: "2:15 PM",
      isRead: false
    }
  ]
};
