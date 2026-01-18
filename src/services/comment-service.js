import Post from '../db/models/Post.js';
import Comment from '../db/models/Comment.js';
import AppError from '../utils/AppError.js';
import { StatusCodes } from 'http-status-codes';
import { buildLazyQuery } from '../utils/query-builder.js';
import { POST_STATUSES } from '../constants/post.js';

class CommentService {
  constructor() {}

  #assertExists(comment) {
    if (!comment) {
      throw new AppError('Comment not found', StatusCodes.NOT_FOUND);
    }
  }

  async #isPostOwner(comment, user) {
    const post = await Post.findById(comment.post).select('author');
    return post && post.author.equals(user?._id);
  }

  async #canModify(comment, user) {
    if (!user) return false;

    if (comment.user.equals(user._id)) return true;

    const isOwner = this.#isPostOwner(comment, user);
    return isOwner;
  }

  async #getPostBySlug(slug, user) {
    const post = await Post.findOne({ slug }).select('_id status author');

    if (!post) {
      throw new AppError('Post not found', StatusCodes.NOT_FOUND);
    }

    if (post.status === POST_STATUSES.DRAFT && (!user || !post.author.equals(user._id))) {
      throw new AppError('Post not found', StatusCodes.NOT_FOUND);
    }

    return post;
  }

  async listLazy(postSlug, user, params) {
    const { limit, filter, sort } = buildLazyQuery(params);

    const post = await this.#getPostBySlug(postSlug, user);
    const filters = {
      ...filter,
      post: post._id,
    };

    const comments = await Comment.find(filters)
      .sort(sort)
      .limit(limit + 1)
      .populate({
        path: 'user',
        select: 'username',
      })
      .lean();

    const hasMore = comments.length > limit;
    if (hasMore) {
      comments.pop();
    }

    const message = comments.length > 0 ? 'Comments fetched successfully' : 'No comments available';
    const nextCursor = comments.length > 0 ? comments[comments.length - 1]._id : null;

    const meta = { nextCursor, hasMore };
    return { message, comments, meta };
  }

  async add(postSlug, user, input) {
    const { content } = input;
    const post = await this.#getPostBySlug(postSlug, user);
    const newComment = await Comment.create({
      content,
      post: post._id,
      user: user._id,
    });
    await newComment.populate('user', 'username');
    return newComment.toObject();
  }

  async edit(commentId, user, { content }) {
    const comment = await Comment.findById(commentId);
    this.#assertExists(comment);

    if (!(await this.#canModify(comment, user))) {
      throw new AppError('You are not authorized to edit this comment', StatusCodes.FORBIDDEN);
    }
    comment.set({ content });
    if (comment.isModified('content')) {
      await comment.save();
    }
    await comment.populate('user', 'username');
    return comment.toObject();
  }

  async remove(commentId, user) {
    const comment = await Comment.findById(commentId);
    this.#assertExists(comment);

    if (!(await this.#canModify(comment, user))) {
      throw new AppError('You are not authorized to remove this comment', StatusCodes.FORBIDDEN);
    }

    await Comment.deleteOne({ _id: comment._id });
  }
}

export default new CommentService();
