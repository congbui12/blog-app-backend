import request from 'supertest';
import { describe, beforeAll, it, expect } from 'vitest';
import { createApp } from '../../src/app.js';
import { registerUser, loginUser } from '../utils/integration-helper.js';

describe('User Integration Tests', () => {
  let app;
  const sessionSecret = 'session-secret';

  beforeAll(() => {
    app = createApp({ sessionSecret });
  });

  describe('GET /api/v1/users/me', () => {
    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in.');
    });

    it('should return personal data if user is logged in', async () => {
      const agent = request.agent(app);
      await registerUser(app, {});
      await loginUser(agent, {});

      const getUserRes = await agent.get('/api/v1/users/me');

      expect(getUserRes.status).toBe(200);
      expect(getUserRes.body.payload.username).toBe('testuser1');
      expect(getUserRes.body.payload.email).toBe('test1@test.com');
      expect(getUserRes.body.payload.password).toBeUndefined();
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    const updateUserInput = {
      username: 'testuser2',
    };
    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).patch('/api/v1/users/me').send(updateUserInput);

      expect(res.status).toBe(401);
    });

    it('should return updated user data if user is logged in', async () => {
      const agent = request.agent(app);
      await registerUser(app, {});
      await loginUser(agent, {});

      const updateUserRes = await agent.patch('/api/v1/users/me').send(updateUserInput);

      expect(updateUserRes.status).toBe(200);
      expect(updateUserRes.body.payload.username).toBe('testuser2');
    });
  });

  describe('PATCH /api/v1/users/me/change-password', () => {
    const changePasswordInput = {
      currentPassword: 'Testpwd1!',
      newPassword: 'Newpwd2@',
      confirmPassword: 'Newpwd2@',
    };

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me/change-password')
        .send(changePasswordInput);

      expect(res.status).toBe(401);
    });

    it('should update password if user is logged in', async () => {
      const agent = request.agent(app);
      await registerUser(app, {});
      await loginUser(agent, {});

      const changePasswordRes = await agent
        .patch('/api/v1/users/me/change-password')
        .send(changePasswordInput);

      expect(changePasswordRes.status).toBe(200);

      const logoutRes = await agent.post('/api/v1/auth/logout');

      expect(logoutRes.status).toBe(200);

      const loginRes = await loginUser(agent, {
        password: 'Newpwd2@',
      });

      expect(loginRes.status).toBe(200);
    });
  });
});
