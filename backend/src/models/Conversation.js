import mongoose from 'mongoose';

const transcriptEntrySchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['agent', 'customer'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
  },
  agentName: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    default: '',
  },
  duration: {
    type: String,
    default: '0:00',
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
  outcome: {
    type: String,
    enum: ['success', 'transferred', 'failed'],
    default: 'success',
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
  },
  summary: {
    type: String,
    default: '',
  },
  transcript: [transcriptEntrySchema],
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  // LiveKit room/call info
  roomName: {
    type: String,
    default: '',
  },
  participantIdentity: {
    type: String,
    default: '',
  },
  // Audio recording paths
  audioFiles: {
    user: String,
    agent: String,
    mixed: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ outcome: 1 });
conversationSchema.index({ agentName: 1 });
conversationSchema.index({ customerName: 'text', agentName: 'text' });

export default mongoose.model('Conversation', conversationSchema);
