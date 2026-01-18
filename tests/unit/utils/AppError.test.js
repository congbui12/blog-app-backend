import { describe, it, expect } from 'vitest';
import AppError from '../../../src/utils/AppError.js';

describe('AppError Unit Tests', () => {
  it('should create an instance with the correct message and statusCode', () => {
    const message = 'Resource not found';
    const statusCode = 404;
    const error = new AppError(message, statusCode);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
  });

  it('should set isOperational to true by default', () => {
    const error = new AppError('Operation failed', 400);

    expect(error.isOperational).toBe(true);
  });

  it('should capture the stack trace', () => {
    const error = new AppError('Stack trace test', 500);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError.test.js');
  });

  it('should work correctly when thrown', () => {
    const throwError = () => {
      throw new AppError('Forbidden', 403);
    };

    expect(throwError).toThrow(AppError);
    expect(throwError).toThrow('Forbidden');
  });

  it('should maintain the correct statusCode type as a number', () => {
    const error = new AppError('Type test', 401);
    expect(typeof error.statusCode).toBe('number');
  });
});
