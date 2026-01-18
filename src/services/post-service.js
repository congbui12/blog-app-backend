import Post from '../db/models/Post.js';
import FavoritePost from '../db/models/FavoritePost.js';
import Comment from '../db/models/Comment.js';
import AppError from '../utils/AppError.js';
import {
  buildPaginationQuery,
  buildFilterPostQuery,
  buildSortQuery,
} from '../utils/query-builder.js';
import { StatusCodes } from 'http-status-codes';
import { POST_STATUSES } from '../constants/post.js';

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

  #assertCanModify(post, user, actionName) {
    if (!user || !post.author.equals(user._id)) {
      throw new AppError(
        `You are not authorized to ${actionName} this post`,
        StatusCodes.FORBIDDEN
      );
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
      .populate('author', 'username')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Favorited check
    if (userId && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const userFavorites = await FavoritePost.find({
        user: userId,
        post: { $in: postIds },
      })
        .select('post')
        .lean();

      const favoriteSet = new Set(userFavorites.map((f) => f.post.toString()));

      posts.forEach((p) => {
        p.isFavorited = favoriteSet.has(p._id.toString());
      });
    }

    const totalPages = Math.ceil(postCount / limit);
    const hasMore = Number(page) < totalPages;
    const meta = { postCount, totalPages, hasMore };

    return { posts, meta };
  }

  async add(userId, input) {
    const { title, content, status } = input;
    const newPost = await Post.create({
      title,
      content,
      status,
      author: userId,
    });
    return newPost;
  }

  async getDetails(slug, user) {
    const post = await Post.findOne({ slug }).populate('author', 'username').lean();
    this.#assertExists(post);
    this.#assertVisible(post, user);

    let isFavorited = false;
    if (user?._id) {
      const favorite = await FavoritePost.exists({
        user: user._id,
        post: post._id,
      });
      isFavorited = Boolean(favorite);
    }

    return { post, isFavorited };
  }

  async edit(slug, user, updates) {
    const post = await Post.findOne({ slug });
    this.#assertExists(post);
    this.#assertCanModify(post, user, 'edit');

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    post.set(filteredUpdates);
    if (post.isModified()) {
      await post.save();
    }
    return post;
  }

  async remove(slug, user) {
    const post = await Post.findOne({ slug });
    this.#assertExists(post);
    this.#assertCanModify(post, user, 'delete');

    await Promise.all([
      Post.deleteOne({ _id: post._id }),
      FavoritePost.deleteMany({ post: post._id }),
      Comment.deleteMany({ post: post._id }),
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
                title: '$postData.title', // Added Title
                slug: '$postData.slug',
                likeCount: '$postData.likeCount',
                // Formatting Author specifically
                author: {
                  _id: '$authorData._id',
                  username: '$authorData.username', // Added Author Name
                },
                isFavorited: { $literal: true },
                favoritedAt: '$createdAt', // Useful to show when they liked it
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

  async toggleFavorite(slug, user) {
    const post = await Post.findOne({ slug }).select('_id status author');
    this.#assertExists(post);
    this.#assertVisible(post, user);
    if (post.status === POST_STATUSES.DRAFT) {
      throw new AppError('You cannot favorite draft posts', StatusCodes.BAD_REQUEST);
    }

    const deletedFavorite = await FavoritePost.findOneAndDelete({
      user: user._id,
      post: post._id,
    });

    if (deletedFavorite) {
      await Post.updateOne({ _id: post._id }, { $inc: { likeCount: -1 } }, { timestamps: false });
      return { favorited: false };
    } else {
      await FavoritePost.create({ user: user._id, post: post._id });
      await Post.updateOne({ _id: post._id }, { $inc: { likeCount: 1 } }, { timestamps: false });
      return { favorited: true };
    }
  }
}

export default new PostService();
