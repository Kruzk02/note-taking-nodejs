import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  pages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

sectionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Section = mongoose.model('Section', sectionSchema);
export default Section;
