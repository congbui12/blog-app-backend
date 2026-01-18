import request from 'supertest';
import { vi, describe, beforeAll, beforeEach, afterEach, it, expect } from 'vitest';
// import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';
import User from '../../src/db/models/User.js';
import * as helper from '../../src/utils/helper.js';
import crypto from 'crypto';
import { registerUser, loginUser } from '../utils/integration-helper.js';

vi.mock('../../src/utils/helper.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendEmail: vi.fn(),
  };
});

describe('Auth Integration Tests', () => {
  let app;
  const sessionSecret = 'session-secret';

  beforeAll(() => {
    // const mongoUri =
    //   mongoose.connection._connectionString ||
    //   `mongodb://${mongoose.connection.host}:${mongoose.connection.port}/`;
    app = createApp({ sessionSecret });
  });

  beforeEach(() => {
    vi.clearAllMocks(); // For sendEmail
  });

  afterEach(() => {
    vi.restoreAllMocks(); // For vi.spyOn
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return safe payload', async () => {
      const res = await registerUser(app, {});

      expect(res.status).toBe(201);
      expect(res.body.payload.username).toBe('testuser1');
      expect(res.body.payload.email).toBe('test1@test.com');
      expect(res.body.payload.password).toBeUndefined();

      const userInDb = await User.findOne({ email: 'test1@test.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb.password).not.toBe('Testpwd1!');
    });

    it('should throw 409 for duplicate email', async () => {
      await registerUser(app, {});
      const res = await registerUser(app, {
        email: 'test1@test.com',
      });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in with valid credentials', async () => {
      const agent = request.agent(app);
      await registerUser(app, {});
      const loginRes = await loginUser(agent, {});

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.payload.username).toBe('testuser1');
      expect(loginRes.body.payload.email).toBe('test1@test.com');
      expect(loginRes.body.payload.password).toBeUndefined();

      const getUserRes = await agent.get('/api/v1/users/me');
      expect(getUserRes.status).toBe(200);
    });

    it('should throw 400 for incorrect password', async () => {
      const agent = request.agent(app);
      await registerUser(app, {});
      const res = await loginUser(agent, {
        password: 'Password1!',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should log out the user', async () => {
      const agent = request.agent(app);
      await registerUser(app, {});
      const loginRes = await loginUser(agent, {});

      expect(loginRes.status).toBe(200);
      expect(loginRes.headers['set-cookie']).toBeDefined();

      const logoutRes = await agent.post('/api/v1/auth/logout');

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should initiate password reset when user sends valid email', async () => {
      await registerUser(app, {});
      const res = await request(app).post('/api/v1/auth/forgot-password').send({
        email: 'test1@test.com',
      });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset the password', async () => {
      const agent = request.agent(app);
      const email = 'test1@test.com';
      const NEW_PASSWORD = 'Newpwd1!';

      const PLAIN_TOKEN = 'd8c2b38053646a3fa0c95e002395cb4dcebabf7824c18a9d1700448088ed40b5';
      const HASHED_TOKEN = crypto.createHash('sha256').update(PLAIN_TOKEN).digest('hex');

      vi.spyOn(helper, 'createToken').mockReturnValue({
        plainToken: PLAIN_TOKEN,
        hashedToken: HASHED_TOKEN,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      await registerUser(app, {});

      // Trigger forgot-password
      await request(app).post('/api/v1/auth/forgot-password').send({ email });

      // Use the PLAIN token to reset
      const resetRes = await request(app).post('/api/v1/auth/reset-password').send({
        resetPasswordToken: PLAIN_TOKEN,
        newPassword: NEW_PASSWORD,
      });

      expect(resetRes.status).toBe(200);

      // Login with new password
      const loginRes = await loginUser(agent, {
        password: NEW_PASSWORD,
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.ok).toBe(true);
    });

    it('should throw 400 if the reset token is invalid', async () => {
      const res = await request(app).post('/api/v1/auth/reset-password').send({
        resetPasswordToken: 'd8c2b38053646a3fa0c95e002395cb4dcebabf7824c18a9d1700448088ed40b5',
        newPassword: 'Newpwd01!',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('invalid or expired');
    });
  });
});
