import userService from "../service/userService.js";
import postService from "../service/postService.js";
import { sanitizeUser } from "../lib/utils.js";
import logger from "../lib/logger.js";

class UserController {
    constructor() { }

    view_general_data(req, res) {
        const user = req.user;
        const payload = sanitizeUser(user);
        return res.status(200).json({
            ok: true,
            message: "User data fetched successfully",
            payload
        });
    }

    async update_general_data(req, res, next) {
        const user = req.user;
        const body = req.body;
        logger.info("Before updating general data", {
            user: req.user
        });

        try {
            const updatedUser = await userService.update_general_data(user._id, body);
            req.user = updatedUser;
            logger.info("After updating general data", {
                user: req.user
            });

            const payload = sanitizeUser(updatedUser);
            return res.status(200).json({
                ok: true,
                message: "General user data updated successfully",
                payload
            });
        } catch (error) {
            logger.error("Failed to update general user data", {
                error: error.stack
            });
            return next(error);
        }
    }

    async initiate_update_email(req, res, next) {
        const body = req.body;
        try {
            await userService.initiate_update_email(req.user._id, body);

            return res.status(200).json({
                ok: true,
                message: "A verification email has been sent to your new email address. Please check your inbox to confirm the change"
            });
        } catch (error) {
            logger.error("Failed to initiate update email", {
                error: error.stack
            });
            return next(error);
        }
    }

    async confirm_email_update(req, res, next) {
        const query = req.query;
        logger.info("Before updating email", {
            user: req.user
        });

        try {
            const updatedUser = await userService.confirm_email_update(query);
            if (req.isAuthenticated()) {
                req.user = updatedUser;
            }
            logger.info("After updating email", {
                user: req.user
            });
            const payload = sanitizeUser(updatedUser);

            return res.status(200).json({
                ok: true,
                message: "Email address updated successfully",
                payload
            });
        } catch (error) {
            logger.error("Failed to confirm new email", {
                error: error.stack
            });
            return next(error);
        }
    }

    async update_password(req, res, next) {
        const body = req.body;

        try {
            await userService.update_password(req.user._id, body);
            return res.status(200).json({
                ok: true,
                message: "Password updated successfully"
            });
        } catch (error) {
            logger.error("Failed to change password", {
                error: error.stack
            });
            return next(error);
        }
    }

    async list_posts(req, res, next) {
        const id = req.user._id;
        const query = req.query;

        try {
            const { message, posts, meta } = await postService.list(id, query);
            return res.status(200).json({
                ok: true,
                message,
                payload: posts,
                meta
            });
        } catch (error) {
            logger.error("Failed to fetch user's posts", {
                error: error.stack
            });
            return next(error);
        }
    }

    async list_favorites_lazy(req, res, next) {
        const id = req.user._id;
        const query = req.query;

        try {
            const { message, posts, meta } = await userService.list_favorites_lazy(id, query);
            return res.status(200).json({
                ok: true,
                message,
                payload: posts,
                meta
            });
        } catch (error) {
            logger.error("Failed to fetch favorite posts", {
                error: error.stack
            });
            return next(error);
        }
    }
}

export default UserController;
