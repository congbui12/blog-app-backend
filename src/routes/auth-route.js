import { Router } from 'express';
import {
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter,
} from '../middlewares/rate-limiter.js';
import { authenticate } from '../middlewares/auth-middleware.js';
import { validateJoiSchema } from '../middlewares/validate-schema.js';
import {
  registerSchema,
  loginSchema,
  initiatePasswordResetSchema,
  passwordResetSchema,
} from '../schemas/auth-schema.js';
import AuthController from '../controllers/AuthController.js';

const authRouter = Router();

const authController = new AuthController();

authRouter.post(
  '/register',
  registerLimiter,
  validateJoiSchema(registerSchema, 'body'),
  authController.register
);

authRouter.post(
  '/login',
  loginLimiter,
  validateJoiSchema(loginSchema, 'body'),
  authController.login
);

authRouter.post('/logout', authenticate('sign out'), authController.logout);

authRouter.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateJoiSchema(initiatePasswordResetSchema, 'body'),
  authController.initiatePasswordReset
);

authRouter.post(
  '/reset-password',
  validateJoiSchema(passwordResetSchema, 'body'),
  authController.resetPassword
);

export default authRouter;
