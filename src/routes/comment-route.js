import { Router } from 'express';
import { commentLimiter } from '../middlewares/rate-limiter.js';
import { authenticate, optionalAuthenticate } from '../middlewares/auth-middleware.js';
import { validateJoiSchema } from '../middlewares/validate-schema.js';
import { addCommentSchema, editCommentSchema } from '../schemas/comment-schema.js';
import { lazyQuerySchema } from '../schemas/query-schema.js';
import CommentController from '../controllers/CommentController.js';

const commentRouter = Router();

const commentController = new CommentController();

commentRouter.get(
  '/:postSlug',
  optionalAuthenticate,
  validateJoiSchema(lazyQuerySchema, 'query'),
  commentController.listLazy
);

commentRouter.post(
  '/:postSlug',
  commentLimiter,
  authenticate('add new comments'),
  validateJoiSchema(addCommentSchema, 'body'),
  commentController.create
);

commentRouter.patch(
  '/:id',
  authenticate('modify this comment'),
  validateJoiSchema(editCommentSchema, 'body'),
  commentController.update
);

commentRouter.delete('/:id', authenticate('delete this comment'), commentController.delete);

export default commentRouter;
