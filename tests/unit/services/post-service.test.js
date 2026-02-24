import { vi, describe, beforeEach, it, expect } from 'vitest';
import postService from '../../../src/modules/post/post-service.js';
import Post from '../../../src/db/models/Post.js';
import FavoritePost from '../../../src/db/models/FavoritePost.js';
import Comment from '../../../src/db/models/Comment.js';
import AppError from '../../../src/utils/error/AppError.js';
import { POST_STATUSES } from '../../../src/constants/post.js';
import { genObjectId, createMockUser, createMockPost } from '../../helpers/unit-helper.js';
import { createLexicalContent, createMockClient } from '../../helpers/integration-helper.js';
import { performPostSearch } from '../../../src/search/post-search.js';
import { syncToMeili, updateInMeili, removeFromMeili } from '../../../src/utils/meili/index.js';

vi.mock('../../../src/db/models/Post.js', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
    exists: vi.fn(),
    deleteOne: vi.fn(),
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

vi.mock('../../../src/search/post-search.js', () => ({
  performPostSearch: vi.fn(),
}));

vi.mock('../../../src/utils/meili/index.js', () => ({
  syncToMeili: vi.fn(),
  updateInMeili: vi.fn(),
  removeFromMeili: vi.fn(),
}));

// Mocking Mongoose chain: .select().populate().sort().skip().limit().lean()
const createSelectMock = (data) => ({
  select: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data),
});

// Mocking Mongoose chain: .populate().lean()
const createPopulateMock = (data) => ({
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data),
});

// Mocking Mongoose chain: .lean()
const createLeanMock = (data) => ({
  lean: vi.fn().mockResolvedValue(data),
});

describe('Post Service Unit Tests', () => {
  let mockId, mockUser, mockSearchClient;
  beforeEach(() => {
    vi.clearAllMocks();
    mockId = genObjectId();
    mockUser = createMockUser();
    const { mockClient } = createMockClient();
    mockSearchClient = mockClient;
  });

  describe('list()', () => {
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

    it('should return posts and meta data', async () => {
      const mockPosts = [createMockPost(), createMockPost()];

      vi.mocked(Post.countDocuments).mockResolvedValue(7);
      vi.mocked(Post.find).mockReturnValue(createSelectMock(mockPosts));

      const result = await postService.list(null, { page: 2, limit: 5 });

      expect(result.posts).toHaveLength(2);
      expect(result.meta).toEqual({
        postCount: 7,
        totalPages: 2,
        hasMore: false,
      });
      expect(FavoritePost.find).not.toHaveBeenCalled();
    });

    it('should flag posts as favorited if current user has liked them', async () => {
      const userId = mockId;
      const post1Id = genObjectId();
      const post2Id = genObjectId();

      const mockPosts = [createMockPost({ _id: post1Id }), createMockPost({ _id: post2Id })];

      vi.mocked(Post.countDocuments).mockResolvedValue(2);
      vi.mocked(Post.find).mockReturnValue(createSelectMock(mockPosts));
      vi.mocked(FavoritePost.find).mockReturnValue({
        distinct: vi.fn().mockResolvedValue([post1Id]),
      });

      const result = await postService.list(userId, {});

      expect(result.posts[0].isFavorited).toBe(true);
      expect(result.posts[1].isFavorited).toBe(false);
      expect(FavoritePost.find).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          post: { $in: [post1Id, post2Id] },
        })
      );
    });

    it('should restrict unauthorized users from seeing drafts', async () => {
      const strangerId = mockId;
      const authorId = mockUser._id;

      vi.mocked(Post.countDocuments).mockResolvedValue(0);

      // Act: Stranger trying to see author's drafts
      await postService.list(strangerId, { author: authorId, status: POST_STATUSES.DRAFT });

      // Assert: Check the filter passed to Mongoose
      const expectedFilters = {
        $and: [{ author: authorId }, { status: null }],
      };
      expect(Post.countDocuments).toHaveBeenCalledWith(expectedFilters);
    });

    it('should allow authors to see their own drafts', async () => {
      const authorId = mockId;
      vi.mocked(Post.countDocuments).mockResolvedValue(0);

      await postService.list(authorId, { author: authorId, status: POST_STATUSES.DRAFT });

      const expectedFilters = {
        $and: [{ author: authorId }, { status: 'draft' }],
      };
      expect(Post.countDocuments).toHaveBeenCalledWith(expectedFilters);
    });
  });

  describe('search()', () => {
    it('should return empty array and meta data when no matching posts found', async () => {
      vi.mocked(performPostSearch).mockResolvedValue({
        hits: [],
        estimatedTotalHits: 0,
        offset: 0,
        limit: 0,
      });

      const result = await postService.search(null, {}, mockSearchClient);
      expect(result.posts).toHaveLength(0);
      expect(result.meta).toEqual({
        postCount: 0,
        totalPages: 0,
        hasMore: false,
      });
      expect(performPostSearch).toHaveBeenCalledWith(mockSearchClient, {}, { limit: 5, skip: 0 });
      expect(Post.find).not.toHaveBeenCalled();
      expect(FavoritePost.find).not.toHaveBeenCalled();
    });

    it('should return matching posts and meta data', async () => {
      const userId = mockId;
      const post1Id = genObjectId().toString();
      const post2Id = genObjectId().toString();
      const mockSearchResponse = {
        hits: [{ id: post1Id }, { id: post2Id }],
        estimatedTotalHits: 2,
        offset: 0,
        limit: 5,
      };
      const mockPosts = [createMockPost({ _id: post1Id }), createMockPost({ _id: post2Id })];

      vi.mocked(performPostSearch).mockResolvedValue(mockSearchResponse);
      vi.mocked(Post.find).mockReturnValue(createPopulateMock(mockPosts));
      vi.mocked(FavoritePost.find).mockReturnValue({
        distinct: vi.fn().mockResolvedValue([post1Id]),
      });

      const result = await postService.search(userId, { term: 'hello' }, mockSearchClient);
      expect(result.posts[0].isFavorited).toBe(true);
      expect(result.posts[1].isFavorited).toBe(false);
      expect(result.meta.postCount).toBe(2);

      expect(performPostSearch).toHaveBeenCalledWith(
        mockSearchClient,
        { term: 'hello' },
        { limit: 5, skip: 0 }
      );
      expect(Post.find).toHaveBeenCalledWith(
        { _id: { $in: [post1Id, post2Id] } },
        {
          _id: 1,
          title: 1,
          status: 1,
          likeCount: 1,
          author: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      );
      expect(FavoritePost.find).toHaveBeenCalledWith({
        user: userId,
        post: { $in: [post1Id, post2Id] },
      });
    });
  });

  describe('add()', () => {
    const input = {
      title: 'title',
      content: createLexicalContent(),
      status: POST_STATUSES.PUBLISHED,
    };
    const mockPost = createMockPost({
      ...input,
      author: mockId,
    });

    it('should create new post with the provided data and sync data with Meili', async () => {
      vi.mocked(Post.create).mockResolvedValue(mockPost);

      const result = await postService.add(mockId, input, mockSearchClient);

      expect(Post.create).toHaveBeenCalledWith({
        ...input,
        author: mockId,
      });
      expect(syncToMeili).toHaveBeenCalledWith('posts', mockPost, mockSearchClient);
      expect(result._id).toEqual(mockPost._id);
    });
  });

  describe('get()', () => {
    it('should throw 404 if post not found', async () => {
      vi.mocked(Post.findById).mockReturnValue(createPopulateMock(null));

      await expect(postService.get(mockId, mockUser)).rejects.toThrow(AppError);

      await expect(postService.get(mockId, mockUser)).rejects.toMatchObject({
        message: 'Post not found',
        statusCode: 404,
        isOperational: true,
      });
    });

    it('should throw 404 if user tries to access drafts of other users', async () => {
      const mockDraft = createMockPost({
        status: POST_STATUSES.DRAFT,
        author: createMockUser(),
      });

      vi.mocked(Post.findById).mockReturnValue(createPopulateMock(mockDraft));

      await expect(postService.get(mockId, mockUser)).rejects.toThrow(AppError);
      await expect(postService.get(mockId, mockUser)).rejects.toMatchObject({
        message: 'Post not found',
        statusCode: 404,
        isOperational: true,
      });
    });

    it('should return isFavorited: false if guest accesses post', async () => {
      const mockPublished = createMockPost({
        status: POST_STATUSES.PUBLISHED,
        author: createMockUser(),
      });

      vi.mocked(Post.findById).mockReturnValue(createPopulateMock(mockPublished));
      vi.mocked(FavoritePost.exists).mockResolvedValue(null);

      const result = await postService.get(mockId, null);

      expect(result.isFavorited).toBe(false);
    });

    it('should return isFavorited: true if post exists in favorites', async () => {
      const mockPublished = createMockPost({
        status: POST_STATUSES.PUBLISHED,
        author: createMockUser(),
      });

      vi.mocked(Post.findById).mockReturnValue(createPopulateMock(mockPublished));
      vi.mocked(FavoritePost.exists).mockResolvedValue({ _id: genObjectId() });

      const result = await postService.get(mockId, mockUser);

      expect(result.isFavorited).toBe(true);
    });
  });

  describe('edit()', () => {
    const input = { title: 'new' };

    it('should throw 404 if could not find both original and updated post', async () => {
      vi.mocked(Post.findOneAndUpdate).mockReturnValue(createPopulateMock(null));
      vi.mocked(Post.exists).mockResolvedValue(null);

      await expect(postService.edit(mockId, mockUser, input, mockSearchClient)).rejects.toThrow(
        AppError
      );
      await expect(
        postService.edit(mockId, mockUser, input, mockSearchClient)
      ).rejects.toMatchObject({
        message: 'Post not found',
        statusCode: 404,
        isOperational: true,
      });
      expect(updateInMeili).not.toHaveBeenCalled();
    });

    it('should throw 403 if original post exists and updated post not found', async () => {
      vi.mocked(Post.findOneAndUpdate).mockReturnValue(createPopulateMock(null));
      vi.mocked(Post.exists).mockResolvedValue({ _id: mockId });

      await expect(postService.edit(mockId, mockUser, input, mockSearchClient)).rejects.toThrow(
        AppError
      );
      await expect(
        postService.edit(mockId, mockUser, input, mockSearchClient)
      ).rejects.toMatchObject({
        message: 'You are not authorized to edit this post',
        statusCode: 403,
        isOperational: true,
      });
      expect(updateInMeili).not.toHaveBeenCalled();
    });

    it('should return updated post and sync updated data with Meili if updated post found', async () => {
      const mockUpdatedPost = createMockPost({
        _id: mockId,
        title: 'new',
        author: mockUser,
        status: POST_STATUSES.PUBLISHED,
        textContent: 'Hello',
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });

      vi.mocked(Post.findOneAndUpdate).mockReturnValue(createPopulateMock(mockUpdatedPost));
      vi.mocked(FavoritePost.exists).mockResolvedValue({ _id: genObjectId() });

      const result = await postService.edit(mockId, mockUser, input, mockSearchClient);

      expect(updateInMeili).toHaveBeenCalledWith(
        'posts',
        mockUpdatedPost._id,
        {
          title: 'new',
          textContent: 'Hello',
          status: 'published',
          updatedAt: 1767225600000,
        },
        mockSearchClient
      );
      expect(result.title).toBe('new');
      expect(result.isFavorited).toBe(true);
    });
  });

  describe('remove()', () => {
    it('should throw 403 if original post found and deleteResult is 0', async () => {
      vi.mocked(Post.deleteOne).mockResolvedValue({
        acknowledged: true,
        deletedCount: 0,
      });
      vi.mocked(Post.exists).mockResolvedValue({ _id: mockId });

      await expect(postService.remove(mockId, mockUser, mockSearchClient)).rejects.toThrow(
        AppError
      );
      await expect(postService.remove(mockId, mockUser, mockSearchClient)).rejects.toMatchObject({
        message: 'You are not authorized to delete this post',
        statusCode: 403,
        isOperational: true,
      });
      expect(removeFromMeili).not.toHaveBeenCalled();
    });

    it('should delete post and associated data if deleteResult is not 0', async () => {
      vi.mocked(Post.deleteOne).mockResolvedValue({
        acknowledged: true,
        deletedCount: 1,
      });

      await postService.remove(mockId, mockUser, mockSearchClient);

      expect(Post.deleteOne).toHaveBeenCalledWith({ _id: mockId, author: mockUser._id });
      expect(removeFromMeili).toHaveBeenCalledWith('posts', mockId, mockSearchClient);
      expect(FavoritePost.deleteMany).toHaveBeenCalledWith({ post: mockId });
      expect(Comment.deleteMany).toHaveBeenCalledWith({ post: mockId });
    });
  });

  describe('listFavorites()', () => {
    it('should return paginated favorite posts using aggregation', async () => {
      // Mock the return structure of the $facet stage
      const mockAggregationResult = [
        {
          totalMetadata: [{ total: 11 }],
          postsData: [
            createMockPost({
              title: 'Testing Aggregate',
              author: createMockUser(),
              isFavorited: true,
            }),
          ],
        },
      ];

      vi.mocked(FavoritePost.aggregate).mockResolvedValue(mockAggregationResult);

      const result = await postService.listFavorites(mockId, {
        page: 1,
        limit: 10,
      });

      // Assertions
      expect(FavoritePost.aggregate).toHaveBeenCalledWith(expect.any(Array));
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].title).toBe('Testing Aggregate');
      expect(result.meta).toEqual({
        favoriteCount: 11,
        totalPages: 2, // ceil(11/10)
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

      const result = await postService.listFavorites(mockId, {});

      expect(result.posts).toEqual([]);
      expect(result.meta.favoriteCount).toBe(0);
      expect(result.meta.hasMore).toBe(false);
    });
  });

  describe('toggleFavorite()', () => {
    it('should throw 400 if user tries to favorite a draft', async () => {
      const mockPost = createMockPost({
        _id: mockId,
        status: POST_STATUSES.DRAFT,
        author: mockUser._id,
      });

      vi.mocked(Post.findById).mockReturnValue(createLeanMock(mockPost));

      await expect(postService.toggleFavorite(mockId, mockUser, mockSearchClient)).rejects.toThrow(
        AppError
      );
      await expect(
        postService.toggleFavorite(mockId, mockUser, mockSearchClient)
      ).rejects.toMatchObject({
        message: 'You cannot favorite draft posts',
        statusCode: 400,
        isOperational: true,
      });
    });

    it('should decrement likeCount when removing favorite', async () => {
      const mockPost = createMockPost({
        _id: mockId,
        status: POST_STATUSES.PUBLISHED,
        likeCount: 1,
      });

      const mockUpdatedPost = {
        ...mockPost,
        likeCount: 0,
      };

      vi.mocked(Post.findById).mockReturnValue(createLeanMock(mockPost));
      vi.mocked(FavoritePost.findOneAndDelete).mockResolvedValue({ _id: genObjectId() });
      vi.mocked(Post.findOneAndUpdate).mockReturnValue(createLeanMock(mockUpdatedPost));
      const result = await postService.toggleFavorite(mockId, mockUser, mockSearchClient);

      expect(FavoritePost.create).not.toHaveBeenCalled();
      expect(Post.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockPost._id },
        { $inc: { likeCount: -1 } },
        { new: true, timestamps: false, select: '_id likeCount' }
      );
      expect(updateInMeili).toHaveBeenCalledWith(
        'posts',
        mockUpdatedPost._id,
        { likeCount: 0 },
        mockSearchClient
      );
      expect(result.likeCount).toBe(0);
      expect(result.isFavorited).toBe(false);
    });

    it('should increment likeCount when adding favorite', async () => {
      const mockPost = createMockPost({
        _id: mockId,
        status: POST_STATUSES.PUBLISHED,
        likeCount: 0,
      });

      const mockUpdatedPost = {
        ...mockPost,
        likeCount: 1,
      };

      vi.mocked(Post.findById).mockReturnValue(createLeanMock(mockPost));
      vi.mocked(FavoritePost.findOneAndDelete).mockResolvedValue(null);
      vi.mocked(Post.findOneAndUpdate).mockReturnValue(createLeanMock(mockUpdatedPost));

      const result = await postService.toggleFavorite(mockId, mockUser, mockSearchClient);

      expect(FavoritePost.create).toHaveBeenCalledWith({ user: mockUser._id, post: mockPost._id });
      expect(Post.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockPost._id },
        { $inc: { likeCount: 1 } },
        { new: true, timestamps: false, select: '_id likeCount' }
      );
      expect(updateInMeili).toHaveBeenCalledWith(
        'posts',
        mockUpdatedPost._id,
        { likeCount: 1 },
        mockSearchClient
      );
      expect(result.likeCount).toBe(1);
      expect(result.isFavorited).toBe(true);
    });
  });
});
