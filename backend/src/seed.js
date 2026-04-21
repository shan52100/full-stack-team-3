import 'dotenv/config';
import mongoose from 'mongoose';
import Agent from './models/Agent.js';
import Conversation from './models/Conversation.js';
import User from './models/User.js';
import Settings from './models/Settings.js';
import CallLog from './models/CallLog.js';
import { generateApiKey } from './utils/helpers.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b_voice_agent';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Agent.deleteMany({}),
      Conversation.deleteMany({}),
      User.deleteMany({}),
      Settings.deleteMany({}),
      CallLog.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create users
    const users = await User.create([
      { name: 'John Doe', email: 'john@company.com', password: 'admin123', role: 'admin' },
      { name: 'Jane Smith', email: 'jane@company.com', password: 'editor123', role: 'editor' },
      { name: 'Mike Johnson', email: 'mike@company.com', password: 'viewer123', role: 'viewer' },
    ]);
    console.log('Created users');

    // Create agents
    const agents = await Agent.create([
      {
        name: 'Sales Assistant',
        status: 'active',
        type: 'Lead Qualification',
        callsHandled: 1243,
        avgDuration: '4:32',
        successRate: 87,
        language: 'English',
        voice: 'Professional Male',
        createdBy: users[0]._id,
        createdAt: new Date('2025-11-15'),
      },
      {
        name: 'Support Bot',
        status: 'active',
        type: 'Customer Support',
        callsHandled: 2891,
        avgDuration: '6:15',
        successRate: 92,
        language: 'English',
        voice: 'Professional Female',
        createdBy: users[0]._id,
        createdAt: new Date('2025-10-22'),
      },
      {
        name: 'Appointment Scheduler',
        status: 'active',
        type: 'Scheduling',
        callsHandled: 756,
        avgDuration: '3:20',
        successRate: 95,
        language: 'English',
        voice: 'Friendly Female',
        createdBy: users[0]._id,
        createdAt: new Date('2025-12-01'),
      },
      {
        name: 'Product Demo Bot',
        status: 'training',
        type: 'Demos',
        callsHandled: 0,
        avgDuration: '0:00',
        successRate: 0,
        language: 'English',
        voice: 'Professional Male',
        createdBy: users[0]._id,
        createdAt: new Date('2026-02-08'),
      },
      {
        name: 'Feedback Collector',
        status: 'inactive',
        type: 'Surveys',
        callsHandled: 423,
        avgDuration: '2:45',
        successRate: 78,
        language: 'English',
        voice: 'Friendly Male',
        createdBy: users[0]._id,
        createdAt: new Date('2025-09-10'),
      },
    ]);
    console.log('Created agents');

    // Create conversations (matching frontend mock data)
    const conversations = await Conversation.create([
      {
        agent: agents[0]._id,
        agentName: 'Sales Assistant',
        customerName: 'John Smith',
        customerPhone: '+14155550101',
        duration: '5:23',
        durationSeconds: 323,
        outcome: 'success',
        sentiment: 'positive',
        summary: 'Qualified lead for enterprise plan. Scheduled follow-up meeting.',
        roomName: 'call-room-001',
        transcript: [
          { role: 'agent', text: 'Hello! Thank you for calling. How can I help you today?' },
          { role: 'customer', text: "Hi, I'm interested in learning more about your enterprise plan." },
          { role: 'agent', text: "Great! I'd be happy to help. Let me walk you through our enterprise offerings..." },
          { role: 'customer', text: 'That sounds perfect. Can we schedule a demo?' },
          { role: 'agent', text: "Absolutely! I've scheduled a follow-up demo for next Tuesday at 2 PM." },
        ],
        createdAt: new Date('2026-02-10T09:15:00'),
      },
      {
        agent: agents[1]._id,
        agentName: 'Support Bot',
        customerName: 'Sarah Johnson',
        customerPhone: '+14155550102',
        duration: '7:45',
        durationSeconds: 465,
        outcome: 'success',
        sentiment: 'neutral',
        summary: 'Resolved billing inquiry. Customer satisfied with resolution.',
        roomName: 'call-room-002',
        transcript: [
          { role: 'agent', text: 'Hello, welcome to support. How can I assist you today?' },
          { role: 'customer', text: 'I have a question about my latest invoice.' },
          { role: 'agent', text: 'I can help with that. Let me pull up your account information.' },
        ],
        createdAt: new Date('2026-02-10T09:03:00'),
      },
      {
        agent: agents[2]._id,
        agentName: 'Appointment Scheduler',
        customerName: 'Mike Williams',
        customerPhone: '+14155550103',
        duration: '3:12',
        durationSeconds: 192,
        outcome: 'success',
        sentiment: 'positive',
        summary: 'Booked demo call for Feb 15th at 2:00 PM.',
        roomName: 'call-room-003',
        createdAt: new Date('2026-02-10T08:45:00'),
      },
      {
        agent: agents[0]._id,
        agentName: 'Sales Assistant',
        customerName: 'Emily Davis',
        customerPhone: '+14155550104',
        duration: '4:56',
        durationSeconds: 296,
        outcome: 'transferred',
        sentiment: 'neutral',
        summary: 'Complex pricing question. Transferred to human sales rep.',
        roomName: 'call-room-004',
        createdAt: new Date('2026-02-10T08:30:00'),
      },
      {
        agent: agents[1]._id,
        agentName: 'Support Bot',
        customerName: 'David Brown',
        customerPhone: '+14155550105',
        duration: '2:15',
        durationSeconds: 135,
        outcome: 'failed',
        sentiment: 'negative',
        summary: 'Customer hung up during wait. Issue unresolved.',
        roomName: 'call-room-005',
        createdAt: new Date('2026-02-10T08:12:00'),
      },
      {
        agent: agents[2]._id,
        agentName: 'Appointment Scheduler',
        customerName: 'Lisa Anderson',
        customerPhone: '+14155550106',
        duration: '4:05',
        durationSeconds: 245,
        outcome: 'success',
        sentiment: 'positive',
        summary: 'Rescheduled existing appointment. No conflicts.',
        roomName: 'call-room-006',
        createdAt: new Date('2026-02-09T16:20:00'),
      },
      {
        agent: agents[0]._id,
        agentName: 'Sales Assistant',
        customerName: 'Robert Taylor',
        customerPhone: '+14155550107',
        duration: '6:34',
        durationSeconds: 394,
        outcome: 'success',
        sentiment: 'positive',
        summary: 'Interested in starter plan. Sent pricing information.',
        roomName: 'call-room-007',
        createdAt: new Date('2026-02-09T15:45:00'),
      },
      {
        agent: agents[1]._id,
        agentName: 'Support Bot',
        customerName: 'Jennifer Wilson',
        customerPhone: '+14155550108',
        duration: '5:12',
        durationSeconds: 312,
        outcome: 'success',
        sentiment: 'positive',
        summary: 'Technical support for integration. Provided documentation.',
        roomName: 'call-room-008',
        createdAt: new Date('2026-02-09T14:30:00'),
      },
    ]);
    console.log('Created conversations');

    // Create additional conversations for analytics (last 7 days)
    const analyticsConversations = [];
    const baseDate = new Date('2026-02-10');
    const outcomes = ['success', 'success', 'success', 'success', 'transferred', 'failed'];
    const sentiments = ['positive', 'positive', 'neutral', 'neutral', 'negative'];
    const dailyCounts = [145, 168, 132, 189, 156, 201, 87];

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - dayOffset);
      const count = dailyCounts[6 - dayOffset];

      for (let i = 0; i < Math.min(count, 10); i++) {
        const agentIdx = i % agents.length;
        const callDate = new Date(date);
        callDate.setHours(8 + Math.floor(i * 1.5), Math.floor(Math.random() * 60));

        const durationSecs = 120 + Math.floor(Math.random() * 300);
        const mins = Math.floor(durationSecs / 60);
        const secs = durationSecs % 60;

        analyticsConversations.push({
          agent: agents[agentIdx]._id,
          agentName: agents[agentIdx].name,
          customerName: `Customer ${dayOffset * 10 + i + 1}`,
          duration: `${mins}:${secs.toString().padStart(2, '0')}`,
          durationSeconds: durationSecs,
          outcome: outcomes[i % outcomes.length],
          sentiment: sentiments[i % sentiments.length],
          summary: `Auto-generated conversation for analytics data.`,
          roomName: `analytics-room-${dayOffset}-${i}`,
          createdAt: callDate,
        });
      }
    }

    await Conversation.insertMany(analyticsConversations);
    console.log(`Created ${analyticsConversations.length} analytics conversations`);

    // Create call logs
    const callLogs = conversations.map((conv, i) => ({
      conversation: conv._id,
      agent: conv.agent,
      agentName: conv.agentName,
      customerName: conv.customerName,
      customerPhone: conv.customerPhone || `+1415555010${i + 1}`,
      type: i % 3 === 0 ? 'outbound' : 'inbound',
      status: 'completed',
      roomName: conv.roomName,
      startedAt: conv.createdAt,
      answeredAt: new Date(conv.createdAt.getTime() + 5000),
      endedAt: new Date(conv.createdAt.getTime() + conv.durationSeconds * 1000),
      durationSeconds: conv.durationSeconds,
      outcome: conv.outcome,
    }));

    await CallLog.insertMany(callLogs);
    console.log('Created call logs');

    // Create settings
    await Settings.create({
      organizationName: 'B2B Voice Agent Platform',
      apiKeys: [
        { key: generateApiKey('sk_live'), type: 'production' },
        { key: generateApiKey('sk_test'), type: 'development' },
      ],
      webhooks: {
        url: '',
        events: {
          callStarted: true,
          callCompleted: true,
          callFailed: true,
          agentActivated: true,
          agentDeactivated: true,
        },
      },
      notifications: {
        dailyPerformanceSummary: true,
        agentStatusChanges: true,
        failedCallAlerts: true,
        weeklyAnalyticsReport: true,
      },
    });
    console.log('Created settings');

    console.log('\nSeed completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('  Admin: john@company.com / admin123');
    console.log('  Editor: jane@company.com / editor123');
    console.log('  Viewer: mike@company.com / viewer123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
