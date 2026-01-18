import Joi from 'joi';
import { registerSchema } from './auth-schema.js';

export const updatePersonalDataSchema = registerSchema
  .fork(['username'], (schema) => schema.optional())
  .fork(['email', 'password'], (schema) => schema.forbidden());

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().trim().required(),
  newPassword: Joi.string()
    .trim()
    .min(6)
    .pattern(/[a-z]/, 'a lowercase letter')
    .pattern(/[A-Z]/, 'an uppercase letter')
    .pattern(/[0-9]/, 'a number')
    .pattern(/[^a-zA-Z0-9]/, 'a special character')
    .required()
    .messages({
      'string.pattern.name': 'New password must contain at least {#name}',
    }),
  confirmPassword: Joi.string().trim().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});
