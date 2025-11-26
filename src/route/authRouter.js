import { Router } from "express";
import {
    registerLimiter,
    loginLimiter,
    forgotPasswordLimiter
} from "../middleware/rateLimit.js";
import checkLogin from "../middleware/checkLogin.js";
import validateRequest from "../middleware/validateRequest.js";
import authValidator from "../validator/authValidator.js";
import AuthController from "../controller/AuthController.js";

const authRouter = Router();

const authController = new AuthController();

authRouter.post(
    "/register",
    registerLimiter,
    validateRequest(authValidator.registerSchema),
    authController.register.bind(authController)
);

authRouter.post(
    "/login",
    loginLimiter,
    validateRequest(authValidator.loginSchema),
    authController.login.bind(authController)
);

authRouter.post(
    "/logout",
    checkLogin('logout'),
    authController.logout.bind(authController)
);

authRouter.post(
    "/forgot-password",
    forgotPasswordLimiter,
    validateRequest(authValidator.initiatePasswordResetSchema),
    authController.initiate_password_reset.bind(authController)
);

authRouter.post(
    "/reset-password",
    validateRequest(authValidator.passwordResetSchema),
    authController.reset_password.bind(authController)
);

export default authRouter;