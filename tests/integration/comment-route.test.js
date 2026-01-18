import request from 'supertest';
import { describe, beforeEach, it, expect } from 'vitest';
import { createApp } from '../../src/app.js';
import Comment from '../../src/db/models/Comment.js';
import { POST_STATUSES } from '../../src/constants/post.js';
import { setupAuthUser, createPost, createComment } from '../utils/integration-helper.js';

describe('Comment Integration Tests', () => {
  let app;
  const sessionSecret = 'session-secret';

  beforeEach(() => {
    app = createApp({ sessionSecret });
  });

  describe('GET /api/v1/comments/:postSlug', () => {
    let userA, userB, agentA, agentB, draftPost, publishedPost;
    beforeEach(async () => {
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

      const [draft, published] = await Promise.all([
        createPost({
          title: 'C++: The High-Performance Workhorse',
          status: POST_STATUSES.DRAFT,
          author: userB._id,
        }),
        createPost({
          title: 'Java: The Enterprise Standard',
          author: userA._id,
        }),
      ]);

      draftPost = draft;
      publishedPost = published;

      await Promise.all([
        createComment({
          content: 'hi',
          userId: userA._id,
          postId: publishedPost._id,
        }),
        createComment({
          content: 'hello',
          userId: userA._id,
          postId: publishedPost._id,
        }),
        createComment({
          content: 'howdy',
          userId: userB._id,
          postId: publishedPost._id,
        }),
        createComment({
          content: 'how you doing',
          userId: userB._id,
          postId: publishedPost._id,
        }),
        createComment({
          content: 'good',
          userId: userA._id,
          postId: draftPost._id,
        }),
        createComment({
          content: 'decent',
          userId: userB._id,
          postId: draftPost._id,
        }),
        createComment({
          content: 'awesome',
          userId: userA._id,
          postId: draftPost._id,
        }),
      ]);
    });

    describe('Guest Access', () => {
      it('should throw 404 if guest tries to access DRAFT post', async () => {
        const res = await request(app).get(`/api/v1/comments/${draftPost.slug}`);

        expect(res.status).toBe(404);
      });

      it('should return comments for PUBLISHED post', async () => {
        const res = await request(app).get(`/api/v1/comments/${publishedPost.slug}`);

        expect(res.status).toBe(200);
        expect(res.body.payload).toHaveLength(3);
        expect(res.body.meta.hasMore).toBe(true);
      });
    });

    describe('Authenticated Access', () => {
      it('should throw 404 if user tries to access other user DRAFT post', async () => {
        const res = await agentA.get(`/api/v1/comments/${draftPost.slug}`);

        expect(res.status).toBe(404);
      });

      it('should return comments for DRAFT post if user is post owner', async () => {
        const res = await agentB.get(`/api/v1/comments/${draftPost.slug}`);

        expect(res.status).toBe(200);
        expect(res.body.payload).toHaveLength(3);
        expect(res.body.meta.hasMore).toBe(false);
      });
    });
  });

  describe('POST /api/v1/comments/:postSlug', () => {
    let userA, userB, agentA, agentB, draftPost, publishedPost;
    beforeEach(async () => {
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

      const [draft, published] = await Promise.all([
        createPost({
          title: 'C++: The High-Performance Workhorse',
          status: POST_STATUSES.DRAFT,
          author: userB._id,
        }),
        createPost({
          title: 'Java: The Enterprise Standard',
          author: userA._id,
        }),
      ]);

      draftPost = draft;
      publishedPost = published;
    });
    const addCommentInput = {
      content: 'interesting',
    };

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/${publishedPost.slug}`)
        .send(addCommentInput);

      expect(res.status).toBe(401);
    });

    it('should throw 404 if user tries to comment on DRAFT post', async () => {
      const res = await agentA.post(`/api/v1/comments/${draftPost.slug}`).send(addCommentInput);

      expect(res.status).toBe(404);
    });

    it('should return new comment if user comments on PUBLISHED post', async () => {
      const res = await agentA.post(`/api/v1/comments/${publishedPost.slug}`).send(addCommentInput);

      expect(res.status).toBe(201);
      expect(res.body.payload.content).toBe('interesting');
      expect(res.body.payload.user.username).toBe('testuser1');
    });

    it('should return new comment if user comments on own DRAFT post', async () => {
      const res = await agentB.post(`/api/v1/comments/${draftPost.slug}`).send(addCommentInput);

      expect(res.status).toBe(201);
      expect(res.body.payload.content).toBe('interesting');
      expect(res.body.payload.user.username).toBe('testuser2');
    });
  });

  describe('PATCH /api/v1/comments/:id', () => {
    let userA, userB, agentA, agentB, agentC, publishedPost, commentA;
    beforeEach(async () => {
      const [resA, resB, resC] = await Promise.all([
        setupAuthUser(app, {}),
        setupAuthUser(app, {
          username: 'testuser2',
          email: 'test2@test.com',
        }),
        setupAuthUser(app, {
          username: 'testuser3',
          email: 'test3@test.com',
        }),
      ]);

      userA = resA.user;
      agentA = resA.agent;
      userB = resB.user;
      agentB = resB.agent;
      agentC = resC.agent;

      const published = await createPost({
        title: 'C++: The High-Performance Workhorse',
        author: userB._id,
      });

      publishedPost = published;

      const newComment = await createComment({
        content: 'hello',
        userId: userA._id,
        postId: publishedPost._id,
      });
      commentA = newComment;
    });

    const updateCommentInput = {
      content: 'howdy',
    };

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app)
        .patch(`/api/v1/comments/${commentA._id}`)
        .send(updateCommentInput);

      expect(res.status).toBe(401);
    });

    it('should throw 403 if user is not post author or comment owner', async () => {
      const res = await agentC.patch(`/api/v1/comments/${commentA._id}`).send(updateCommentInput);

      expect(res.status).toBe(403);
    });

    it('should update comment if user is post author', async () => {
      const res = await agentB.patch(`/api/v1/comments/${commentA._id}`).send(updateCommentInput);

      expect(res.status).toBe(200);
      expect(res.body.payload.content).toBe('howdy');
      expect(res.body.payload.user.username).toBe('testuser1');
    });

    it('should update comment if user is comment owner', async () => {
      const res = await agentA.patch(`/api/v1/comments/${commentA._id}`).send(updateCommentInput);

      expect(res.status).toBe(200);
      expect(res.body.payload.content).toBe('howdy');
      expect(res.body.payload.user.username).toBe('testuser1');
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    let userA, userB, agentA, agentB, agentC, publishedPost, commentA;
    beforeEach(async () => {
      const [resA, resB, resC] = await Promise.all([
        setupAuthUser(app, {}),
        setupAuthUser(app, {
          username: 'testuser2',
          email: 'test2@test.com',
        }),
        setupAuthUser(app, {
          username: 'testuser3',
          email: 'test3@test.com',
        }),
      ]);

      userA = resA.user;
      agentA = resA.agent;
      userB = resB.user;
      agentB = resB.agent;
      agentC = resC.agent;

      const published = await createPost({
        title: 'C++: The High-Performance Workhorse',
        author: userB._id,
      });

      publishedPost = published;

      const newComment = await createComment({
        content: 'hello',
        userId: userA._id,
        postId: publishedPost._id,
      });
      commentA = newComment;
    });

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).delete(`/api/v1/comments/${commentA._id}`);

      expect(res.status).toBe(401);
    });

    it('should throw 403 if user is not post author or comment owner', async () => {
      const res = await agentC.delete(`/api/v1/comments/${commentA._id}`);

      expect(res.status).toBe(403);
    });

    it('should delete comment if user is post author', async () => {
      const res = await agentB.delete(`/api/v1/comments/${commentA._id}`);

      expect(res.status).toBe(204);
      const deletedComment = await Comment.exists({
        _id: commentA._id,
      });
      expect(deletedComment).toBeNull();
    });

    it('should delete comment if user is comment owner', async () => {
      const res = await agentA.delete(`/api/v1/comments/${commentA._id}`);

      expect(res.status).toBe(204);

      const deletedComment = await Comment.exists({
        _id: commentA._id,
      });
      expect(deletedComment).toBeNull();
    });
  });
});
