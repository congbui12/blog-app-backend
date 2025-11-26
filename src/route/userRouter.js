import { Router } from "express";
import checkLogin from "../middleware/checkLogin.js";
import validateRequest from "../middleware/validateRequest.js";
import userValidator from "../validator/userValidator.js";
import UserController from "../controller/UserController.js";

const userRouter = Router();

const userController = new UserController();

userRouter.get(
    "/",
    checkLogin("view your personal data"),
    userController.view_general_data.bind(userController)
);

userRouter.patch(
    "/",
    checkLogin('modify your personal data'),
    validateRequest(userValidator.updateGeneralDataSchema),
    userController.update_general_data.bind(userController)
);

userRouter.patch(
    "/change-email",
    checkLogin("change your email"),
    validateRequest(userValidator.initiateEmailUpdateSchema),
    userController.initiate_update_email.bind(userController)
);

userRouter.get(
    "/confirm-email",
    userController.confirm_email_update.bind(userController)
);

userRouter.patch(
    "/change-password",
    checkLogin("change your password"),
    validateRequest(userValidator.updatePasswordSchema),
    userController.update_password.bind(userController)
);

userRouter.get(
    "/posts",
    checkLogin("view your posts"),
    userController.list_posts.bind(userController)
);

userRouter.get(
    "/favorites",
    checkLogin('view your favorite posts'),
    userController.list_favorites_lazy.bind(userController)
);

export default userRouter;
