import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

pageSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Page = mongoose.model('Page', pageSchema);
export default Page;
