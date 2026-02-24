import Joi from 'joi';
import { POST_STATUSES, POST_SORT_OPTIONS } from '../../constants/post.js';

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(5).max(20).default(5),
});

export const postListQuerySchema = paginationSchema.keys({
  status: Joi.string().valid(...Object.values(POST_STATUSES)),
  author: Joi.string().hex().length(24),
  sortedBy: Joi.string().valid(...Object.values(POST_SORT_OPTIONS)),
});

export const postSearchQuerySchema = paginationSchema.keys({
  term: Joi.string().trim().min(1).required(),
  sortedBy: Joi.string().valid(...Object.values(POST_SORT_OPTIONS)),
});

export const lazySchema = Joi.object({
  cursor: Joi.string().hex().length(24).allow(null),
  limit: Joi.number().integer().min(1).max(15).default(3).strict(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
