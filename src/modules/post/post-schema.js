import Joi from 'joi';
import { Buffer } from 'buffer';
import { POST_STATUSES } from '../../constants/post.js';

const customJoi = Joi.extend((joi) => ({
  type: 'lexical',
  base: joi.array(),
  messages: {
    'lexical.empty': 'Post content cannot be empty',
  },
  rules: {
    isNotBlank: {
      validate(value, helpers) {
        const hasContent = (nodes) => {
          if (!Array.isArray(nodes)) return false;

          return nodes.some((node) => {
            if (!node || typeof node !== 'object') {
              return false;
            }
            if (typeof node.text === 'string' && node.text.trim().length > 0) {
              return true;
            }
            if (node.type === 'image' || node.type === 'horizontalrule') {
              return true;
            }
            if (Array.isArray(node.children)) {
              return hasContent(node.children);
            }
            return false;
          });
        };

        if (!hasContent(value)) {
          return helpers.error('lexical.empty');
        }
        return value;
      },
    },
  },
}));

const postSchema = {
  title: customJoi.string().trim().min(3).max(200),
  content: customJoi
    .object({
      root: customJoi
        .object({
          children: customJoi.lexical().isNotBlank().required(),
          type: customJoi.string().valid('root').required(),
          version: customJoi.number().required(),
        })
        .unknown(true)
        .required(),
    })
    .custom((value, helpers) => {
      // const textLength = JSON.stringify(value).length;
      const textLength = Buffer.byteLength(JSON.stringify(value), 'utf-8');
      if (textLength > 50000) {
        return helpers.message('Post content is too large (max 50KB)');
      }
      return value;
    }),
  status: customJoi.string().valid(...Object.values(POST_STATUSES)),
};

export const addPostSchema = customJoi
  .object(postSchema)
  .fork(Object.keys(postSchema), (schema) => schema.required());

export const editPostSchema = customJoi.object(postSchema).min(1);
