import { Router } from 'express';
import PostController from './PostController.js';
import { optionalAuthenticate, authenticate } from '../../middlewares/auth-middleware.js';
import { validateSchema } from '../../middlewares/validate-schema.js';
import {
  postListQuerySchema,
  postSearchQuerySchema,
  paginationSchema,
} from '../../schemas/query/query-schema.js';
import { addPostSchema, editPostSchema } from './post-schema.js';

const postRouter = Router();

const postController = new PostController();

postRouter.get(
  '/',
  optionalAuthenticate,
  validateSchema(postListQuerySchema, 'query'),
  postController.list
);

postRouter.get(
  '/search',
  optionalAuthenticate,
  validateSchema(postSearchQuerySchema, 'query'),
  postController.search
);

postRouter.post(
  '/',
  authenticate('create new post'),
  validateSchema(addPostSchema, 'body'),
  postController.create
);

postRouter.get(
  '/favorites',
  authenticate('view your favorite posts'),
  validateSchema(paginationSchema, 'query'),
  postController.listFavorites
);

postRouter.get('/:postId', optionalAuthenticate, postController.get);

postRouter.patch(
  '/:postId',
  authenticate('edit this post'),
  validateSchema(editPostSchema, 'body'),
  postController.update
);

postRouter.delete('/:postId', authenticate('delete this post'), postController.delete);

postRouter.post(
  '/:postId/toggle-favorite',
  authenticate('manage your favorite posts'),
  postController.toggleFavorite
);

export default postRouter;
