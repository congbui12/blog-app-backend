import { vi, describe, beforeEach, it, expect } from 'vitest';
import commentService from '../../../src/services/comment-service.js';
import Post from '../../../src/db/models/Post.js';
import Comment from '../../../src/db/models/Comment.js';
import AppError from '../../../src/utils/AppError.js';
import { POST_STATUSES } from '../../../src/constants/post.js';
import {
  genObjectId,
  createMockUser,
  createMockPost,
  createMockComment,
} from '../../utils/unit-helper.js';

vi.mock('../../../src/db/models/Post.js', () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('../../../src/db/models/Comment.js', () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

// Mock Mongoose chain: .select()
const createSelectMock = (data) => ({
  select: vi.fn().mockResolvedValue(data),
});

describe('Comment Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listLazy()', () => {
    // Mock Mongoose chain: .sort().limit().populate().lean()
    const createSortMock = (data) => ({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(data),
    });

    it('should throw 404 if post not found', async () => {
      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(null));

      await expect(commentService.listLazy('slug', null, {})).rejects.toThrow(AppError);

      await expect(commentService.listLazy('slug', null, {})).rejects.toMatchObject({
        message: 'Post not found',
        statusCode: 404,
        isOperational: true,
      });
    });

    it('should throw 404 if post is draft and user is not author', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        author: genObjectId(),
        status: POST_STATUSES.DRAFT,
      });

      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(mockPost));

      await expect(commentService.listLazy('slug', mockUser, {})).rejects.toThrow(AppError);

      await expect(commentService.listLazy('slug', mockUser, {})).rejects.toMatchObject({
        message: 'Post not found',
        statusCode: 404,
        isOperational: true,
      });
    });

    it('should return empty array and meta data when no comments found', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        author: mockUser._id,
        status: POST_STATUSES.PUBLISHED,
      });

      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(mockPost));
      vi.mocked(Comment.find).mockReturnValue(createSortMock([]));

      const result = await commentService.listLazy('slug', mockUser, {});

      expect(result.message).toBe('No comments available');
      expect(result.comments).toEqual([]);
      expect(result.meta.hasMore).toBe(false);
      expect(result.meta.nextCursor).toBeNull();
    });

    it('should handle lazy loading correctly', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        author: genObjectId(),
        status: POST_STATUSES.PUBLISHED,
      });

      const mockComments = [createMockComment(), createMockComment(), createMockComment()];

      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(mockPost));
      vi.mocked(Comment.find).mockReturnValue(createSortMock(mockComments));

      const result = await commentService.listLazy('slug', mockUser, {
        cursor: null,
        limit: 2,
        sortOrder: 'desc',
      });

      expect(result.message).toBe('Comments fetched successfully');
      expect(result.comments).toHaveLength(2);
      expect(result.meta.nextCursor.toString()).toBe(mockComments[1]._id.toString());
      expect(result.meta.hasMore).toBe(true);
    });

    it('should fetch next page of results when cursor is provided', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        author: genObjectId(),
        status: POST_STATUSES.PUBLISHED,
      });

      const existingCursor = genObjectId();
      const mockComments = [createMockComment(), createMockComment()];

      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(mockPost));
      vi.mocked(Comment.find).mockReturnValue(createSortMock(mockComments));

      const result = await commentService.listLazy('slug', mockUser, {
        cursor: existingCursor.toString(),
        limit: 2,
        sortOrder: 'desc',
      });

      expect(Comment.find).toHaveBeenCalledWith({
        _id: { $lt: existingCursor.toString() },
        post: mockPost._id,
      });

      expect(result.message).toBe('Comments fetched successfully');
      expect(result.comments).toHaveLength(2);
      expect(result.meta.hasMore).toBe(false);
      expect(result.meta.nextCursor.toString()).toBe(mockComments[1]._id.toString());
    });
  });

  describe('add()', () => {
    const input = { content: 'hi' };
    const mockUser = createMockUser();

    it('should create a new comment and return populated comment payload for PUBLISHED post', async () => {
      const mockPost = createMockPost({
        author: genObjectId(),
        status: POST_STATUSES.PUBLISHED,
      });

      const mockCommentObj = createMockComment({
        content: input.content,
        user: mockUser,
        post: mockPost._id,
      });

      const mockCommentDoc = {
        ...mockCommentObj,
        populate: vi.fn().mockReturnThis(),
        toObject: vi.fn().mockReturnValue(mockCommentObj),
      };

      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(mockPost));
      vi.mocked(Comment.create).mockResolvedValue(mockCommentDoc);

      const result = await commentService.add('slug', mockUser, input);

      expect(Comment.create).toHaveBeenCalledWith({
        content: 'hi',
        post: mockPost._id,
        user: mockUser._id,
      });
      expect(mockCommentDoc.populate).toHaveBeenCalledWith('user', 'username');
      expect(mockCommentDoc.toObject).toHaveBeenCalledOnce();
      expect(result.content).toBe('hi');
    });

    it('should create a new comment and return populated comment payload for DRAFT post if user is post owner', async () => {
      const mockPost = createMockPost({
        author: mockUser._id,
        status: POST_STATUSES.DRAFT,
      });

      const mockCommentObj = createMockComment({
        content: input.content,
        user: mockUser,
        post: mockPost._id,
      });

      const mockCommentDoc = {
        ...mockCommentObj,
        populate: vi.fn().mockReturnThis(),
        toObject: vi.fn().mockReturnValue(mockCommentObj),
      };

      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(mockPost));
      vi.mocked(Comment.create).mockResolvedValue(mockCommentDoc);

      const result = await commentService.add('slug', mockUser, input);

      expect(Comment.create).toHaveBeenCalledWith({
        content: 'hi',
        post: mockPost._id,
        user: mockUser._id,
      });
      expect(mockCommentDoc.populate).toHaveBeenCalledWith('user', 'username');
      expect(mockCommentDoc.toObject).toHaveBeenCalledOnce();
      expect(result.content).toBe('hi');
    });
  });

  describe('edit()', () => {
    const input = { content: 'new' };
    const mockUser = createMockUser();

    it('should throw 404 if comment not found', async () => {
      vi.mocked(Comment.findById).mockResolvedValue(null);

      await expect(commentService.edit(null, mockUser, input)).rejects.toThrow(AppError);

      await expect(commentService.edit(null, mockUser, input)).rejects.toMatchObject({
        message: 'Comment not found',
        statusCode: 404,
        isOperational: true,
      });
    });

    it('should throw 403 if user is not post owner or comment owner', async () => {
      const mockPost = createMockPost({
        author: genObjectId(),
      });
      const mockComment = createMockComment({
        user: genObjectId(),
        post: mockPost._id,
      });

      vi.mocked(Comment.findById).mockResolvedValue(mockComment);
      vi.mocked(Post.findById).mockReturnValue(createSelectMock(mockPost));

      await expect(commentService.edit(mockComment._id, mockUser, input)).rejects.toThrow(AppError);

      await expect(commentService.edit(mockComment._id, mockUser, input)).rejects.toMatchObject({
        message: 'You are not authorized to edit this comment',
        statusCode: 403,
        isOperational: true,
      });
    });

    it('should update comment if user is comment owner', async () => {
      const mockCommentObj = createMockComment({
        content: input.content,
        user: mockUser._id,
        post: genObjectId(),
      });

      const mockCommentDoc = {
        ...mockCommentObj,
        set: vi.fn().mockImplementation((data) => {
          Object.assign(mockCommentDoc, data);
        }),
        isModified: vi.fn().mockReturnValue(true),
        save: vi.fn(),
        populate: vi.fn().mockReturnThis(),
        toObject: vi.fn().mockReturnValue(mockCommentObj),
      };

      vi.mocked(Comment.findById).mockResolvedValue(mockCommentDoc);

      const result = await commentService.edit(mockCommentDoc._id, mockUser, input);

      expect(mockCommentDoc.save).toHaveBeenCalledOnce();
      expect(mockCommentDoc.populate).toHaveBeenCalledWith('user', 'username');
      expect(result.content).toBe('new');
    });

    it('should update comment if user is post owner', async () => {
      const mockPost = createMockPost({
        author: mockUser._id,
      });
      const mockCommentObj = createMockComment({
        content: input.content,
        user: mockUser._id,
        post: mockPost._id,
      });

      const mockCommentDoc = {
        ...mockCommentObj,
        set: vi.fn().mockImplementation((data) => {
          Object.assign(mockCommentDoc, data);
        }),
        isModified: vi.fn().mockReturnValue(true),
        save: vi.fn(),
        populate: vi.fn().mockReturnThis(),
        toObject: vi.fn().mockReturnValue(mockCommentObj),
      };

      vi.mocked(Comment.findById).mockResolvedValue(mockCommentDoc);
      vi.mocked(Post.findById).mockReturnValue(createSelectMock(mockPost));

      const result = await commentService.edit(mockCommentDoc._id, mockUser, input);

      expect(mockCommentDoc.save).toHaveBeenCalledOnce();
      expect(mockCommentDoc.populate).toHaveBeenCalledWith('user', 'username');
      expect(result.content).toBe('new');
    });
  });

  describe('remove()', () => {
    const mockUser = createMockUser();

    it('should throw 404 if comment not found', async () => {
      vi.mocked(Comment.findById).mockResolvedValue(null);

      await expect(commentService.remove(null, mockUser)).rejects.toThrow(AppError);

      await expect(commentService.remove(null, mockUser)).rejects.toMatchObject({
        message: 'Comment not found',
        statusCode: 404,
        isOperational: true,
      });
    });

    it('should throw 403 if user is not post owner or comment owner', async () => {
      const mockPost = createMockPost({
        author: genObjectId(),
      });
      const mockComment = createMockComment({
        user: genObjectId(),
        post: mockPost._id,
      });

      vi.mocked(Comment.findById).mockResolvedValue(mockComment);
      vi.mocked(Post.findById).mockReturnValue(createSelectMock(mockPost));

      await expect(commentService.remove(mockComment._id, mockUser)).rejects.toThrow(AppError);

      await expect(commentService.remove(mockComment._id, mockUser)).rejects.toMatchObject({
        message: 'You are not authorized to remove this comment',
        statusCode: 403,
        isOperational: true,
      });
    });

    it('should delete comment if user is comment owner', async () => {
      const mockComment = createMockComment({
        user: mockUser._id,
      });
      vi.mocked(Comment.findById).mockResolvedValue(mockComment);

      await commentService.remove(mockComment._id, mockUser);

      expect(Comment.deleteOne).toHaveBeenCalledWith({ _id: mockComment._id });
    });

    it('should delete comment if user is post owner', async () => {
      const mockPost = createMockPost({
        author: mockUser._id,
      });
      const mockComment = createMockComment({
        user: genObjectId(),
        post: mockPost._id,
      });

      vi.mocked(Comment.findById).mockResolvedValue(mockComment);
      vi.mocked(Post.findById).mockReturnValue(createSelectMock(mockPost));

      await commentService.remove(mockComment._id, mockUser);

      expect(Comment.deleteOne).toHaveBeenCalledWith({ _id: mockComment._id });
    });
  });
});
