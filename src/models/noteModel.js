import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: ""
  },
  sections: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Section"
    }
  ],
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
    type: Date,
    default: Date.now
  }
});

noteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Note = mongoose.model('Note', noteSchema);
export default Note;

