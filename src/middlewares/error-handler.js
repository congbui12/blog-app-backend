import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.isOperational ? err.message : 'Internal Server Error';
  logger.error(`Error: ${message}`, {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    stack: err.isOperational ? undefined : err.stack,
  });

  return res.status(statusCode).json({
    ok: false,
    message,
  });
};
