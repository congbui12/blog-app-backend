import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(6)
    .max(20)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers and underscore',
    }),
  email: Joi.string().trim().email().required(),
  password: Joi.string()
    .trim()
    .min(6)
    .pattern(/[a-zA-Z]/, 'letters')
    .pattern(/\d/, 'numbers')
    .pattern(/[!@#$%^&*]/, 'special characters')
    .required()
    .messages({
      'string.pattern.name': 'Password must include {#name}',
    }),
});

export const loginSchema = Joi.object({
  login: Joi.string().trim().required(),
  password: Joi.string().trim().required(),
});

// export const initiatePasswordResetSchema = registerSchema.extract('email');
export const initiatePasswordResetSchema = Joi.object({
  email: registerSchema.extract('email'),
});

export const passwordResetSchema = Joi.object({
  resetPasswordToken: Joi.string().trim().required(),
  newPassword: Joi.string()
    .trim()
    .min(6)
    .pattern(/[a-zA-Z]/, 'letters')
    .pattern(/\d/, 'numbers')
    .pattern(/[!@#$%^&*]/, 'special characters')
    .required()
    .messages({
      'string.pattern.name': 'New password must include {#name}',
    }),
});
