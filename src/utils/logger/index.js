import winston from 'winston';
// import path from 'path';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json({ space: 2 })
  ),
  transports: [
    new winston.transports.Console(),
    // new winston.transports.File({
    //   filename: path.join('logs', 'error.log'),
    //   level: 'error',
    // }),
    // new winston.transports.File({
    //   filename: path.join('logs', 'combined.log'),
    // }),
  ],
});

export default logger;
