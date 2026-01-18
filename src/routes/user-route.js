import { Router } from 'express';
import { authenticate } from '../middlewares/auth-middleware.js';
import { validateJoiSchema } from '../middlewares/validate-schema.js';
import { updatePersonalDataSchema, changePasswordSchema } from '../schemas/user-schema.js';
import UserController from '../controllers/UserController.js';

const userRouter = Router();

const userController = new UserController();

userRouter.get('/me', authenticate('view your personal data'), userController.viewPersonalData);

userRouter.patch(
  '/me',
  validateJoiSchema(updatePersonalDataSchema, 'body'),
  authenticate('modify your personal data'),
  userController.updatePersonalData
);

userRouter.patch(
  '/me/change-password',
  validateJoiSchema(changePasswordSchema, 'body'),
  authenticate('modify your password'),
  userController.changePassword
);

export default userRouter;
