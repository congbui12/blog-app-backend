import { StatusCodes } from 'http-status-codes';
import rateLimit from 'express-rate-limit';

export const createRateLimitHandler = (actionName, windowMinutes) => {
  return (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      ok: false,
      message: `For your security, ${actionName} requests are limited. Please try again in ${windowMinutes} minutes`,
    });
  };
};

const createLimiter = (actionName, maxRequests = 5, windowMinutes = 10) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: maxRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    handler: createRateLimitHandler(actionName, windowMinutes),
  });
};

export const registerLimiter = createLimiter('registration');

export const loginLimiter = createLimiter('login');

export const forgotPasswordLimiter = createLimiter('reset');

export const commentLimiter = createLimiter('comment');
