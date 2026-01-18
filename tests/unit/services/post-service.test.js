import { vi, describe, beforeEach, it, expect } from 'vitest';
import postService from '../../../src/services/post-service.js';
import Post from '../../../src/db/models/Post.js';
import FavoritePost from '../../../src/db/models/FavoritePost.js';
import Comment from '../../../src/db/models/Comment.js';
import AppError from '../../../src/utils/AppError.js';
import { POST_STATUSES } from '../../../src/constants/post.js';
import { genObjectId, createMockUser, createMockPost } from '../../utils/unit-helper.js';

vi.mock('../../../src/db/models/Post.js', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    deleteOne: vi.fn(),
    updateOne: vi.fn(),
  },
}));

vi.mock('../../../src/db/models/FavoritePost.js', () => ({
  default: {
    find: vi.fn(),
    exists: vi.fn(),
    deleteMany: vi.fn(),
    aggregate: vi.fn(),
    findOneAndDelete: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../../src/db/models/Comment.js', () => ({
  default: {
    deleteMany: vi.fn(),
  },
}));

describe('Post Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list()', () => {
    // Mocking Mongoose chain: .populate().sort().skip().limit().lean()
    const createPopulateMock = (data) => ({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(data),
    });

    it('should return empty array and meta data when no posts found', async () => {
      vi.mocked(Post.countDocuments).mockResolvedValue(0);

      const result = await postService.list(null, {});

      expect(result.posts).toEqual([]);
      expect(result.meta).toEqual({
        postCount: 0,
        totalPages: 0,
        hasMore: false,
      });
      expect(Post.find).not.toHaveBeenCalled();
    });

    it('should return posts and meta data when posts exist', async () => {
      const mockPosts = [
        createMockPost({ status: POST_STATUSES.PUBLISHED }),
        createMockPost({ status: POST_STATUSES.PUBLISHED }),
      ];

      vi.mocked(Post.countDocuments).mockResolvedValue(7);
      vi.mocked(Post.find).mockReturnValue(createPopulateMock(mockPosts));

      const result = await postService.list(null, { page: 2, limit: 5 });

      expect(result.posts).toHaveLength(2);
      expect(result.meta).toEqual({
        postCount: 7,
        totalPages: 2,
        hasMore: false,
      });
    });
  });

  describe('add()', () => {
    it('should create a new post with the provided data', async () => {
      const input = {
        title: 'title',
        content: 'content',
        status: POST_STATUSES.PUBLISHED,
      };
      const postId = genObjectId();
      const userId = genObjectId();

      vi.mocked(Post.create).mockResolvedValue({
        ...input,
        _id: postId,
        author: userId,
      });

      const result = await postService.add(userId, input);

      expect(Post.create).toHaveBeenCalledWith({
        ...input,
        author: userId,
      });
      expect(result).toEqual({
        _id: postId,
        title: 'title',
        content: 'content',
        status: POST_STATUSES.PUBLISHED,
        author: userId,
      });
    });
  });

  describe('getDetails()', () => {
    // Mocking Mongoose chain: .populate().lean()
    const createPopulateMock = (data) => ({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(data),
    });

    it('should throw 404 if post does not exist', async () => {
      const mockUser = createMockUser();

      vi.mocked(Post.findOne).mockReturnValue(createPopulateMock(null));

      await expect(postService.getDetails('slug', mockUser)).rejects.toThrow(AppError);

      await expect(postService.getDetails('slug', mockUser)).rejects.toMatchObject({
        message: 'Post not found',
        statusCode: 404,
        isOperational: true,
      });
    });

    it('should throw 404 if post is draft and user is not author', async () => {
      const mockUser = createMockUser();
      const draftPost = createMockPost({
        status: POST_STATUSES.DRAFT,
        author: createMockUser(),
      });

      vi.mocked(Post.findOne).mockReturnValue(createPopulateMock(draftPost));

      await expect(postService.getDetails('slug', mockUser)).rejects.toThrow(AppError);

      await expect(postService.getDetails('slug', mockUser)).rejects.toMatchObject({
        message: 'Post not found',
        statusCode: 404,
        isOperational: true,
      });
    });

    it('should return isFavorited: true if favorite exists', async () => {
      const mockUser = createMockUser();
      const publicPost = createMockPost({
        status: POST_STATUSES.PUBLISHED,
        author: createMockUser(),
      });

      vi.mocked(Post.findOne).mockReturnValue(createPopulateMock(publicPost));
      vi.mocked(FavoritePost.exists).mockResolvedValue({ _id: genObjectId() });

      const result = await postService.getDetails('slug', mockUser);

      expect(result.isFavorited).toBe(true);
    });
  });

  describe('edit()', () => {
    it('should throw 403 if user is not the author', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        save: vi.fn(),
      });

      vi.mocked(Post.findOne).mockResolvedValue(mockPost);

      await expect(postService.edit('slug', mockUser, { title: 'new' })).rejects.toThrow(AppError);

      await expect(postService.edit('slug', mockUser, { title: 'new' })).rejects.toMatchObject({
        message: 'You are not authorized to edit this post',
        statusCode: 403,
        isOperational: true,
      });
    });

    it('should call save() only if post is modified', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        author: mockUser._id,
        set: vi.fn().mockImplementation((updateObj) => {
          Object.assign(mockPost, updateObj);
        }),
        isModified: vi.fn().mockReturnValue(true),
        save: vi.fn(),
      });

      vi.mocked(Post.findOne).mockResolvedValue(mockPost);

      const result = await postService.edit('slug', mockUser, { title: 'new' });

      expect(mockPost.save).toHaveBeenCalled();
      expect(result.title).toBe('new');
    });
  });

  describe('remove()', () => {
    it('should throw 403 if user is not the author', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost();

      vi.mocked(Post.findOne).mockResolvedValue(mockPost);

      await expect(postService.remove('slug', mockUser)).rejects.toThrow(AppError);

      await expect(postService.remove('slug', mockUser)).rejects.toMatchObject({
        message: 'You are not authorized to delete this post',
        statusCode: 403,
        isOperational: true,
      });
    });

    it('should delete post and associated data', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        author: mockUser._id,
      });

      vi.mocked(Post.findOne).mockResolvedValue(mockPost);

      await postService.remove('slug', mockUser);

      expect(Post.deleteOne).toHaveBeenCalledWith({ _id: mockPost._id });
      expect(FavoritePost.deleteMany).toHaveBeenCalledWith({
        post: mockPost._id,
      });
      expect(Comment.deleteMany).toHaveBeenCalledWith({ post: mockPost._id });
    });
  });

  describe('listFavorites()', () => {
    const userId = genObjectId();

    it('should return paginated favorite posts using aggregation', async () => {
      // Mock the return structure of the $facet stage
      const mockAggregationResult = [
        {
          totalMetadata: [{ total: 12 }], // Total published favorites
          postsData: [
            createMockPost({
              title: 'Testing Aggregate',
              slug: 'testing-aggregate',
              author: createMockUser({ username: 'test' }),
              isFavorited: true,
            }),
          ],
        },
      ];

      vi.mocked(FavoritePost.aggregate).mockResolvedValue(mockAggregationResult);

      const result = await postService.listFavorites(userId, {
        page: 1,
        limit: 10,
      });

      // Assertions
      expect(FavoritePost.aggregate).toHaveBeenCalledWith(expect.any(Array));
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].title).toBe('Testing Aggregate');
      expect(result.meta).toEqual({
        favoriteCount: 12,
        totalPages: 2, // ceil(12/10)
        hasMore: true,
      });
    });

    it('should return empty data when aggregate returns no results', async () => {
      // If no matches, $facet still returns an object, but arrays are empty
      const emptyResult = [
        {
          totalMetadata: [],
          postsData: [],
        },
      ];

      vi.mocked(FavoritePost.aggregate).mockResolvedValue(emptyResult);

      const result = await postService.listFavorites(userId, {});

      expect(result.posts).toEqual([]);
      expect(result.meta.favoriteCount).toBe(0);
      expect(result.meta.hasMore).toBe(false);
    });
  });

  describe('toggleFavorite()', () => {
    // Mocking Mongoose chain: .select()
    const createSelectMock = (data) => ({
      select: vi.fn().mockResolvedValue(data),
    });

    it('should throw 400 if trying to favorite a draft', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        status: POST_STATUSES.DRAFT,
        author: mockUser._id,
      });

      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(mockPost));

      await expect(postService.toggleFavorite('slug', mockUser)).rejects.toThrow(AppError);

      await expect(postService.toggleFavorite('slug', mockUser)).rejects.toMatchObject({
        message: 'You cannot favorite draft posts',
        statusCode: 400,
        isOperational: true,
      });
    });

    it('should decrement likeCount when removing favorite', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        status: POST_STATUSES.PUBLISHED,
      });

      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(mockPost));
      vi.mocked(FavoritePost.findOneAndDelete).mockResolvedValue({
        _id: genObjectId(),
      });

      const result = await postService.toggleFavorite('slug', mockUser);

      expect(Post.updateOne).toHaveBeenCalledWith(
        { _id: mockPost._id },
        { $inc: { likeCount: -1 } },
        { timestamps: false }
      );
      expect(result.favorited).toBe(false);
    });

    it('should increment likeCount when adding favorite', async () => {
      const mockUser = createMockUser();
      const mockPost = createMockPost({
        status: POST_STATUSES.PUBLISHED,
      });

      vi.mocked(Post.findOne).mockReturnValue(createSelectMock(mockPost));
      vi.mocked(FavoritePost.findOneAndDelete).mockResolvedValue(null);

      const result = await postService.toggleFavorite('slug', mockUser);

      expect(FavoritePost.create).toHaveBeenCalled();
      expect(Post.updateOne).toHaveBeenCalledWith(
        { _id: mockPost._id },
        { $inc: { likeCount: 1 } },
        { timestamps: false }
      );
      expect(result.favorited).toBe(true);
    });
  });
});
