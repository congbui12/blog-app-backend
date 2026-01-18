import { describe, vi, beforeEach, it, expect } from 'vitest';
import { requestLogger } from '../../../src/middlewares/request-logger.js';
import logger from '../../../src/utils/logger.js';
import { EventEmitter } from 'events';

vi.mock('../../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Request Logger Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Vitest-Agent' },
    };

    res = new EventEmitter();

    next = vi.fn();
  });

  it('should call next() immediately', () => {
    requestLogger(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should log info when status code is less than 400', () => {
    requestLogger(req, res, next);

    res.statusCode = 200;
    res.emit('finish');

    expect(logger.info).toHaveBeenCalledWith(
      'HTTP Request',
      expect.objectContaining({
        method: 'GET',
        statusCode: 200,
        userAgent: 'Vitest-Agent',
      })
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should log error when status code is 400 or higher', () => {
    requestLogger(req, res, next);

    res.statusCode = 404;
    res.emit('finish');

    expect(logger.error).toHaveBeenCalledWith(
      'HTTP Error',
      expect.objectContaining({
        statusCode: 404,
        url: '/api/test',
      })
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should include a durationMs property', () => {
    requestLogger(req, res, next);

    res.emit('finish');

    const logPayload = vi.mocked(logger.info).mock.calls[0][1];
    expect(logPayload.durationMs).toBeTypeOf('number');
    expect(logPayload.durationMs).toBeGreaterThanOrEqual(0);
  });
});
