import User from '../../db/models/User.js';
import AppError from '../../utils/error/AppError.js';
import { StatusCodes } from 'http-status-codes';
import { sanitizeUser, comparePassword } from '../../utils/helper/index.js';

class UserService {
  constructor() {}

  async updatePersonalData(userId, updates) {
    const { username } = updates;
    const existingUser = await User.exists({
      username,
      _id: { $ne: userId },
    });
    if (existingUser) {
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
    const user = await User.findById(userId, '_id password');
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }
    const isPasswordCorrect = await comparePassword(currentPassword, user.password);
    if (!isPasswordCorrect) {
      throw new AppError('Incorrect current password', StatusCodes.BAD_REQUEST);
    }
    user.password = newPassword;
    await user.save();
  }
}

export default new UserService();
