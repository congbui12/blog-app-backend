import Joi from 'joi';
import { registerSchema } from '../auth/auth-schema.js';

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
    .invalid(Joi.ref('currentPassword'))
    .required()
    .messages({
      'any.invalid': 'New password cannot be the same as the current password',
      'string.pattern.name': 'New password must contain at least {#name}',
    }),
  confirmPassword: Joi.string().trim().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match', // valid() is an alias for only()
  }),
});
