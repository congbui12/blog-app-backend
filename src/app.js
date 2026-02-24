import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { initializeCors } from './config/cors.js';
import { passportConfig } from './config/passport.js';
import { initializeSession } from './config/session.js';
import passport from 'passport';
// import { requestLogger } from './middlewares/request-logger.js';
import router from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';

export const createApp = ({ sessionSecret, searchClient } = {}) => {
  const app = express();

  app.use(helmet());
  app.use(cors(initializeCors()));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  passportConfig(); // before passport.initialize()
  app.use(initializeSession(sessionSecret)); // before passport.session()

  app.use(passport.initialize());
  app.use(passport.session());

  // Inject searchClient into request context
  app.use((req, res, next) => {
    req.searchClient = searchClient;
    next();
  });

  // app.use(requestLogger);
  app.use('/api/v1', router);

  app.use(errorHandler);

  return app;
};
