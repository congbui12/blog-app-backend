import AppError from '../utils/error/AppError.js';
import { StatusCodes } from 'http-status-codes';

export const validateSchema = (schema, property) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const firstMessage = error.details[0].message;
      return next(new AppError(firstMessage, StatusCodes.BAD_REQUEST));
    }

    Object.keys(req[property]).forEach((key) => {
      delete req[property][key];
    });
    Object.assign(req[property], value);

    next();
  };
};
