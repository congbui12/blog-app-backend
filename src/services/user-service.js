import User from '../db/models/User.js';
import AppError from '../utils/AppError.js';
import { sanitizeUser, comparePassword } from '../utils/helper.js';
import { StatusCodes } from 'http-status-codes';

class UserService {
  constructor() {}

  async updatePersonalData(userId, updates) {
    const { username } = updates;
    const existingUser = await User.findOne({ username });
    if (existingUser && !existingUser._id.equals(userId)) {
      throw new AppError('Username already taken', StatusCodes.CONFLICT);
    }
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    const updatedUser = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    return sanitizeUser(updatedUser);
  }

  async changePassword(userId, input) {
    const { currentPassword, newPassword } = input;
    if (currentPassword === newPassword) {
      throw new AppError(
        'New password should be different from current password',
        StatusCodes.BAD_REQUEST
      );
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }
    const isPasswordCorrect = await comparePassword(currentPassword, user.password);
    if (!isPasswordCorrect) {
      throw new AppError('Current password is incorrect', StatusCodes.BAD_REQUEST);
    }
    user.password = newPassword;
    await user.save();
  }
}

export default new UserService();
