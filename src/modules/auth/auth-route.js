import { Router } from 'express';
import AuthController from './AuthController.js';
import {
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter,
} from '../../middlewares/rate-limiter.js';
import { validateSchema } from '../../middlewares/validate-schema.js';
import {
  registerSchema,
  loginSchema,
  initiatePasswordResetSchema,
  resetPasswordSchema,
} from './auth-schema.js';
import { authenticate } from '../../middlewares/auth-middleware.js';

const authRouter = Router();

const authController = new AuthController();

authRouter.post(
  '/register',
  registerLimiter,
  validateSchema(registerSchema, 'body'),
  authController.register
);

authRouter.post('/login', loginLimiter, validateSchema(loginSchema, 'body'), authController.login);

authRouter.post('/logout', authenticate('sign out'), authController.logout);

authRouter.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateSchema(initiatePasswordResetSchema, 'body'),
  authController.initiatePasswordReset
);

authRouter.post(
  '/reset-password',
  validateSchema(resetPasswordSchema, 'body'),
  authController.resetPassword
);

export default authRouter;
