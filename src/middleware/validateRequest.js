import AppError from "../lib/AppError.js";
import logger from "../lib/logger.js";

export default function validateRequest(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            logger.warn("Validation error", {
                details: error.details
            });
            const extractedErrors = error.details.map(err => ({
                field: err.path.join("."),
                message: err.message
            }));
            return next(new AppError("Validation error", 400, extractedErrors));
        }

        req.body = value;
        next();
    }
}