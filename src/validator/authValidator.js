import Joi from 'joi';

const registerSchema = Joi.object({
    username: Joi.string()
        .trim()
        .min(6)
        .max(20)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .required()
        .messages({
            'string.empty': 'Username is required',
            'string.min': 'Username must be between 6 and 20 characters',
            'string.max': 'Username must be between 6 and 20 characters',
            'string.pattern.base': 'Username can only contain letters, numbers and underscore'
        }),
    email: Joi.string()
        .trim()
        .email()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address'
        }),
    password: Joi.string()
        .trim()
        .min(6)
        .required()
        .pattern(/[a-zA-Z]/, 'letters')
        .pattern(/\d/, 'numbers')
        .pattern(/[!@#$%^&*]/, 'special characters')
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters',
            'string.pattern.name': 'Password must include {#name}'
        })
})

const loginSchema = Joi.object({
    login: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'Login is required'
        }),
    password: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'Password is required'
        })
})

const initiatePasswordResetSchema = Joi.object({
    email: Joi.string()
        .trim()
        .email()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address'
        })
})


const passwordResetSchema = Joi.object({
    resetPasswordToken: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'Reset password token is required'
        }),
    newPassword: Joi.string()
        .trim()
        .min(6)
        .required()
        .pattern(/[a-zA-Z]/, 'letters')
        .pattern(/\d/, 'numbers')
        .pattern(/[!@#$%^&*]/, 'special characters')
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters',
            'string.pattern.name': 'Password must include {#name}'
        })
})

export default {
    registerSchema,
    loginSchema,
    initiatePasswordResetSchema,
    passwordResetSchema,
}