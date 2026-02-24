import Post from '../../db/models/Post.js';
import AppError from '../../utils/error/AppError.js';
import { StatusCodes } from 'http-status-codes';
import { POST_STATUSES } from '../../constants/post.js';
import { buildLazyQuery } from '../../utils/db/query-builder.js';
import Comment from '../../db/models/Comment.js';

class CommentService {
  constructor() {}

  async #getPostById(postId, user) {
    const post = await Post.findById(postId).select('_id status author');

    if (!post) {
      throw new AppError('Post not found', StatusCodes.NOT_FOUND);
    }

    if (post.status === POST_STATUSES.DRAFT && (!user || !post.author.equals(user._id))) {
      throw new AppError('Post not found', StatusCodes.NOT_FOUND);
    }

    return post;
  }

  #assertExists(comment) {
    if (!comment) {
      throw new AppError('Comment not found', StatusCodes.NOT_FOUND);
    }
  }

  #isCommentOwner(comment, user) {
    if (!user) return false;
    return comment.user.equals(user._id);
  }

  async #isPostAuthor(comment, user) {
    const post = await Post.findById(comment.post).select('_id author');
    return post && post.author.equals(user?._id);
  }

  async listLazy(postId, user, params) {
    const post = await this.#getPostById(postId, user);
    const { limit, filter, sort } = buildLazyQuery(params);

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

  async add(postId, user, input) {
    const { content } = input;
    const post = await this.#getPostById(postId, user);
    const newComment = await Comment.create({
      content,
      post: post._id,
      user: user._id,
    });
    await newComment.populate('user', 'username');
    return newComment.toObject();
  }

  async edit(commentId, user, updates) {
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    const updatedComment = await Comment.findOneAndUpdate(
      {
        _id: commentId,
        user: user._id,
      },
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    )
      .populate('user', 'username')
      .lean();

    if (!updatedComment) {
      const exists = await Comment.exists({ _id: commentId });
      if (!exists) {
        throw new AppError('Comment not found', StatusCodes.NOT_FOUND);
      }
      throw new AppError('You are not authorized to edit this comment', StatusCodes.FORBIDDEN);
    }
    return updatedComment;
  }

  async remove(commentId, user) {
    const comment = await Comment.findById(commentId).select('_id user post');
    this.#assertExists(comment);

    if (!this.#isCommentOwner(comment, user) && !(await this.#isPostAuthor(comment, user))) {
      throw new AppError('You are not authorized to delete this comment', StatusCodes.FORBIDDEN);
    }

    await Comment.deleteOne({ _id: comment._id });
  }
}

export default new CommentService();
