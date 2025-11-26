export default function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : "Internal Server Error";
    const details = err.details;

    const errorPayload = {
        ok: false,
        message,
    }

    if (details !== null && details !== undefined) {
        errorPayload.details = details;
    }

    return res.status(statusCode).json(errorPayload);
}