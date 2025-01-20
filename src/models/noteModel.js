import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, 
    maxlength: 100 
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: []
  },
  icon: {
    type: String,
    default: ""
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

noteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Note = mongoose.model('Note', noteSchema);
export default Note;

