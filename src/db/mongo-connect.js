import mongoose from 'mongoose';
import logger from '../utils/logger/index.js';

export const mongoConnect = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error('Missing MongoDB URI');
  }
  await mongoose.connect(mongoUri);
  logger.info('MongoDB connected');
};
