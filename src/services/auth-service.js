import User from '../db/models/User.js';
import AppError from '../utils/AppError.js';
import { sanitizeUser, createToken, sendEmail } from '../utils/helper.js';
import { resetPasswordEmail } from '../utils/email-templates.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';

class AuthService {
  constructor() {}

  async register(input) {
    const { username, email, password } = input;
    const existingUser = await User.exists({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      throw new AppError(
        'Account already exists with this email or username',
        StatusCodes.CONFLICT
      );
    }
    const newUser = await User.create({
      username,
      email,
      password,
    });
    return sanitizeUser(newUser);
  }

  async initiatePasswordReset(input) {
    const { email } = input;
    const user = await User.findOne({ email });
    if (user) {
      const { plainToken, hashedToken, expiresAt } = createToken();
      user.resetPasswordToken = hashedToken;
      user.resetPasswordTokenExpiry = expiresAt;
      await user.save();

      const clientURL = process.env.FRONTEND_BASE_URL;
      const { subject, body } = resetPasswordEmail(clientURL, plainToken);

      try {
        await sendEmail(email, subject, body);
      } catch (error) {
        logger.error('Could not send reset email. Please try again later', {
          email,
          stack: error.stack,
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
    });
    if (!user) {
      throw new AppError(
        'This password reset link is either invalid or expired',
        StatusCodes.BAD_REQUEST
      );
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();
  }
}

export default new AuthService();
