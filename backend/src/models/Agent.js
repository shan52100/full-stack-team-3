import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'training'],
    default: 'training',
  },
  type: {
    type: String,
    enum: ['Lead Qualification', 'Customer Support', 'Scheduling', 'Surveys', 'Demos'],
    required: true,
  },
  language: {
    type: String,
    enum: ['English', 'Spanish', 'French', 'German'],
    default: 'English',
  },
  voice: {
    type: String,
    enum: ['Professional Male', 'Professional Female', 'Friendly Male', 'Friendly Female'],
    default: 'Professional Male',
  },
  callsHandled: {
    type: Number,
    default: 0,
  },
  avgDuration: {
    type: String,
    default: '0:00',
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  // LiveKit agent config
  livekitAgentName: {
    type: String,
    default: 'my-agent',
  },
  instructions: {
    type: String,
    default: '',
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Virtual for createdAt formatted date
agentSchema.virtual('createdAtFormatted').get(function () {
  return this.createdAt.toISOString().split('T')[0];
});

agentSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Agent', agentSchema);
