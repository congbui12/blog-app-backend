import 'dotenv/config';

import { mongoConnect } from './db/mongo-connect.js';
import { createApp } from './app.js';
import logger from './utils/logger.js';

const startServer = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const sessionSecret = process.env.SESSION_SECRET;

  await mongoConnect(mongoUri);
  const app = createApp({ sessionSecret });

  const port = process.env.PORT;
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
};

startServer();
