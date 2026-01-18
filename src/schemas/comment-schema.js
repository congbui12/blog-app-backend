import Joi from 'joi';

const commentSchema = {
  content: Joi.string().trim().min(3).max(500),
};

export const addCommentSchema = Joi.object(commentSchema).fork(
  Object.keys(commentSchema),
  (schema) => schema.required()
);

export const editCommentSchema = Joi.object(commentSchema).min(1);
