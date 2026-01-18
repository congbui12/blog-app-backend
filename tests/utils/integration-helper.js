import request from 'supertest';
import User from '../../src/db/models/User.js';
import Post from '../../src/db/models/Post.js';
import FavoritePost from '../../src/db/models/FavoritePost.js';
import Comment from '../../src/db/models/Comment.js';
import { POST_STATUSES } from '../../src/constants/post.js';

const DEFAULT_USER = {
  username: 'testuser1',
  email: 'test1@test.com',
  password: 'Testpwd1!',
};

export const registerUser = (app, userData = {}) => {
  return request(app)
    .post(`/api/v1/auth/register`)
    .send({
      ...DEFAULT_USER,
      ...userData,
    });
};

export const loginUser = (agent, userCredentials = {}) => {
  return agent.post(`/api/v1/auth/login`).send({
    login: userCredentials.login ?? DEFAULT_USER.username,
    password: userCredentials.password ?? DEFAULT_USER.password,
  });
};

export const createUser = async (overrides = {}) => {
  return User.create({
    ...DEFAULT_USER,
    ...overrides,
  });
};

export const setupAuthUser = async (app, overrides = {}) => {
  const userData = {
    ...DEFAULT_USER,
    ...overrides,
  };
  const user = await createUser(userData);

  const agent = request.agent(app);
  await loginUser(agent, {
    login: userData.username,
    password: userData.password,
  });

  return { user, agent };
};

export const createPost = async (overrides = {}) => {
  const defaultPost = {
    title: 'Post title',
    content: '<p>content</p>',
    status: POST_STATUSES.PUBLISHED,
    author: null,
    likeCount: 0,
  };
  return Post.create({ ...defaultPost, ...overrides });
};

export const createFavoritePost = async ({ userId, postId }) => {
  return FavoritePost.create({
    user: userId,
    post: postId,
  });
};

export const createComment = async ({ content, userId, postId }) => {
  return Comment.create({
    content,
    user: userId,
    post: postId,
  });
};
