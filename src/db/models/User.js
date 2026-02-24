import mongoose from 'mongoose';
import { hashPassword } from '../../utils/helper/index.js';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: {
    type: String,
    default: undefined,
    index: true,
  },
  resetPasswordTokenExpiry: {
    type: Date,
    default: undefined,
    index: { expires: '0s' },
  },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await hashPassword(this.password);
  next();
});

export default mongoose.model('User', UserSchema);
