import request from 'supertest';
import { describe, beforeEach, afterEach, vi, it, expect } from 'vitest';
import { createApp } from '../../src/app.js';
import Comment from '../../src/db/models/Comment.js';
import { POST_STATUSES } from '../../src/constants/post.js';
import {
  createMockClient,
  setupAuthUser,
  createPost,
  createComment,
} from '../helpers/integration-helper.js';

describe('Comment Integration Tests', () => {
  let app;
  let userA, userB, agentA, agentB, draftOfA, publishedOfB;

  beforeEach(async () => {
    const { mockClient } = createMockClient();
    app = createApp({ sessionSecret: process.env.SESSION_SECRET, searchClient: mockClient });
    const [resA, resB] = await Promise.all([
      setupAuthUser(app, {}),
      setupAuthUser(app, {
        username: 'testuser2',
        email: 'test2@test.com',
      }),
    ]);

    userA = resA.user;
    agentA = resA.agent;
    userB = resB.user;
    agentB = resB.agent;

    [draftOfA, publishedOfB] = await Promise.all([
      createPost({ status: POST_STATUSES.DRAFT, author: userA._id }),
      createPost({ author: userB._id }),
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/comments/:postId', () => {
    beforeEach(async () => {
      const comments = [
        { content: 'hi', userId: userA._id, postId: publishedOfB._id },
        { content: 'hello', userId: userA._id, postId: publishedOfB._id },
        { content: 'howdy', userId: userB._id, postId: publishedOfB._id },
        { content: 'goodbye', userId: userB._id, postId: publishedOfB._id },
        { content: 'good', userId: userA._id, postId: draftOfA._id },
        { content: 'decent', userId: userB._id, postId: draftOfA._id },
        { content: 'awesome', userId: userA._id, postId: draftOfA._id },
      ];
      await Promise.all(comments.map(createComment));
    });

    it('should handle post visibility logic and return comments correctly', async () => {
      const guestDraftRes = await request(app).get(`/api/v1/comments/${draftOfA._id}`);
      expect(guestDraftRes.status).toBe(404);

      const guestPublishedRes = await request(app).get(`/api/v1/comments/${publishedOfB._id}`);
      expect(guestPublishedRes.status).toBe(200);
      expect(guestPublishedRes.body.payload).toHaveLength(3);
      expect(guestPublishedRes.body.meta.hasMore).toBe(true);

      const otherDraftRes = await agentB.get(`/api/v1/comments/${draftOfA._id}`);
      expect(otherDraftRes.status).toBe(404);

      const authorDraftRes = await agentA.get(`/api/v1/comments/${draftOfA._id}`);
      expect(authorDraftRes.status).toBe(200);
      expect(authorDraftRes.body.payload).toHaveLength(3);
      expect(authorDraftRes.body.meta.hasMore).toBe(false);
    });
  });

  describe('POST /api/v1/comments/:postId', () => {
    it('should enforce permissions for posting comment', async () => {
      const input = { content: 'interesting' };

      // Prevent guests from posting comments
      expect(
        (await request(app).post(`/api/v1/comments/${publishedOfB._id}`).send(input)).status
      ).toBe(401);

      // Prevent users from accessing drafts of other users
      expect((await agentB.post(`/api/v1/comments/${draftOfA._id}`).send(input)).status).toBe(404);

      const userPublishedRes = await agentA
        .post(`/api/v1/comments/${publishedOfB._id}`)
        .send(input);
      expect(userPublishedRes.status).toBe(201);
      expect(userPublishedRes.body.payload.content).toBe('interesting');
      expect(userPublishedRes.body.payload.user.username).toBe('testuser1');

      const authorDraftRes = await agentA.post(`/api/v1/comments/${draftOfA._id}`).send(input);
      expect(authorDraftRes.status).toBe(201);
      expect(authorDraftRes.body.payload.content).toBe('interesting');
      expect(authorDraftRes.body.payload.user.username).toBe('testuser1');
    });
  });

  describe('PATCH/DELETE /api/v1/comments/:commentId', () => {
    it('should enforce permissions for editing/deleting comment', async () => {
      const commentOfA = await createComment({
        content: 'hello',
        userId: userA._id,
        postId: publishedOfB._id,
      });

      const commentOfB = await createComment({
        content: 'goodbye',
        userId: userB._id,
        postId: publishedOfB._id,
      });

      const update = { content: 'new' };

      const resC = await setupAuthUser(app, {
        username: 'testuser3',
        email: 'test3@test.com',
      });
      const agentC = resC.agent;

      // UPDATE
      // Prevent guests/users from editing comments of other users
      expect(
        (await request(app).patch(`/api/v1/comments/${commentOfA._id}`).send(update)).status
      ).toBe(401);
      expect((await agentB.patch(`/api/v1/comments/${commentOfA._id}`).send(update)).status).toBe(
        403
      );

      const ownerUpdateRes = await agentA.patch(`/api/v1/comments/${commentOfA._id}`).send(update);
      expect(ownerUpdateRes.status).toBe(200);
      expect(ownerUpdateRes.body.payload.content).toBe('new');
      expect(ownerUpdateRes.body.payload.user.username).toBe('testuser1');

      // DELETE
      // Prevent guests/users from editing comments of other users
      expect((await request(app).delete(`/api/v1/comments/${commentOfA._id}`)).status).toBe(401);
      expect((await agentC.delete(`/api/v1/comments/${commentOfA._id}`)).status).toBe(403);

      // Allow post author to delete comments of their posts
      expect((await agentB.delete(`/api/v1/comments/${commentOfA._id}`)).status).toBe(204);
      expect(await Comment.exists({ _id: commentOfA._id })).toBeNull();

      expect((await agentB.delete(`/api/v1/comments/${commentOfB._id}`)).status).toBe(204);
      expect(await Comment.exists({ _id: commentOfB._id })).toBeNull();
    });
  });
});
