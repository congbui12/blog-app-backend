import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logPayload = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    if (res.statusCode >= 400) {
      logger.error('HTTP Error', logPayload);
    } else {
      logger.info('HTTP Request', logPayload);
    }
  });

  next();
};
