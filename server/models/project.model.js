import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'contributor', 'viewer'], default: 'contributor' },
});

const listSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
});

const projectSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members:     [memberSchema],
    lists:       [listSchema],
    isArchived:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
