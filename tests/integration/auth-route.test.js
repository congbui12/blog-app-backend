import request from 'supertest';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
// import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';
import User from '../../src/db/models/User.js';
import * as helper from '../../src/utils/helper/index.js';
import crypto from 'crypto';
import { createMockClient, registerUser, loginUser } from '../helpers/integration-helper.js';

vi.mock('../../src/utils/helper/index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendEmail: vi.fn(),
  };
});

describe('Auth Integration Tests', () => {
  let app;

  beforeEach(() => {
    // const mongoUri =
    //   mongoose.connection._connectionString ||
    //   `mongodb://${mongoose.connection.host}:${mongoose.connection.port}/`;
    const { mockClient } = createMockClient();
    app = createApp({ sessionSecret: process.env.SESSION_SECRET, searchClient: mockClient });
  });

  afterEach(() => {
    vi.clearAllMocks(); // For sendEmail
    vi.restoreAllMocks(); // For vi.spyOn
  });

  describe('Registration & Login', () => {
    it('should create new user and throw 409 for duplicate username or email', async () => {
      const res = await registerUser(app, {});
      expect(res.status).toBe(201);
      expect(res.body.payload.username).toBe('testuser1');
      expect(res.body.payload.email).toBe('test1@test.com');
      expect(res.body.payload.password).toBeUndefined();

      const userInDb = await User.findOne({ email: 'test1@test.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb.password).not.toBe('Testpwd1!');

      // Duplicate email
      expect(
        (await registerUser(app, { email: 'test1@test.com', username: 'testuser2' })).status
      ).toBe(409);

      // Duplicate username
      expect(
        (await registerUser(app, { email: 'test2@test.com', username: 'testuser1' })).status
      ).toBe(409);
    });

    it('should handle login flow and auth persistence', async () => {
      const agent = request.agent(app);
      await registerUser(app, {});

      const failedLoginRes = await loginUser(agent, {
        password: 'Password1!',
      });
      expect(failedLoginRes.status).toBe(400);
      expect(failedLoginRes.body.message).toBe('Invalid credentials');

      const successLoginRes = await loginUser(agent, {});
      expect(successLoginRes.status).toBe(200);
      expect(successLoginRes.headers['set-cookie']).toBeDefined();
      expect(successLoginRes.body.payload.username).toBe('testuser1');
      expect(successLoginRes.body.payload.email).toBe('test1@test.com');
      expect(successLoginRes.body.payload.password).toBeUndefined();

      const successLogoutRes = await agent.post('/api/v1/auth/logout');
      expect(successLogoutRes.status).toBe(204);
    });
  });

  describe('Password reset', () => {
    it('should reset password with valid token', async () => {
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
      expect((await request(app).post('/api/v1/auth/forgot-password').send({ email })).status).toBe(
        200
      );

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

    it('should throw 400 for invalid reset token', async () => {
      const res = await request(app).post('/api/v1/auth/reset-password').send({
        resetPasswordToken: 'd8c2b38053646a3fa0c95e002395cb4dcebabf7824c18a9d1700448088ed40b5',
        newPassword: 'Newpwd01!',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid or expired');
    });
  });
});
