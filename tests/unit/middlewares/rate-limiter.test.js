import { describe, it, expect, vi } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { createRateLimitHandler } from '../../../src/middlewares/rate-limiter.js';

describe('Rate Limiter Middleware Unit Tests', () => {
  it('should throw 429 with correct message when limit is exceeded', () => {
    const handler = createRateLimitHandler('login', 10);

    const req = {};
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.TOO_MANY_REQUESTS);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Too many attempts',
      message: 'For your security, login requests are limited. Please try again in 10 minutes',
    });
  });
});
