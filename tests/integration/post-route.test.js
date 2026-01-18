import request from 'supertest';
import { describe, beforeAll, beforeEach, it, expect } from 'vitest';
import { createApp } from '../../src/app.js';
import Post from '../../src/db/models/Post.js';
import Comment from '../../src/db/models/Comment.js';
import FavoritePost from '../../src/db/models/FavoritePost.js';
import { POST_STATUSES } from '../../src/constants/post.js';
import {
  createUser,
  setupAuthUser,
  createPost,
  createFavoritePost,
  createComment,
} from '../utils/integration-helper.js';

describe('Post Integration Tests', () => {
  let app;
  const sessionSecret = 'session-secret';

  beforeAll(() => {
    app = createApp({ sessionSecret });
  });

  describe('GET /api/v1/posts', () => {
    let userA, userB, agentA;
    beforeEach(async () => {
      const [resA, resB] = await Promise.all([
        setupAuthUser(app, {}),
        createUser({
          username: 'testuser2',
          email: 'test2@gmail.com',
        }),
      ]);

      userA = resA.user;
      agentA = resA.agent;
      userB = resB;

      await Promise.all([
        createPost({
          title: 'Python: The Language of Data and AI',
          author: userA._id,
        }),
        createPost({
          title: 'JavaScript: The Engine of the Web',
          author: userA._id,
        }),
        createPost({
          title: 'C++: The High-Performance Workhorse',
          author: userA._id,
        }),
        createPost({
          title: 'Java: The Enterprise Standard',
          status: POST_STATUSES.DRAFT,
          author: userA._id,
        }),
        createPost({
          title: 'TypeScript: JavaScript with Superpowers',
          author: userB._id,
        }),
        createPost({
          title: 'SQL: The Language of Data Management',
          author: userB._id,
        }),
        createPost({
          title: 'Rust: The Memory-Safe Systems Language',
          author: userB._id,
        }),
        createPost({
          title: 'Swift: The Core of Apple Development',
          status: POST_STATUSES.DRAFT,
          author: userB._id,
        }),
      ]);
    });

    describe('Guest Access', () => {
      it('should return only published posts', async () => {
        const res = await request(app).get('/api/v1/posts');

        const { payload, meta } = res.body;

        expect(payload).toHaveLength(5);
        expect(payload.every((p) => p.status === POST_STATUSES.PUBLISHED)).toBe(true);

        const titles = payload.map((p) => p.title);
        expect(titles).not.toContain('Java: The Enterprise Standard');
        expect(titles).not.toContain('Swift: The Core of Apple Development');
        expect(meta.hasMore).toBe(true);
      });

      it('should allow viewing other users public posts if no status provided', async () => {
        const res = await request(app).get(`/api/v1/posts?author=${userA._id}`);

        const { payload, meta } = res.body;

        expect(payload).toHaveLength(3);
        expect(payload.every((p) => p.status === POST_STATUSES.PUBLISHED)).toBe(true);
        expect(payload.every((p) => p.author._id.toString() === userA._id.toString())).toBe(true);

        const titles = payload.map((p) => p.title);
        expect(titles).not.toContain('Java: The Enterprise Standard');
        expect(meta.hasMore).toBe(false);
      });

      it('should nullify the query if a guest tries to filter by DRAFT status', async () => {
        const res = await request(app).get(`/api/v1/posts?status=${POST_STATUSES.DRAFT}`);

        const { payload, meta } = res.body;

        expect(payload).toHaveLength(0);
        expect(meta.hasMore).toBe(false);
      });
    });

    describe('Authenticated Access', () => {
      it('should allow filtering by DRAFT when viewing own posts', async () => {
        const res = await agentA.get(
          `/api/v1/posts?author=${userA._id}&status=${POST_STATUSES.DRAFT}`
        );

        const { payload, meta } = res.body;

        expect(payload).toHaveLength(1);
        expect(payload.every((p) => p.status === POST_STATUSES.DRAFT)).toBe(true);
        expect(payload.every((p) => p.author._id.toString() === userA._id.toString())).toBe(true);
        expect(meta.hasMore).toBe(false);
      });

      it('should show all own posts when viewing own posts without specific status', async () => {
        const res = await agentA.get(`/api/v1/posts?author=${userA._id}`);

        const { payload, meta } = res.body;

        expect(payload).toHaveLength(4);
        expect(meta.hasMore).toBe(false);
      });

      it('should show only PUBLISHED posts when viewing posts without specific status', async () => {
        const res = await agentA.get('/api/v1/posts');

        const { payload, meta } = res.body;

        expect(payload).toHaveLength(5);
        expect(payload.every((p) => p.status === POST_STATUSES.PUBLISHED)).toBe(true);
        expect(meta.hasMore).toBe(true);
      });

      it('should block an auth user from seeing DRAFTS of other people', async () => {
        const res = await agentA.get(
          `/api/v1/posts?author=${userB._id}&status=${POST_STATUSES.DRAFT}`
        );

        const { payload, meta } = res.body;

        expect(payload).toHaveLength(0);
        expect(meta.hasMore).toBe(false);
      });
    });

    describe('Search Functionality', () => {
      it('should handle search queries with regex', async () => {
        const res = await request(app).get('/api/v1/posts?search=script');

        const { payload, meta } = res.body;

        expect(payload).toHaveLength(2);
        expect(meta.hasMore).toBe(false);
      });
    });
  });

  describe('POST /api/v1/posts', () => {
    const createPostInput = {
      title: 'Node.js & Express: The Backend Minimalist',
      content: '<p>Express is a minimal and flexible web application framework for Node.js.</p>',
      status: POST_STATUSES.DRAFT,
    };
    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).post('/api/v1/posts').send(createPostInput);

      expect(res.status).toBe(401);
    });

    it('should create a new post if user is logged in', async () => {
      const { user, agent } = await setupAuthUser(app, {});
      const createPostRes = await agent.post('/api/v1/posts').send(createPostInput);

      expect(createPostRes.status).toBe(201);
      expect(createPostRes.body.payload.title).toBe('Node.js & Express: The Backend Minimalist');
      expect(createPostRes.body.payload.content).toBe(
        '<p>Express is a minimal and flexible web application framework for Node.js.</p>'
      );
      expect(createPostRes.body.payload.status).toBe('draft');
      expect(createPostRes.body.payload.author.toString()).toBe(user._id.toString());
    });
  });

  describe('GET /api/v1/posts/favorites', () => {
    let user, agent, firstPost, secondPost;
    beforeEach(async () => {
      ({ user, agent } = await setupAuthUser(app, {}));

      const [first, second] = await Promise.all([
        createPost({
          title: 'Python: The Language of Data and AI',
          author: user._id,
          likeCount: 1,
        }),
        createPost({
          title: 'TypeScript: JavaScript with Superpowers',
          author: user._id,
          likeCount: 1,
        }),
      ]);

      firstPost = first;
      secondPost = second;

      await Promise.all([
        createFavoritePost({
          userId: user._id,
          postId: firstPost._id,
        }),
        createFavoritePost({
          userId: user._id,
          postId: secondPost._id,
        }),
      ]);
    });

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).get('/api/v1/posts/favorites');

      expect(res.status).toBe(401);
    });

    it('should return PUBLISHED favorites if user is logged in', async () => {
      const res = await agent.get('/api/v1/posts/favorites');

      expect(res.body.payload).toHaveLength(2);
      expect(res.body.meta.hasMore).toBe(false);
    });
  });

  describe('GET /api/v1/posts/:slug', () => {
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
          title: 'Python: The Language of Data and AI',
          status: POST_STATUSES.DRAFT,
          author: userA._id,
        }),
        createPost({
          title: 'TypeScript: JavaScript with Superpowers',
          author: userB._id,
          likeCount: 1,
        }),
      ]);

      draftPost = draft;
      publishedPost = published;

      await createFavoritePost({
        userId: userA._id,
        postId: publishedPost._id,
      });
    });

    describe('Guest Access', () => {
      it('should return post data and default isFavorited (false) for PUBLISHED post', async () => {
        const res = await request(app).get(`/api/v1/posts/${publishedPost.slug}`);

        const { post, isFavorited } = res.body.payload;

        expect(res.status).toBe(200);
        expect(post.title).toBe('TypeScript: JavaScript with Superpowers');
        expect(post.author.username).toBe('testuser2');
        expect(isFavorited).toBe(false);
      });

      it('should throw 404 if guest tries to access DRAFT post', async () => {
        const res = await request(app).get(`/api/v1/posts/${draftPost.slug}`);

        expect(res.status).toBe(404);
      });
    });

    describe('Authenticated Access', () => {
      it('should return DRAFT post data if user is post owner', async () => {
        const res = await agentA.get(`/api/v1/posts/${draftPost.slug}`);

        const { post, isFavorited } = res.body.payload;

        expect(res.status).toBe(200);
        expect(post.title).toBe('Python: The Language of Data and AI');
        expect(post.author.username).toBe('testuser1');
        expect(isFavorited).toBe(false);
      });

      it('should throw 404 if user tries to access other people DRAFT post', async () => {
        const res = await agentB.get(`/api/v1/posts/${draftPost.slug}`);

        expect(res.status).toBe(404);
      });

      it('should return post data and isFavorited (true) if post is in favorites', async () => {
        const res = await agentA.get(`/api/v1/posts/${publishedPost.slug}`);

        expect(res.status).toBe(200);
        expect(res.body.payload.isFavorited).toBe(true);
      });
    });
  });

  describe('PATCH /api/v1/posts/:slug', () => {
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
          title: 'Python: The Language of Data and AI',
          status: POST_STATUSES.DRAFT,
          author: userA._id,
        }),
        createPost({
          title: 'TypeScript: JavaScript with Superpowers',
          author: userB._id,
        }),
      ]);

      draftPost = draft;
      publishedPost = published;
    });

    const updatePostInput = {
      title: 'React: The UI Component Library',
      content:
        '<p>React is a declarative JavaScript library used for building user interfaces, specifically single-page applications.</p>',
      status: POST_STATUSES.PUBLISHED,
    };

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app)
        .patch(`/api/v1/posts/${publishedPost.slug}`)
        .send(updatePostInput);

      expect(res.status).toBe(401);
    });

    it('should throw 403 if user is not post owner', async () => {
      const res = await agentB.patch(`/api/v1/posts/${draftPost.slug}`).send(updatePostInput);

      expect(res.status).toBe(403);
    });

    it('should return updated post data if user is post owner', async () => {
      const updatePostRes = await agentA.patch(`/api/v1/posts/${draftPost.slug}`).send({
        title: updatePostInput.title,
        status: POST_STATUSES.PUBLISHED,
      });

      expect(updatePostRes.status).toBe(200);
      expect(updatePostRes.body.payload.title).toBe('React: The UI Component Library');
      expect(updatePostRes.body.payload.status).toBe('published');
    });
  });

  describe('DELETE /api/v1/posts/:slug', () => {
    let userA, agentA, agentB, draftPost;
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
      agentB = resB.agent;

      const draft = await createPost({
        title: 'Python: The Language of Data and AI',
        status: POST_STATUSES.DRAFT,
        author: userA._id,
        likeCount: 1,
      });

      draftPost = draft;

      await Promise.all([
        createFavoritePost({
          userId: userA._id,
          postId: draftPost._id,
        }),
        createComment({
          content: 'hello',
          userId: userA._id,
          postId: draftPost._id,
        }),
      ]);
    });

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).delete(`/api/v1/posts/${draftPost.slug}`);

      expect(res.status).toBe(401);
    });

    it('should throw 403 if user is not post owner', async () => {
      const res = await agentB.delete(`/api/v1/posts/${draftPost.slug}`);

      expect(res.status).toBe(403);
    });

    it('should delete post and associated data if user is post owner', async () => {
      const deletePostRes = await agentA.delete(`/api/v1/posts/${draftPost.slug}`);

      expect(deletePostRes.status).toBe(204);

      const favorite = await FavoritePost.exists({ post: draftPost._id });
      expect(favorite).toBeNull();

      const comments = await Comment.find({ post: draftPost._id });
      expect(comments.length).toBe(0);
    });
  });

  describe('POST /api/v1/posts/:slug/toggle-favorite', () => {
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
          title: 'Python: The Language of Data and AI',
          status: POST_STATUSES.DRAFT,
          author: userA._id,
        }),
        createPost({
          title: 'TypeScript: JavaScript with Superpowers',
          author: userB._id,
          likeCount: 1,
        }),
      ]);

      draftPost = draft;
      publishedPost = published;

      await createFavoritePost({
        userId: userA._id,
        postId: publishedPost._id,
      });
    });

    it('should throw 401 if user is not logged in', async () => {
      const res = await request(app).post(`/api/v1/posts/${publishedPost.slug}/toggle-favorite`);

      expect(res.status).toBe(401);
    });

    it('should throw 404 if user tries to access other user DRAFT post', async () => {
      const res = await agentB.post(`/api/v1/posts/${draftPost.slug}/toggle-favorite`);

      expect(res.status).toBe(404);
    });

    it('should return favorited (true) if post not in favorites', async () => {
      const res = await agentB.post(`/api/v1/posts/${publishedPost.slug}/toggle-favorite`);

      expect(res.status).toBe(200);
      expect(res.body.payload.favorited).toBe(true);

      const post = await Post.findById(publishedPost._id).select('likeCount');
      expect(post.likeCount).toBe(2);

      const favorite = await FavoritePost.exists({
        user: userB._id,
        post: publishedPost._id,
      });

      expect(favorite).not.toBeNull();
    });

    it('should return favorited (false) if post in favorites', async () => {
      const res = await agentA.post(`/api/v1/posts/${publishedPost.slug}/toggle-favorite`);

      expect(res.status).toBe(200);
      expect(res.body.payload.favorited).toBe(false);

      const post = await Post.findById(publishedPost._id).select('likeCount');
      expect(post.likeCount).toBe(0);

      const favorite = await FavoritePost.exists({
        user: userA._id,
        post: publishedPost._id,
      });

      expect(favorite).toBeNull();
    });
  });
});
