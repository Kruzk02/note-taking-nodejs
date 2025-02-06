import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: [6, 'username should be more than 6 characters'],
      maxlength: [128, 'username should be less than 128 characters']
    },
    email: {
      type: String,
      required: true,
      unique: true,
      minlength: [8, 'email should be more than 8 characters'],
      maxlength: [256, 'email should be less than 256 characters'],
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: true,
      minlength: [6, 'password should be more than 6 characters'],
      maxlength: [128, 'password should be less than 128 characters']
    },
    role: {
      type: String,
      required: true,
      default: 'user',
    },
    privilege: {
      type: [String],
      required: true,
      default: ['READ', "WRITE"],
    },
    picture: {
      type: String,
      default: "uploads/profile_picture/default_profile_picture.png"
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;

