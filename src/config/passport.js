import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../db/models/User.js';
import { comparePassword } from '../utils/helper.js';
import logger from '../utils/logger.js';

export const passportConfig = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'login',
        passwordField: 'password',
      },
      async (login, password, done) => {
        try {
          const isEmail = login.includes('@');
          const user = await User.findOne(isEmail ? { email: login } : { username: login });
          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }
          const isPasswordValid = await comparePassword(password, user.password);
          if (!isPasswordValid) {
            return done(null, false, { message: 'Invalid credentials' });
          }
          return done(null, user);
        } catch (error) {
          logger.error('Passport LocalStrategy failed', {
            error: error.stack,
          });
          return done(error);
        }
      }
    )
  );
};
