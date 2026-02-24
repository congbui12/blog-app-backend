import { Router } from 'express';
import UserController from './UserController.js';
import { authenticate } from '../../middlewares/auth-middleware.js';
import { validateSchema } from '../../middlewares/validate-schema.js';
import { updatePersonalDataSchema, changePasswordSchema } from './user-schema.js';

const userRouter = Router();

const userController = new UserController();

userRouter.get('/me', authenticate('view your personal data'), userController.viewPersonalData);

userRouter.patch(
  '/me',
  validateSchema(updatePersonalDataSchema, 'body'),
  authenticate('edit your personal data'),
  userController.updatePersonalData
);

userRouter.patch(
  '/me/change-password',
  validateSchema(changePasswordSchema, 'body'),
  authenticate('change your password'),
  userController.changePassword
);

export default userRouter;
