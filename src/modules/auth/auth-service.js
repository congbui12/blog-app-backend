import User from '../../db/models/User.js';
import {
  sanitizeUser,
  createToken,
  buildResetPasswordEmail,
  sendEmail,
} from '../../utils/helper/index.js';
import AppError from '../../utils/error/AppError.js';
import { StatusCodes } from 'http-status-codes';
import logger from '../../utils/logger/index.js';
import crypto from 'crypto';

class AuthService {
  constructor() {}

  async register(input) {
    const { username, email, password } = input;
    try {
      const newUser = await User.create({ username, email, password });
      return sanitizeUser(newUser);
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError(
          'Account already exists with this email or username',
          StatusCodes.CONFLICT
        );
      }
      throw error;
    }
  }

  async initiatePasswordReset(input) {
    const { email } = input;
    const user = await User.findOne({ email }).select(
      '_id resetPasswordToken resetPasswordTokenExpiry'
    );
    if (user) {
      const { plainToken, hashedToken, expiresAt } = createToken();
      user.resetPasswordToken = hashedToken;
      user.resetPasswordTokenExpiry = expiresAt;
      await user.save();

      const clientURL = process.env.FRONTEND_BASE_URL;
      const { subject, body } = buildResetPasswordEmail(clientURL, plainToken);

      try {
        await sendEmail(email, subject, body);
      } catch (error) {
        logger.error('Could not send reset link. Please try again later', {
          error: error.stack,
        });
      }
    }
  }

  async resetPassword(input) {
    const { resetPasswordToken, newPassword } = input;
    const hashedToken = crypto.createHash('sha256').update(resetPasswordToken).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: { $gt: Date.now() },
    }).select('_id password resetPasswordToken resetPasswordTokenExpiry');
    if (!user) {
      throw new AppError('Invalid or expired reset link', StatusCodes.BAD_REQUEST);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();
  }
}

export default new AuthService();
