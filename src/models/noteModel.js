const mongoose = require('mongoose');

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

module.exports = Note;

