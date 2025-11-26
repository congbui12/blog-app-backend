import authService from "../service/authService.js";
import logger from "../lib/logger.js";
import passport from "passport";
import AppError from "../lib/AppError.js";
import { sanitizeUser } from "../lib/utils.js";

class AuthController {
    constructor() { }

    async register(req, res, next) {
        const body = req.body;
        try {
            const payload = await authService.sign_up(body);
            return res.status(201).json({
                ok: true,
                message: "User registered successfully",
                payload
            });
        } catch (error) {
            logger.error("Registration error", {
                stack: error.stack
            });
            return next(error);
        }
    }

    login(req, res, next) {
        passport.authenticate("local", (err, user, info, status) => {
            if (err) {
                logger.error("Passport authentication error", {
                    error: err.stack
                });
                return next(err);
            }
            if (!user) {
                return next(new AppError(info?.message || "Invalid credentials", 400, null));
            }
            req.logIn(user, (err) => {
                if (err) {
                    logger.error("Failed to create user session", {
                        error: err.stack
                    })
                    return next(err);
                }
                const payload = sanitizeUser(user);
                return res.status(200).json({
                    ok: true,
                    message: "Logged in successfully",
                    payload
                });
            });
        })(req, res, next);
    }

    logout(req, res, next) {
        req.logout((err) => {
            if (err) {
                logger.error("Logout error", {
                    error: err.stack
                })
                return next(err);
            }
            req.session.destroy((err) => {
                if (err) {
                    logger.error("Failed to destroy session", {
                        error: err.stack
                    })
                    return next(err);
                }
                res.clearCookie("connect.sid");
                return res.status(200).json({
                    ok: true,
                    message: "Logged out successfully"
                })
            })
        });
    }

    async initiate_password_reset(req, res, next) {
        const body = req.body;
        try {
            await authService.initiate_password_reset(body);
            return res.status(200).json({
                ok: true,
                message: "If this email is registered, a reset password link has been sent"
            });
        } catch (error) {
            logger.error("Failed to initiate password reset", {
                error: error.stack
            })
            return next(error);
        }
    }

    async reset_password(req, res, next) {
        const body = req.body;
        try {
            await authService.reset_password(body);
            return res.status(200).json({
                ok: true,
                message: "Password reset successfully"
            });
        } catch (error) {
            logger.error("Password reset error", {
                error: error.stack
            });
            return next(error);
        }
    }
}

export default AuthController;

