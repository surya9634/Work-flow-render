export const engagementData = {
  weekly: {
    title: 'Weekly Engagement',
    subtitle: 'Daily engagement rate over the past week',
    data: [
      { label: 'Mon', rate: 65 },
      { label: 'Tue', rate: 72 },
      { label: 'Wed', rate: 78 },
      { label: 'Thu', rate: 85 },
      { label: 'Fri', rate: 79 },
      { label: 'Sat', rate: 68 },
      { label: 'Sun', rate: 74 }
    ],
    colors: {
      background: 'rgba(59, 130, 246, 0.8)',
      border: 'rgba(59, 130, 246, 1)',
      gradient: [
        'rgba(59, 130, 246, 0.9)', 
        'rgba(99, 102, 241, 0.7)', 
        'rgba(139, 92, 246, 0.8)', 
        'rgba(59, 130, 246, 0.6)', 
        'rgba(99, 102, 241, 0.8)', 
        'rgba(139, 92, 246, 0.7)', 
        'rgba(59, 130, 246, 0.8)'
      ]
    }
  },
  monthly: {
    title: 'Monthly Engagement',
    subtitle: 'Weekly engagement rate over the past month',
    data: [
      { label: 'Week 1', rate: 68 },
      { label: 'Week 2', rate: 74 },
      { label: 'Week 3', rate: 82 },
      { label: 'Week 4', rate: 76 }
    ],
    colors: {
      background: 'rgba(34, 197, 94, 0.8)',
      border: 'rgba(34, 197, 94, 1)',
      gradient: [
        'rgba(34, 197, 94, 0.9)', 
        'rgba(59, 130, 246, 0.7)', 
        'rgba(168, 85, 247, 0.8)', 
        'rgba(239, 68, 68, 0.7)'
      ]
    }
  },
  yearly: {
    title: 'Yearly Engagement',
    subtitle: 'Monthly engagement rate over the past year',
    data: [
      { label: 'Jan', rate: 62 }, 
      { label: 'Feb', rate: 68 }, 
      { label: 'Mar', rate: 75 },
      { label: 'Apr', rate: 71 }, 
      { label: 'May', rate: 79 }, 
      { label: 'Jun', rate: 83 },
      { label: 'Jul', rate: 88 }, 
      { label: 'Aug', rate: 85 }, 
      { label: 'Sep', rate: 82 },
      { label: 'Oct', rate: 78 }, 
      { label: 'Nov', rate: 76 }, 
      { label: 'Dec', rate: 80 }
    ],
    colors: {
      background: 'rgba(245, 101, 101, 0.8)',
      border: 'rgba(245, 101, 101, 1)',
      gradient: [
        'rgba(239, 68, 68, 0.9)', 
        'rgba(245, 101, 101, 0.8)', 
        'rgba(251, 146, 60, 0.8)',
        'rgba(34, 197, 94, 0.8)', 
        'rgba(59, 130, 246, 0.8)', 
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)', 
        'rgba(14, 165, 233, 0.8)', 
        'rgba(168, 85, 247, 0.8)',
        'rgba(34, 197, 94, 0.7)', 
        'rgba(59, 130, 246, 0.7)', 
        'rgba(245, 101, 101, 0.7)'
      ]
    }
  }
};