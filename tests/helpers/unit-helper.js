import { vi } from 'vitest';
import mongoose from 'mongoose';

export const genObjectId = () => new mongoose.Types.ObjectId();

export const createMockUser = (overrides = {}) => ({
  _id: genObjectId(),
  save: vi.fn(),
  ...overrides,
});

export const createMockPost = (overrides = {}) => ({
  _id: genObjectId(),
  author: genObjectId(),
  ...overrides,
});

export const createMockComment = (overrides = {}) => ({
  _id: genObjectId(),
  ...overrides,
});
