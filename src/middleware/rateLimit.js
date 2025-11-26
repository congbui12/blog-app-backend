import rateLimit from "express-rate-limit";

export const registerLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    message: "Too many register attempts. Try again later.",
});

export const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "Too many login attempts. Try again later.",
});

export const forgotPasswordLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "Too many reset attempts. Try again later.",
});

export const commentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many comment attempts. Try again later.",
});