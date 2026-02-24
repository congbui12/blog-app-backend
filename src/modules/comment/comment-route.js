import { Router } from 'express';
import CommentController from './CommentController.js';
import { optionalAuthenticate, authenticate } from '../../middlewares/auth-middleware.js';
import { validateSchema } from '../../middlewares/validate-schema.js';
import { lazySchema } from '../../schemas/query/query-schema.js';
import { commentLimiter } from '../../middlewares/rate-limiter.js';
import { addCommentSchema, editCommentSchema } from './comment-schema.js';

const commentRouter = Router();

const commentController = new CommentController();

commentRouter.get(
  '/:postId',
  optionalAuthenticate,
  validateSchema(lazySchema, 'query'),
  commentController.listLazy
);

commentRouter.post(
  '/:postId',
  commentLimiter,
  authenticate('post new comment'),
  validateSchema(addCommentSchema, 'body'),
  commentController.create
);

commentRouter.patch(
  '/:commentId',
  authenticate('edit this comment'),
  validateSchema(editCommentSchema, 'body'),
  commentController.update
);

commentRouter.delete('/:commentId', authenticate('delete this comment'), commentController.delete);

export default commentRouter;
