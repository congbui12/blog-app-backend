import passport from "passport";
import LocalStrategy from "passport-local";
import User from "../model/User.js";
import { comparePassword } from "../lib/utils.js";
import logger from "../lib/logger.js";

export default function passportConfig() {

    // After login, Passport saves the user ID
    passport.serializeUser((user, done) => {
        done(null, user.id);    // stored in req.session.passport.user, can use user._id
    });

    // On future requests, Passport reads that ID and fetches the full user
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);   // stored in req.user
        } catch (error) {
            done(error);
        }
    });

    passport.use(new LocalStrategy(
        {
            usernameField: "login",
            passwordField: "password"
        },
        async (login, password, done) => {
            try {
                const isEmail = login.includes('@');
                const user = await User.findOne(isEmail ? { email: login } : { username: login });
                if (!user) {
                    return done(null, false, { message: "User not found" });
                }
                const isPasswordValid = await comparePassword(password, user.password);
                if (!isPasswordValid) {
                    return done(null, false, { message: "Incorrect password" });
                }
                return done(null, user);
            } catch (error) {
                logger.error("Passport LocalStrategy error", {
                    error: error.stack
                });
                return done(error);
            }
        }
    ));
}