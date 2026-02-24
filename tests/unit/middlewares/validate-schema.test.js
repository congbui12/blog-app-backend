import { describe, beforeEach, vi, it, expect } from 'vitest';
import Joi from 'joi';
import { validateSchema } from '../../../src/middlewares/validate-schema.js';
import AppError from '../../../src/utils/error/AppError.js';
import { StatusCodes } from 'http-status-codes';

describe('Validate Schema Unit Tests', () => {
  let res, next;
  beforeEach(() => {
    vi.clearAllMocks();

    res = {};
    next = vi.fn();
  });
  const schema = Joi.object({
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(13),
  });

  it('should call next(AppError) when validation fails', () => {
    const middleware = validateSchema(schema, 'body');

    const req = {
      body: {
        email: 'test@test',
        age: 'hi',
      },
    };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));

    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(error.message).toBeDefined();
  });

  it('should strip unknown fields and convert values on success', () => {
    const middleware = validateSchema(schema, 'body');

    const req = {
      body: {
        email: 'test@test.com',
        age: '18', // should convert to number
        gender: 'male',
      },
    };

    middleware(req, res, next);

    expect(req.body).toEqual({
      email: 'test@test.com',
      age: 18,
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should preserve only validated values', () => {
    const middleware = validateSchema(schema, 'body');

    const req = {
      body: {
        email: 'test@test.com',
        gender: 'male',
        name: 'test',
      },
    };

    middleware(req, res, next);

    expect(req.body).toEqual({
      email: 'test@test.com',
    });
    expect(next).toHaveBeenCalled();
  });
});
