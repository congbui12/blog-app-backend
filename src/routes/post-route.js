import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth-middleware.js';
import { validateJoiSchema } from '../middlewares/validate-schema.js';
import { sanitizeHTML } from '../middlewares/sanitize-html.js';
import { addPostSchema, editPostSchema } from '../schemas/post-schema.js';
import { paginationSchema, postListQuerySchema } from '../schemas/query-schema.js';
import PostController from '../controllers/PostController.js';

const postRouter = Router();

const postController = new PostController();

postRouter.get(
  '/',
  optionalAuthenticate,
  validateJoiSchema(postListQuerySchema, 'query'),
  postController.list
);

postRouter.post(
  '/',
  authenticate('create new posts'),
  sanitizeHTML('content'),
  validateJoiSchema(addPostSchema, 'body'),
  postController.create
);

postRouter.get(
  '/favorites',
  authenticate('view your favorite posts'),
  validateJoiSchema(paginationSchema, 'query'),
  postController.listFavorites
);

postRouter.get('/:slug', optionalAuthenticate, postController.getDetails);

postRouter.patch(
  '/:slug',
  authenticate('modify this post'),
  sanitizeHTML('content'),
  validateJoiSchema(editPostSchema, 'body'),
  postController.update
);

postRouter.delete('/:slug', authenticate('delete this post'), postController.delete);

postRouter.post(
  '/:slug/toggle-favorite',
  authenticate('manage your favorites'),
  postController.toggleFavorite
);

export default postRouter;
