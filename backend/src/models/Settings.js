import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['production', 'development'],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const settingsSchema = new mongoose.Schema({
  // There's only one settings document per organization
  organizationName: {
    type: String,
    default: 'My Organization',
  },
  apiKeys: [apiKeySchema],
  webhooks: {
    url: {
      type: String,
      default: '',
    },
    events: {
      callStarted: { type: Boolean, default: true },
      callCompleted: { type: Boolean, default: true },
      callFailed: { type: Boolean, default: true },
      agentActivated: { type: Boolean, default: true },
      agentDeactivated: { type: Boolean, default: true },
    },
  },
  notifications: {
    dailyPerformanceSummary: { type: Boolean, default: true },
    agentStatusChanges: { type: Boolean, default: true },
    failedCallAlerts: { type: Boolean, default: true },
    weeklyAnalyticsReport: { type: Boolean, default: true },
  },
  // LiveKit config
  livekit: {
    url: String,
    apiKey: String,
    apiSecret: String,
    sipTrunkId: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Settings', settingsSchema);
