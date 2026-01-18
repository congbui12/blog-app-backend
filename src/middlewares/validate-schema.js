import { StatusCodes } from 'http-status-codes';
import AppError from '../utils/AppError.js';

export const validateJoiSchema = (schema, property) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
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
