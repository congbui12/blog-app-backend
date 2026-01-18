import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import cors from 'cors';
import { initializeCors } from './config/cors.js';
import { passportConfig } from './config/passport.js';
import { initializeSession } from './config/session.js';
// import { requestLogger } from './middlewares/request-logger.js';
import { errorHandler } from './middlewares/error-handler.js';
import router from './routes/index.js';

export const createApp = ({ sessionSecret }) => {
  const app = express();

  app.use(helmet());
  app.use(cors(initializeCors()));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  passportConfig(); // before passport.initialize()
  app.use(initializeSession(sessionSecret)); // before passport.session()

  app.use(passport.initialize());
  app.use(passport.session());

  // app.use(requestLogger);
  app.use('/api/v1', router);

  app.use(errorHandler);

  return app;
};
