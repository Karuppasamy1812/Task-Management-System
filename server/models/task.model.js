import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const historySchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String },
    from:   { type: String },
    to:     { type: String },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    listId:      { type: mongoose.Schema.Types.ObjectId, required: true },
    assignees:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status:      { type: String, enum: ['todo', 'in-progress', 'review', 'done'], default: 'todo' },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate:     { type: Date },
    order:       { type: Number, default: 0 },
    comments:    [commentSchema],
    history:     [historySchema],
    labels:      [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
