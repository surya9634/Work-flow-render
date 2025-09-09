export const mockData = {
  workflowPerformance: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Messages Processed',
        data: [1200, 1900, 3000, 5000, 2000, 3000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'AI Responses',
        data: [1100, 1800, 2800, 4700, 1900, 2800],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  },

  platformDistribution: {
    labels: ['Instagram', 'WhatsApp', 'Messenger'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          'rgb(236, 72, 153)',
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 0,
      },
    ],
  },

  engagementRate: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Instagram',
        data: [85, 90, 88, 92],
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'WhatsApp',
        data: [78, 82, 85, 88],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Messenger',
        data: [72, 75, 80, 83],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  },

  responseTypes: {
    labels: ['Auto Reply', 'Smart Reply', 'Human Reply'],
    datasets: [
      {
        data: [650, 280, 70],
        backgroundColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 0,
      },
    ],
  },

  activityFeed: [
    {
      platform: 'Instagram',
      action: 'Auto-replied to comment on post #1234',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      platform: 'WhatsApp',
      action: 'Processed customer inquiry',
      time: '5 minutes ago',
      status: 'success'
    },
    {
      platform: 'Messenger',
      action: 'Escalated complex query to human agent',
      time: '8 minutes ago',
      status: 'escalated'
    },
    {
      platform: 'Instagram',
      action: 'Generated response for DM',
      time: '12 minutes ago',
      status: 'success'
    },
  ],
};
