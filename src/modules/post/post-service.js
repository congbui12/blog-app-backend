import {
  buildPaginationQuery,
  buildFilterPostQuery,
  buildSortQuery,
} from '../../utils/db/query-builder.js';
import Post from '../../db/models/Post.js';
import {
  POST_ITEM_SELECT,
  POST_DATA_SELECT,
  POST_AUTHOR_POPULATE,
} from '../../utils/db/post-projection.js';
import FavoritePost from '../../db/models/FavoritePost.js';
import { performPostSearch } from '../../search/post-search.js';
import { syncToMeili, updateInMeili, removeFromMeili } from '../../utils/meili/index.js';
import AppError from '../../utils/error/AppError.js';
import { StatusCodes } from 'http-status-codes';
import { POST_STATUSES } from '../../constants/post.js';
import Comment from '../../db/models/Comment.js';

class PostService {
  constructor() {}

  #assertExists(post) {
    if (!post) {
      throw new AppError('Post not found', StatusCodes.NOT_FOUND);
    }
  }

  #assertVisible(post, user) {
    const isDraft = post.status === POST_STATUSES.DRAFT;

    const authorId = post.author?._id?.toString() || post.author?.toString();
    const userId = user?._id?.toString();

    if (isDraft && authorId !== userId) {
      throw new AppError('Post not found', StatusCodes.NOT_FOUND);
    }
  }

  async list(userId, params) {
    const { page, limit, skip } = buildPaginationQuery(params);
    const filters = buildFilterPostQuery(userId, params);
    const sort = buildSortQuery(params.sortedBy);

    const postCount = await Post.countDocuments(filters);

    if (postCount === 0) {
      return {
        posts: [],
        meta: { postCount: 0, totalPages: 0, hasMore: false },
      };
    }

    const posts = await Post.find(filters)
      .select(POST_ITEM_SELECT)
      .populate(POST_AUTHOR_POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    posts.forEach((p) => (p.isFavorited = false));

    // Favorited check
    if (userId && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const favoriteIds = await FavoritePost.find({
        user: userId,
        post: { $in: postIds },
      }).distinct('post');

      const favoriteSet = new Set(favoriteIds.map(String));

      posts.forEach((p) => {
        p.isFavorited = favoriteSet.has(p._id.toString());
      });
    }

    const totalPages = Math.ceil(postCount / limit);
    const hasMore = Number(page) < totalPages;
    const meta = { postCount, totalPages, hasMore };

    return { posts, meta };
  }

  async search(userId, params, searchClient) {
    const { page, limit, skip } = buildPaginationQuery(params);
    const searchResponse = await performPostSearch(searchClient, params, { limit, skip });
    if (searchResponse.estimatedTotalHits === 0) {
      return {
        posts: [],
        meta: { postCount: 0, totalPages: 0, hasMore: false },
      };
    }
    const postIds = searchResponse.hits.map((h) => h.id);

    // Hydrate from Mongo to get full user data and content
    const posts = await Post.find({ _id: { $in: postIds } }, POST_ITEM_SELECT)
      .populate(POST_AUTHOR_POPULATE)
      .lean();

    const postMap = new Map(posts.map((post) => [post._id.toString(), post]));

    // Re-sort to maintain Meilisearch relevance
    const orderedPosts = postIds.map((id) => postMap.get(id)).filter(Boolean);

    orderedPosts.forEach((op) => (op.isFavorited = false));

    if (userId) {
      const favoriteIds = await FavoritePost.find({
        user: userId,
        post: { $in: postIds },
      }).distinct('post');

      const favoriteSet = new Set(favoriteIds.map(String));

      orderedPosts.forEach((post) => {
        post.isFavorited = favoriteSet.has(post._id.toString());
      });
    }

    const postCount = searchResponse.estimatedTotalHits ?? 0;
    const totalPages = Math.ceil(postCount / limit);

    return {
      posts: orderedPosts,
      meta: {
        postCount,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async add(userId, input, searchClient) {
    const { title, content, status } = input;
    const newPost = await Post.create({
      title,
      content,
      status,
      author: userId,
    });
    await syncToMeili('posts', newPost, searchClient);
    return { _id: newPost._id };
  }

  async get(postId, user) {
    const post = await Post.findById(postId, POST_DATA_SELECT)
      .populate(POST_AUTHOR_POPULATE)
      .lean();
    this.#assertExists(post);
    this.#assertVisible(post, user);
    post.isFavorited = false;

    if (user?._id) {
      const favorite = await FavoritePost.exists({
        user: user._id,
        post: post._id,
      });
      post.isFavorited = Boolean(favorite);
    }
    return post;
  }

  async edit(postId, user, updates, searchClient) {
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: postId,
        author: user._id,
      },
      { $set: filteredUpdates },
      {
        new: true,
        runValidators: true,
        select: POST_DATA_SELECT,
      }
    )
      .populate(POST_AUTHOR_POPULATE)
      .lean();

    if (!updatedPost) {
      const exists = await Post.exists({ _id: postId });
      if (!exists) {
        throw new AppError('Post not found', StatusCodes.NOT_FOUND);
      }

      // If post exists but wasn't found by findOneAndUpdate, it's a permission issue
      throw new AppError(`You are not authorized to edit this post`, StatusCodes.FORBIDDEN);
    }

    await updateInMeili(
      'posts',
      updatedPost._id,
      {
        title: updatedPost.title,
        textContent: updatedPost.textContent,
        status: updatedPost.status,
        updatedAt: updatedPost.updatedAt.getTime(),
      },
      searchClient
    );

    const favorite = await FavoritePost.exists({
      user: user._id,
      post: updatedPost._id,
    });
    updatedPost.isFavorited = Boolean(favorite);

    return updatedPost;
  }

  async remove(postId, user, searchClient) {
    const deleteResult = await Post.deleteOne({
      _id: postId,
      author: user._id,
    });

    if (deleteResult.deletedCount === 0) {
      const exists = await Post.exists({ _id: postId });

      if (!exists) {
        throw new AppError('Post not found', StatusCodes.NOT_FOUND);
      }

      // If post exists but wasn't deleted, it's an ownership issue
      throw new AppError('You are not authorized to delete this post', StatusCodes.FORBIDDEN);
    }

    await removeFromMeili('posts', postId, searchClient);

    await Promise.all([
      FavoritePost.deleteMany({ post: postId }),
      Comment.deleteMany({ post: postId }),
    ]);
  }

  async listFavorites(userId, params) {
    const { page, limit, skip } = buildPaginationQuery(params);

    const [result] = await FavoritePost.aggregate([
      { $match: { user: userId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postData',
        },
      },
      { $unwind: '$postData' },
      { $match: { 'postData.status': POST_STATUSES.PUBLISHED } },
      {
        $lookup: {
          from: 'users',
          localField: 'postData.author',
          foreignField: '_id',
          as: 'authorData',
        },
      },
      { $unwind: '$authorData' },
      {
        $facet: {
          totalMetadata: [{ $count: 'total' }],
          postsData: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: '$postData._id',
                title: '$postData.title',
                status: '$postData.status',
                likeCount: '$postData.likeCount',
                author: {
                  _id: '$authorData._id',
                  username: '$authorData.username',
                },
                createdAt: '$postData.createdAt',
                updatedAt: '$postData.updatedAt',
                isFavorited: { $literal: true },
                // favoritedAt: '$createdAt',
              },
            },
          ],
        },
      },
    ]);

    const favoriteCount = result.totalMetadata[0]?.total || 0;
    const posts = result.postsData;

    const totalPages = Math.ceil(favoriteCount / limit);
    const hasMore = page < totalPages;

    return { posts, meta: { favoriteCount, totalPages, hasMore } };
  }

  async toggleFavorite(postId, user, searchClient) {
    const post = await Post.findById(postId, '_id status author').lean();
    this.#assertExists(post);
    this.#assertVisible(post, user);
    if (post.status === POST_STATUSES.DRAFT) {
      throw new AppError('You cannot favorite draft posts', StatusCodes.BAD_REQUEST);
    }

    const deletedFavorite = await FavoritePost.findOneAndDelete({
      user: user._id,
      post: post._id,
    });

    const inc = deletedFavorite ? -1 : 1;
    if (!deletedFavorite) {
      await FavoritePost.create({ user: user._id, post: post._id });
    }

    const updatedPost = await Post.findOneAndUpdate(
      { _id: post._id },
      { $inc: { likeCount: inc } },
      {
        new: true,
        timestamps: false,
        select: '_id likeCount',
      }
    ).lean();
    await updateInMeili(
      'posts',
      updatedPost._id,
      { likeCount: updatedPost.likeCount },
      searchClient
    );

    return { likeCount: updatedPost.likeCount, isFavorited: !deletedFavorite };
  }
}

export default new PostService();
