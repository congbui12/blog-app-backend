import User from "../model/User.js";
import FavoritePost from "../model/FavoritePost.js";
import AppError from "../lib/AppError.js";
import { sendEmail, comparePassword, hashPassword } from "../lib/utils.js";
import crypto from "crypto";
import logger from "../lib/logger.js";

class UserService {
    constructor() { }

    async update_general_data(userId, body) {
        const { newUsername } = body;
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError("User not found", 400, null);
        }
        if (!newUsername || newUsername === user.username) {
            return user;
        }
        const usernameExists = await User.findOne({
            username: newUsername
        });
        if (usernameExists) {
            throw new AppError("Username is already taken", 400, null);
        }
        user.username = newUsername;
        await user.save();

        return user;
    }

    async initiate_update_email(userId, body) {
        const { newEmail } = body;
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError("User not found", 400, null);
        }
        if (!newEmail || newEmail === user.email) {
            return;
        }

        const emailExists = await User.findOne({
            email: newEmail
        });
        if (emailExists) {
            throw new AppError("Email is already taken", 400, null);
        }
        const plainToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
        const tokenExpiry = Date.now() + 15 * 60 * 1000;

        user.pendingEmail = newEmail;
        user.updateEmailToken = hashedToken;
        user.updateEmailTokenExpiry = tokenExpiry;
        await user.save();

        const subject = `MERN STACK BLOG WEBSITE - CONFIRM NEW EMAIL ADDRESS`;
        const link = `${process.env.GMAIL_CLIENT_URL}/confirm-email?token=${plainToken}`;
        const emailBody = `
            <p>Click the link below to update your email address</p>
            <a href="${link}">This link is only available in 15 minutes</a>
        `;
        try {
            await sendEmail(newEmail, subject, emailBody);
        } catch (error) {
            logger.error("Failed to send confirmation email error", {
                email: newEmail,
                error: error.stack
            });
            throw error;
        }
    }

    async confirm_email_update(query) {
        const { token } = query;
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            updateEmailToken: hashedToken,
            updateEmailTokenExpiry: { $gt: Date.now() }
        });
        if (!user) {
            throw new AppError("This confirm email link is either invalid or expired", 400, null);
        }
        user.email = user.pendingEmail;
        user.pendingEmail = undefined;
        user.updateEmailToken = undefined;
        user.updateEmailTokenExpiry = undefined;
        await user.save();
        return user;
    }

    async update_password(userId, body) {
        const { currentPassword, newPassword, confirmPassword } = body;
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError("User not found", 400, null);
        }
        const isPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new AppError("Current password is incorrect", 400, null);
        }

        if (currentPassword === newPassword) {
            throw new AppError("New password must be different from current password", 400, null);
        }

        user.password = await hashPassword(newPassword);
        await user.save();
    }

    async list_favorites_lazy(userId, query) {
        const { cursor = null, limit = 3 } = query;
        const postsPerPage = parseInt(limit);

        const filter = { user: userId };
        if (cursor) {
            filter._id = { $lt: cursor }
        }
        const sortQuery = { _id: -1 };

        const favoritePosts = await FavoritePost.find(filter)
            .sort(sortQuery)
            .limit(postsPerPage + 1)
            .populate({
                path: 'post',
                populate: {
                    path: 'writer',
                    select: 'username'
                }
            })
            .lean();

        const hasMore = favoritePosts.length > postsPerPage;
        if (hasMore) {
            favoritePosts.pop();
        }

        const posts = favoritePosts
            .filter(fp => fp.post) // skip if post is deleted
            .map(fp => {
                const post = fp.post;
                post.isFavorited = true;
                return post;
            });

        const message = posts.length > 0 ? "Favorite posts fetched successfully" : "No posts available";
        const nextCusor = favoritePosts.length > 0
            ? favoritePosts[favoritePosts.length - 1]._id
            : null;

        const meta = {
            nextCusor,
            hasMore,
        }

        return {
            message,
            posts,
            meta
        }
    }
}

export default new UserService();