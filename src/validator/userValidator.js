import Joi from 'joi';

const updateGeneralDataSchema = Joi.object({
    newUsername: Joi.string()
        .optional()
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
        })
})

const initiateEmailUpdateSchema = Joi.object({
    newEmail: Joi.string().optional().trim().required().email().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
    })
})

const updatePasswordSchema = Joi.object({
    currentPassword: Joi.string().trim().required().messages({
        'string.empty': 'Current password is required'
    }),
    newPassword: Joi.string()
        .trim()
        .required()
        .min(6)
        .pattern(/[a-z]/, 'a lowercase letter')
        .pattern(/[A-Z]/, 'an uppercase letter')
        .pattern(/[0-9]/, 'a number')
        .pattern(/[^a-zA-Z0-9]/, 'a special character')
        .messages({
            'string.empty': 'New password is required',
            'string.min': 'New password must be at least 6 characters',
            'string.pattern.name': 'New password must contain at least {#name}'
        }),
    confirmPassword: Joi.string()
        .trim()
        .required()
        .valid(Joi.ref('newPassword'))
        .messages({
            'string.empty': 'Confirm password is required',
            'any.only': 'Passwords do not match'
        })
})

export default {
    updateGeneralDataSchema,
    initiateEmailUpdateSchema,
    updatePasswordSchema,
}
