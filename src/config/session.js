import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';

export const initializeSession = (sessionSecret) => {
  if (!sessionSecret) {
    throw new Error('Missing session secret');
  }

  return session({
    // name: 'my-session-cookie',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store:
      process.env.NODE_ENV === 'test'
        ? undefined
        : MongoStore.create({
            client: mongoose.connection.getClient(),
            ttl: 30 * 60,
            autoRemove: 'native',
            crypto: {
              secret: sessionSecret,
            },
          }),
    rolling: true,
    cookie: {
      maxAge: 30 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    },
  });
};
