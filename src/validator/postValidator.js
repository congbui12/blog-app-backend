import Joi from 'joi';

const createPostSchema = Joi.object({
    title: Joi.string().trim().required().messages({
        'string.empty': 'Title is required'
    }),
    content: Joi.string().trim().required().messages({
        'string.empty': 'Content is required'
    })
})

const updatePostSchema = Joi.object({
    newTitle: Joi.string().optional().trim().required().messages({
        'string.empty': 'Title is required'
    }),
    newContent: Joi.string().optional().trim().required().messages({
        'string.empty': 'Content is required'
    })
})

export default {
    createPostSchema,
    updatePostSchema,
}
