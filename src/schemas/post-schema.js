import Joi from 'joi';
import { POST_STATUSES } from '../constants/post.js';

const postSchema = {
  title: Joi.string().trim().min(3).max(150),
  content: Joi.string().trim().min(10).max(5000),
  status: Joi.string()
    .valid(...Object.values(POST_STATUSES))
    .default(POST_STATUSES.DRAFT),
};

export const addPostSchema = Joi.object(postSchema).fork(Object.keys(postSchema), (schema) =>
  schema.required()
);

export const editPostSchema = Joi.object(postSchema).min(1);
