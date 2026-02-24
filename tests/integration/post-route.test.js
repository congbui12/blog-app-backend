import request from 'supertest';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { createApp } from '../../src/app.js';
import Post from '../../src/db/models/Post.js';
import Comment from '../../src/db/models/Comment.js';
import FavoritePost from '../../src/db/models/FavoritePost.js';
import { POST_STATUSES } from '../../src/constants/post.js';
import {
  createMockClient,
  setupAuthUser,
  createPost,
  createLexicalContent,
  createFavoritePost,
  createComment,
} from '../helpers/integration-helper.js';

describe('Post Integration Tests', () => {
  let app;
  let userA, userB, agentA, agentB;

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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/posts', () => {
    beforeEach(async () => {
      const posts = [
        { author: userA._id },
        { author: userA._id },
        { author: userA._id },
        { author: userA._id, status: POST_STATUSES.DRAFT },
        { author: userB._id },
        { author: userB._id },
        { author: userB._id },
        { author: userB._id, status: POST_STATUSES.DRAFT },
      ];
      await Promise.all(posts.map(createPost));
    });

    it('should return only published posts for guest', async () => {
      const res = await request(app).get('/api/v1/posts');
      const { payload, meta } = res.body;

      expect(res.status).toBe(200);
      expect(payload).toHaveLength(5);
      expect(payload.every((p) => p.status === POST_STATUSES.PUBLISHED)).toBe(true);
      expect(payload.every((p) => p.content === undefined)).toBe(true);
      expect(meta).toEqual({
        postCount: 6,
        totalPages: 2,
        hasMore: true,
      });
    });

    it('should return all personal posts for logged-in user', async () => {
      const res = await agentA.get(`/api/v1/posts?author=${userA._id}`);
      const { payload, meta } = res.body;

      expect(payload).toHaveLength(4);
      expect(meta).toEqual({
        postCount: 4,
        totalPages: 1,
        hasMore: false,
      });
    });

    it('should allow filtering personal posts by specific status', async () => {
      const res = await agentA.get(
        `/api/v1/posts?author=${userA._id}&status=${POST_STATUSES.DRAFT}`
      );
      const { payload, meta } = res.body;

      expect(payload).toHaveLength(1);
      expect(payload.every((p) => p.author._id.toString() === userA._id.toString())).toBe(true);
      expect(meta).toEqual({
        postCount: 1,
        totalPages: 1,
        hasMore: false,
      });
    });

    it('should block access to other drafts', async () => {
      const res = await agentA.get(
        `/api/v1/posts?author=${userB._id}&status=${POST_STATUSES.DRAFT}`
      );
      const { payload, meta } = res.body;

      expect(payload).toHaveLength(0);
      expect(meta).toEqual({
        postCount: 0,
        totalPages: 0,
        hasMore: false,
      });
    });
  });

  describe('GET /api/v1/posts/search', () => {
    it('should return posts based on Meili hits', async () => {
      // Create DB posts
      const post1 = await createPost({ title: 'JavaScript', author: userA._id });
      const post2 = await createPost({ title: 'Java', author: userB._id });

      // Mock Meili search hits
      const mockHits = [{ id: post1._id.toString() }, { id: post2._id.toString() }];

      const { mockClient } = createMockClient({
        searchImpl: vi.fn().mockResolvedValue({
          hits: mockHits,
          estimatedTotalHits: mockHits.length,
        }),
      });

      const localApp = createApp({
        sessionSecret: process.env.SESSION_SECRET,
        searchClient: mockClient,
      });

      // Call endpoint
      const res = await request(localApp).get('/api/v1/posts/search?term=java');

      expect(res.status).toBe(200);
      expect(res.body.payload).toHaveLength(2);
      expect(res.body.meta.postCount).toBe(2);
    });
  });

  describe('POST /api/v1/posts', () => {
    const input = {
      title: 'Node.js',
      content: createLexicalContent(),
      status: POST_STATUSES.DRAFT,
    };

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).post('/api/v1/posts').send(input);
      expect(res.status).toBe(401);
    });

    it('should create a new post if user is logged in', async () => {
      const res = await agentA.post('/api/v1/posts').send(input);
      expect(res.status).toBe(201);
      expect(res.body.payload._id).toBeDefined();

      expect((await agentA.post('/api/v1/posts').send({ ...input, content: 'hello' })).status).toBe(
        400
      );
    });
  });

  describe('Post management (get, update, delete, list favorites, toggle favorite)', () => {
    let draftOfA, publishedOfB;
    beforeEach(async () => {
      const [newDraft, newPublished] = await Promise.all([
        createPost({
          status: POST_STATUSES.DRAFT,
          author: userA._id,
          likeCount: 1,
        }),
        createPost({
          author: userB._id,
          likeCount: 1,
        }),
      ]);

      draftOfA = newDraft;
      publishedOfB = newPublished;

      await Promise.all([
        createFavoritePost({
          userId: userA._id,
          postId: publishedOfB._id,
        }),
        createFavoritePost({
          userId: userA._id,
          postId: draftOfA._id,
        }),
        createComment({
          content: 'hello',
          userId: userB._id,
          postId: publishedOfB._id,
        }),
      ]);
    });
    const update = {
      title: 'React',
      content: createLexicalContent('React'),
      status: POST_STATUSES.PUBLISHED,
    };

    it('GET /api/v1/posts/:postId', async () => {
      const guestPublishedRes = await request(app).get(`/api/v1/posts/${publishedOfB._id}`);
      expect(guestPublishedRes.status).toBe(200);
      expect(guestPublishedRes.body.payload.author.username).toBe('testuser2');
      expect(guestPublishedRes.body.payload.isFavorited).toBe(false);

      // Prevent guests/users from accessing drafts of other users
      expect((await request(app).get(`/api/v1/posts/${draftOfA._id}`)).status).toBe(404);
      expect((await agentB.get(`/api/v1/posts/${draftOfA._id}`)).status).toBe(404);

      // Allow author to view own drafts
      expect((await agentA.get(`/api/v1/posts/${draftOfA._id}`)).status).toBe(200);

      const userPublishedRes = await agentA.get(`/api/v1/posts/${publishedOfB._id}`);
      expect(userPublishedRes.status).toBe(200);
      expect(userPublishedRes.body.payload.isFavorited).toBe(true);
    });

    it('PATCH /api/v1/posts/:postId', async () => {
      // Prevent guests/users from editing posts of other users
      expect(
        (await request(app).patch(`/api/v1/posts/${publishedOfB._id}`).send(update)).status
      ).toBe(401);
      expect((await agentB.patch(`/api/v1/posts/${draftOfA._id}`).send(update)).status).toBe(403);

      const updatePostRes = await agentA.patch(`/api/v1/posts/${draftOfA._id}`).send(update);
      expect(updatePostRes.status).toBe(200);
      expect(updatePostRes.body.payload.title).toBe('React');
      expect(updatePostRes.body.payload.content).toEqual({
        root: {
          type: 'root',
          version: 1,
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'React',
                },
              ],
            },
          ],
        },
      });
      expect(updatePostRes.body.payload.status).toBe('published');
      expect(updatePostRes.body.payload.isFavorited).toBe(true);
    });

    it('DELETE /api/v1/posts/:postId', async () => {
      // Prevent guests/users from deleting posts of other users
      expect((await request(app).delete(`/api/v1/posts/${publishedOfB._id}`)).status).toBe(401);
      expect((await agentA.delete(`/api/v1/posts/${publishedOfB._id}`)).status).toBe(403);

      const deletePostRes = await agentB.delete(`/api/v1/posts/${publishedOfB._id}`);
      expect(deletePostRes.status).toBe(204);
      expect(await FavoritePost.exists({ post: publishedOfB._id })).toBeNull();
      expect(await Comment.find({ post: publishedOfB._id })).toHaveLength(0);
    });

    it('GET /api/v1/posts/favorites', async () => {
      // Prevent guests from viewing own favorites
      expect((await request(app).get('/api/v1/posts/favorites')).status).toBe(401);

      // Return only published posts for favorites
      const favoriteRes = await agentA.get('/api/v1/posts/favorites');
      expect(favoriteRes.body.payload).toHaveLength(1);
      expect(favoriteRes.body.meta.hasMore).toBe(false);
    });

    it('POST /api/v1/posts/:postId/toggle-favorite', async () => {
      // Prevent guests from toggling favorite
      expect(
        (await request(app).post(`/api/v1/posts/${publishedOfB._id}/toggle-favorite`)).status
      ).toBe(401);

      // Prevent users from accessing drafts of other users
      expect((await agentB.post(`/api/v1/posts/${draftOfA._id}/toggle-favorite`)).status).toBe(404);

      // Not allow users to like/dislike draft posts
      expect((await agentA.post(`/api/v1/posts/${draftOfA._id}/toggle-favorite`)).status).toBe(400);

      // Toggle on - increase likeCount
      const toggleOnRes = await agentB.post(`/api/v1/posts/${publishedOfB._id}/toggle-favorite`);
      expect(toggleOnRes.status).toBe(200);
      expect(toggleOnRes.body.payload.likeCount).toBe(2);
      expect(toggleOnRes.body.payload.isFavorited).toBe(true);

      expect((await Post.findById(publishedOfB._id)).likeCount).toBe(2);
      expect(
        await FavoritePost.exists({
          user: userB._id,
          post: publishedOfB._id,
        })
      ).not.toBeNull();

      // Toggle off - decrease likeCount
      const toggleOffRes = await agentA.post(`/api/v1/posts/${publishedOfB._id}/toggle-favorite`);
      expect(toggleOffRes.status).toBe(200);
      expect(toggleOffRes.body.payload.likeCount).toBe(1);
      expect(toggleOffRes.body.payload.isFavorited).toBe(false);

      expect((await Post.findById(publishedOfB._id)).likeCount).toBe(1);
      expect(
        await FavoritePost.exists({
          user: userA._id,
          post: publishedOfB._id,
        })
      ).toBeNull();
    });
  });
});
