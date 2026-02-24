import commentService from './comment-service.js';
import { StatusCodes } from 'http-status-codes';

class CommentController {
  constructor() {}

  listLazy = async (req, res, next) => {
    const currentUser = req?.user ?? null;
    const query = req.query;
    const { postId } = req.params;
    try {
      const { message, comments, meta } = await commentService.listLazy(postId, currentUser, query);
      return res.status(StatusCodes.OK).json({
        ok: true,
        message,
        payload: comments,
        meta,
      });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    const { postId } = req.params;
    const currentUser = req.user;
    const { content } = req.body;

    try {
      const payload = await commentService.add(postId, currentUser, {
        content,
      });
      return res.status(StatusCodes.CREATED).json({
        ok: true,
        message: 'Comment posted successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    const { commentId } = req.params;
    const currentUser = req.user;
    const { content } = req.body;

    try {
      const payload = await commentService.edit(commentId, currentUser, { content });
      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'Comment updated successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req, res, next) => {
    const { commentId } = req.params;
    const currentUser = req.user;

    try {
      await commentService.remove(commentId, currentUser);
      return res.sendStatus(StatusCodes.NO_CONTENT);
    } catch (error) {
      return next(error);
    }
  };
}

export default CommentController;
