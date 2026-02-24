import request from 'supertest';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { createApp } from '../../src/app.js';
import { createMockClient, setupAuthUser, loginUser } from '../helpers/integration-helper.js';

describe('User Integration Tests', () => {
  let app;

  beforeEach(() => {
    const { mockClient } = createMockClient();
    app = createApp({ sessionSecret: process.env.SESSION_SECRET, searchClient: mockClient });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/users/me', () => {
    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in.');
    });

    it('should return personal data if user is logged in', async () => {
      const { agent } = await setupAuthUser(app, {});

      const res = await agent.get('/api/v1/users/me');
      expect(res.status).toBe(200);
      expect(res.body.payload.username).toBe('testuser1');
      expect(res.body.payload.email).toBe('test1@test.com');
      expect(res.body.payload.password).toBeUndefined();
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    const update = {
      username: 'testuser2',
    };
    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).patch('/api/v1/users/me').send(update);
      expect(res.status).toBe(401);
    });

    it('should return updated user if user is logged in', async () => {
      const { agent } = await setupAuthUser(app, {});

      const res = await agent.patch('/api/v1/users/me').send(update);
      expect(res.status).toBe(200);
      expect(res.body.payload.username).toBe('testuser2');
    });
  });

  describe('PATCH /api/v1/users/me/change-password', () => {
    const input = {
      currentPassword: 'Testpwd1!',
      newPassword: 'Newpwd2@',
      confirmPassword: 'Newpwd2@',
    };

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).patch('/api/v1/users/me/change-password').send(input);
      expect(res.status).toBe(401);
    });

    it('should update password if user is logged in', async () => {
      const { agent } = await setupAuthUser(app, {});

      const changePasswordRes = await agent.patch('/api/v1/users/me/change-password').send(input);
      expect(changePasswordRes.status).toBe(200);

      const logoutRes = await agent.post('/api/v1/auth/logout');
      expect(logoutRes.status).toBe(204);

      const loginRes = await loginUser(agent, {
        password: 'Newpwd2@',
      });
      expect(loginRes.status).toBe(200);
    });
  });
});
