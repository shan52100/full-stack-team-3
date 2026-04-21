export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'training';
  type: string;
  callsHandled: number;
  avgDuration: string;
  successRate: number;
  createdAt: string;
  language: string;
}

export interface Conversation {
  id: string;
  agentName: string;
  customerName: string;
  duration: string;
  outcome: 'success' | 'transferred' | 'failed';
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
}

export const agents: Agent[] = [
  {
    id: '1',
    name: 'Sales Assistant',
    status: 'active',
    type: 'Lead Qualification',
    callsHandled: 1243,
    avgDuration: '4:32',
    successRate: 87,
    createdAt: '2025-11-15',
    language: 'English',
  },
  {
    id: '2',
    name: 'Support Bot',
    status: 'active',
    type: 'Customer Support',
    callsHandled: 2891,
    avgDuration: '6:15',
    successRate: 92,
    createdAt: '2025-10-22',
    language: 'English',
  },
  {
    id: '3',
    name: 'Appointment Scheduler',
    status: 'active',
    type: 'Scheduling',
    callsHandled: 756,
    avgDuration: '3:20',
    successRate: 95,
    createdAt: '2025-12-01',
    language: 'English',
  },
  {
    id: '4',
    name: 'Product Demo Bot',
    status: 'training',
    type: 'Demos',
    callsHandled: 0,
    avgDuration: '0:00',
    successRate: 0,
    createdAt: '2026-02-08',
    language: 'English',
  },
  {
    id: '5',
    name: 'Feedback Collector',
    status: 'inactive',
    type: 'Surveys',
    callsHandled: 423,
    avgDuration: '2:45',
    successRate: 78,
    createdAt: '2025-09-10',
    language: 'English',
  },
];

export const conversations: Conversation[] = [
  {
    id: '1',
    agentName: 'Sales Assistant',
    customerName: 'John Smith',
    duration: '5:23',
    outcome: 'success',
    timestamp: '2026-02-10T09:15:00',
    sentiment: 'positive',
    summary: 'Qualified lead for enterprise plan. Scheduled follow-up meeting.',
  },
  {
    id: '2',
    agentName: 'Support Bot',
    customerName: 'Sarah Johnson',
    duration: '7:45',
    outcome: 'success',
    timestamp: '2026-02-10T09:03:00',
    sentiment: 'neutral',
    summary: 'Resolved billing inquiry. Customer satisfied with resolution.',
  },
  {
    id: '3',
    agentName: 'Appointment Scheduler',
    customerName: 'Mike Williams',
    duration: '3:12',
    outcome: 'success',
    timestamp: '2026-02-10T08:45:00',
    sentiment: 'positive',
    summary: 'Booked demo call for Feb 15th at 2:00 PM.',
  },
  {
    id: '4',
    agentName: 'Sales Assistant',
    customerName: 'Emily Davis',
    duration: '4:56',
    outcome: 'transferred',
    timestamp: '2026-02-10T08:30:00',
    sentiment: 'neutral',
    summary: 'Complex pricing question. Transferred to human sales rep.',
  },
  {
    id: '5',
    agentName: 'Support Bot',
    customerName: 'David Brown',
    duration: '2:15',
    outcome: 'failed',
    timestamp: '2026-02-10T08:12:00',
    sentiment: 'negative',
    summary: 'Customer hung up during wait. Issue unresolved.',
  },
  {
    id: '6',
    agentName: 'Appointment Scheduler',
    customerName: 'Lisa Anderson',
    duration: '4:05',
    outcome: 'success',
    timestamp: '2026-02-09T16:20:00',
    sentiment: 'positive',
    summary: 'Rescheduled existing appointment. No conflicts.',
  },
  {
    id: '7',
    agentName: 'Sales Assistant',
    customerName: 'Robert Taylor',
    duration: '6:34',
    outcome: 'success',
    timestamp: '2026-02-09T15:45:00',
    sentiment: 'positive',
    summary: 'Interested in starter plan. Sent pricing information.',
  },
  {
    id: '8',
    agentName: 'Support Bot',
    customerName: 'Jennifer Wilson',
    duration: '5:12',
    outcome: 'success',
    timestamp: '2026-02-09T14:30:00',
    sentiment: 'positive',
    summary: 'Technical support for integration. Provided documentation.',
  },
];

export const analyticsData = {
  callVolume: [
    { date: 'Feb 4', calls: 145 },
    { date: 'Feb 5', calls: 168 },
    { date: 'Feb 6', calls: 132 },
    { date: 'Feb 7', calls: 189 },
    { date: 'Feb 8', calls: 156 },
    { date: 'Feb 9', calls: 201 },
    { date: 'Feb 10', calls: 87 },
  ],
  successRate: [
    { date: 'Feb 4', rate: 88 },
    { date: 'Feb 5', rate: 91 },
    { date: 'Feb 6', rate: 85 },
    { date: 'Feb 7', rate: 93 },
    { date: 'Feb 8', rate: 89 },
    { date: 'Feb 9', rate: 90 },
    { date: 'Feb 10', rate: 92 },
  ],
  avgDuration: [
    { date: 'Feb 4', minutes: 4.8 },
    { date: 'Feb 5', minutes: 5.2 },
    { date: 'Feb 6', minutes: 4.5 },
    { date: 'Feb 7', minutes: 5.7 },
    { date: 'Feb 8', minutes: 5.1 },
    { date: 'Feb 9', minutes: 4.9 },
    { date: 'Feb 10', minutes: 5.3 },
  ],
  agentPerformance: [
    { name: 'Sales Assistant', calls: 1243, success: 87 },
    { name: 'Support Bot', calls: 2891, success: 92 },
    { name: 'Appointment Scheduler', calls: 756, success: 95 },
    { name: 'Feedback Collector', calls: 423, success: 78 },
  ],
};
