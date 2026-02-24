import request from 'supertest';
import { vi } from 'vitest';
import User from '../../src/db/models/User.js';
import Post from '../../src/db/models/Post.js';
import FavoritePost from '../../src/db/models/FavoritePost.js';
import Comment from '../../src/db/models/Comment.js';
import { POST_STATUSES } from '../../src/constants/post.js';

export const createMockClient = ({ addImpl, updateImpl, deleteImpl, searchImpl } = {}) => {
  const mockWaitForTask = vi.fn().mockResolvedValue({ status: 'succeeded' });
  const mockIndex = {
    addDocuments: addImpl || vi.fn().mockResolvedValue({ taskUid: 12 }),
    updateDocuments: updateImpl || vi.fn().mockResolvedValue({ taskUid: 34 }),
    deleteDocument: deleteImpl || vi.fn().mockResolvedValue({ taskUid: 56 }),
    search: searchImpl || vi.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0 }),
    updateSettings: vi.fn().mockResolvedValue({ taskUid: 78 }),
  };

  const mockClient = {
    index: vi.fn(() => mockIndex),
    tasks: {
      waitForTask: mockWaitForTask,
    },
  };

  return {
    mockClient,
    mockIndex,
    mockWaitForTask,
  };
};

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

export const createUser = (overrides = {}) => {
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

export const createLexicalContent = (text = 'Hello') => ({
  root: {
    type: 'root',
    version: 1,
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text,
          },
        ],
      },
    ],
  },
});

export const createPost = (overrides = {}) => {
  return Post.create({
    title: 'title',
    content: createLexicalContent(),
    status: POST_STATUSES.PUBLISHED,
    likeCount: 0,
    ...overrides,
  });
};

export const createFavoritePost = ({ userId, postId }) => {
  return FavoritePost.create({
    user: userId,
    post: postId,
  });
};

export const createComment = ({ content, userId, postId }) => {
  return Comment.create({
    content,
    user: userId,
    post: postId,
  });
};
