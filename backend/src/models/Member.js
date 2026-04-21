import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, trim: true },
  year: { type: String, required: true },
  degree: { type: String, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  role: { type: String, required: true },
  project: { type: String, default: '' },
  hobbies: { type: String, default: '' },
  certificate: { type: String, default: '' },
  internship: { type: String, default: '' },
  aboutYourAim: { type: String, default: '' },
  image: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Member', memberSchema);
