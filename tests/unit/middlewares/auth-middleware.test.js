import { describe, beforeEach, vi, it, expect } from 'vitest';
import { authenticate, optionalAuthenticate } from '../../../src/middlewares/auth-middleware.js';
import AppError from '../../../src/utils/AppError.js';
import { StatusCodes } from 'http-status-codes';

describe('Auth Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-initialize mocks before every test
    req = {
      isAuthenticated: vi.fn(),
      user: { id: '123' },
    };
    res = {};
    next = vi.fn();
  });

  describe('authenticate()', () => {
    it('should call next() if user is authenticated', () => {
      req.isAuthenticated.mockReturnValue(true);

      const middleware = authenticate('do something');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next(AppError) if user is not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);
      const action = 'access the dashboard';

      const middleware = authenticate(action);
      middleware(req, res, next);

      // Verify the error details
      // next.mock.calls[0] is the first time next() was called
      // [0] is the first argument passed to that call (the AppError instance)
      const errorArg = next.mock.calls[0][0];
      expect(errorArg).toBeInstanceOf(AppError);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: `You are not logged in. Please login to ${action}`,
        })
      );
    });
  });

  describe('optionalAuthenticate()', () => {
    it('should call next() and keep user if authenticated', () => {
      req.isAuthenticated.mockReturnValue(true);

      optionalAuthenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should set req.user to null and call next() if not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);

      optionalAuthenticate(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });
  });
});
