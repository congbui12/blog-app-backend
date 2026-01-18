import AppError from '../utils/AppError.js';
import { StatusCodes } from 'http-status-codes';

export const authenticate = (actionName) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return next(
        new AppError(
          `You are not logged in. Please login to ${actionName}`,
          StatusCodes.UNAUTHORIZED
        )
      );
    }
    next();
  };
};

export const optionalAuthenticate = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.user = null;
  next();
};
