import User from "../model/User.js";
import AppError from "../lib/AppError.js";
import { hashPassword, sendEmail } from "../lib/utils.js";
import crypto from "crypto";
import logger from "../lib/logger.js";

class AuthService {
    constructor() { }

    async sign_up(body) {
        const { username, email, password } = body;
        const [usernameExists, emailExists] = await Promise.all([
            User.findOne({ username: username }),
            User.findOne({ email: email })
        ]);
        if (usernameExists) {
            throw new AppError("Username is already taken", 400, null);
        }
        if (emailExists) {
            throw new AppError("Email is already taken", 400, null);
        }

        const hashedPassword = await hashPassword(password);
        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword,
        });
        await newUser.save();
        const payload = await User.findById(newUser._id).select("-password").lean();
        return payload;
    }

    async initiate_password_reset(body) {
        const { email } = body;
        const user = await User.findOne({ email: email });
        if (user) {
            const plainToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
            const tokenExpiry = Date.now() + 15 * 60 * 1000;

            user.resetPasswordToken = hashedToken;
            user.resetPasswordTokenExpiry = tokenExpiry;
            await user.save();

            const subject = `MERN STACK BLOG WEBSITE - RESET THE PASSWORD`;
            const link = `${process.env.GMAIL_CLIENT_URL}/reset-password?token=${plainToken}`;
            const emailBody = `
                <p>Click the link below to reset your password</p>
                <a href="${link}">This link is available in 15 minutes</a>
            `;

            try {
                await sendEmail(email, subject, emailBody);
            } catch (error) {
                logger.error("Failed to send password reset email", {
                    email,
                    stack: error.stack,
                });
            }
        }
    }

    async reset_password(body) {
        const { resetPasswordToken, newPassword } = body;
        const hashedToken = crypto.createHash("sha256").update(resetPasswordToken).digest("hex");
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordTokenExpiry: { $gt: Date.now() }
        });
        if (!user) {
            throw new AppError("This reset password link is either invalid or expired", 400, null);
        }

        user.password = await hashPassword(newPassword);
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpiry = undefined;
        await user.save();
    }
}

export default new AuthService();