import Joi from 'joi';

const addCommentSchema = Joi.object({
    text: Joi.string().trim().required().messages({
        'string.empty': 'Text is required'
    })
})

const editCommentSchema = Joi.object({
    newText: Joi.string().trim().required().messages({
        'string.empty': 'Text is required'
    })
})

export default {
    addCommentSchema,
    editCommentSchema,
}
