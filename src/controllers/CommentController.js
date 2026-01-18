import commentService from '../services/comment-service.js';
import { StatusCodes } from 'http-status-codes';

class CommentController {
  constructor() {}

  listLazy = async (req, res, next) => {
    const currentUser = req?.user ?? null;
    const query = req.query;
    const { postSlug } = req.params;
    try {
      const { message, comments, meta } = await commentService.listLazy(
        postSlug,
        currentUser,
        query
      );
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
    const { postSlug } = req.params;
    const currentUser = req.user;
    const { content } = req.body;

    try {
      const payload = await commentService.add(postSlug, currentUser, {
        content,
      });
      return res.status(StatusCodes.CREATED).json({
        ok: true,
        message: 'Comment created successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    const { id } = req.params;
    const currentUser = req.user;
    const { content } = req.body;

    try {
      const payload = await commentService.edit(id, currentUser, { content });
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
    const { id } = req.params;
    const currentUser = req.user;

    try {
      await commentService.remove(id, currentUser);
      return res.sendStatus(StatusCodes.NO_CONTENT);
    } catch (error) {
      return next(error);
    }
  };
}

export default CommentController;
