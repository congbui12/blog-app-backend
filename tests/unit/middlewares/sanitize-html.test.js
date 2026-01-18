import { describe, beforeEach, it, expect, vi } from 'vitest';
import { sanitizeHTML } from '../../../src/middlewares/sanitize-html.js';

describe('Sanitize HTML Middleware Unit Tests', () => {
  let res, next;
  beforeEach(() => {
    vi.clearAllMocks();

    res = {};
    next = vi.fn();
  });

  it('should sanitize HTML in the specified body property', () => {
    const middleware = sanitizeHTML('content');

    const req = {
      body: {
        content:
          '<p>Hello <strong>world</strong><img src="x" onerror="alert(1)" style="color:red"></p>',
      },
    };

    middleware(req, res, next);

    expect(req.body.content).toBe('<p>Hello <strong>world</strong><img src="x"></p>');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should do nothing if the property does not exist', () => {
    const middleware = sanitizeHTML('content');

    const req = { body: {} };

    middleware(req, res, next);

    expect(req.body.content).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should preserve allowed attributes', () => {
    const middleware = sanitizeHTML('content');

    const req = {
      body: {
        content: '<a href="https://example.com" target="_blank" rel="noopener">Link</a>',
      },
    };

    middleware(req, res, next);

    expect(req.body.content).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener">Link</a>'
    );
  });
});
