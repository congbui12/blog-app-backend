import 'dotenv/config';

import { mongoConnect } from './db/mongo-connect.js';
import { createMeiliClient, setupMeili } from './config/meilisearch.js';
import { createApp } from './app.js';
import logger from './utils/logger/index.js';

const startServer = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const meiliHost = process.env.MEILI_HOST;
  const meiliKey = process.env.MEILI_MASTER_KEY;

  await mongoConnect(mongoUri);
  const meiliClient = createMeiliClient(meiliHost, meiliKey);
  await setupMeili(meiliClient);
  const app = createApp({ sessionSecret: process.env.SESSION_SECRET, searchClient: meiliClient });

  const port = process.env.PORT;
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
};

startServer();
