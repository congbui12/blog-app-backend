import { vi, describe, beforeEach, it, expect } from 'vitest';
import { errorHandler } from '../../../src/middlewares/error-handler.js';
import { StatusCodes } from 'http-status-codes';
import logger from '../../../src/utils/logger.js';

vi.mock('../../../src/utils/logger.js', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Error Handler Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      method: 'GET',
      originalUrl: '/api/test',
    };
    res = {
      // Mocking chained method: res.status().json()
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('should handle an operational AppError', () => {
    const operationalError = {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid input data',
      isOperational: true,
    };

    errorHandler(operationalError, req, res, next);

    // Check status code
    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);

    // Check JSON response
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: 'Invalid input data',
    });

    // Verify logger was called with operational details
    expect(logger.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        statusCode: 400,
        method: 'GET',
        url: '/api/test',
      })
    );
  });

  it('should obscure details for non-operational (generic) errors', () => {
    // Error lacks .isOperational and .statusCode
    const internalError = new Error('Database connection failed');

    errorHandler(internalError, req, res, next);

    // Should fallback to default status code (500)
    expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);

    // Should show generic message to user for security
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: 'Internal Server Error',
    });

    // Logger should still receive the real error stack for debugging
    const [[, logDetails]] = vi.mocked(logger.error).mock.calls;
    expect(logDetails.stack).toBeDefined();
  });
});
