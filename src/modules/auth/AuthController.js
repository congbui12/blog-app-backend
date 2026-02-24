import authService from './auth-service.js';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';
import AppError from '../../utils/error/AppError.js';
import logger from '../../utils/logger/index.js';
import { sanitizeUser } from '../../utils/helper/index.js';

class AuthController {
  constructor() {}

  register = async (req, res, next) => {
    const { username, email, password } = req.body;
    try {
      const payload = await authService.register({ username, email, password });
      return res.status(StatusCodes.CREATED).json({
        ok: true,
        message: 'Account created successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  login = (req, res, next) => {
    passport.authenticate('local', (err, user, info, _status) => {
      if (err) {
        logger.error('Passport authentication error', {
          error: err.stack,
        });
        return next(err);
      }
      if (!user) {
        return next(new AppError(info?.message, StatusCodes.BAD_REQUEST));
      }
      req.logIn(user, (err) => {
        if (err) {
          logger.error('Authentication error. Could not establish a secure session', {
            error: err.stack,
          });
          return next(err);
        }
        return res.status(StatusCodes.OK).json({
          ok: true,
          message: 'Logged in successfully',
          payload: sanitizeUser(user),
        });
      });
    })(req, res, next);
  };

  logout = (req, res, next) => {
    req.logout((err) => {
      if (err) {
        logger.error('Logout error', {
          error: err.stack,
        });
        return next(err);
      }
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destruction error during logout', {
            error: err.stack,
          });
          return next(err);
        }
        res.clearCookie('connect.sid');
        return res.sendStatus(StatusCodes.NO_CONTENT);
      });
    });
  };

  initiatePasswordReset = async (req, res, next) => {
    const { email } = req.body;
    try {
      await authService.initiatePasswordReset({ email });
      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'If this email is in our system, a reset link has been sent',
      });
    } catch (error) {
      return next(error);
    }
  };

  resetPassword = async (req, res, next) => {
    const { resetPasswordToken, newPassword } = req.body;
    try {
      await authService.resetPassword({ resetPasswordToken, newPassword });
      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      return next(error);
    }
  };
}

export default AuthController;
