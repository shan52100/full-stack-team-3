import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
  },
  agentName: String,
  customerName: String,
  customerPhone: String,
  type: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'inbound',
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer', 'busy'],
    default: 'initiated',
  },
  // LiveKit / SIP details
  roomName: String,
  sipTrunkId: String,
  sipCallTo: String,
  participantIdentity: String,
  participantName: String,
  // Timing
  startedAt: {
    type: Date,
    default: Date.now,
  },
  answeredAt: Date,
  endedAt: Date,
  durationSeconds: {
    type: Number,
    default: 0,
  },
  // Outcome
  outcome: {
    type: String,
    enum: ['success', 'transferred', 'failed', 'no-answer', 'busy', 'error'],
  },
  failureReason: String,
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

callLogSchema.index({ createdAt: -1 });
callLogSchema.index({ status: 1 });
callLogSchema.index({ agentName: 1 });

export default mongoose.model('CallLog', callLogSchema);
