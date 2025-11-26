import AppError from "../lib/AppError.js";

export default function checkLogin(task = "perform this action") {
    return (req, res, next) => {
        if (req.isAuthenticated()) {    // Use req.isAuthenticated() only using Passport.js
            return next();
        }
        return next(new AppError(`You need to log in to ${task}`, 401, null));
    }
}