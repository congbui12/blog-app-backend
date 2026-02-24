import { vi, describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';
import {
  hashPassword,
  comparePassword,
  createToken,
  buildResetPasswordEmail,
  sanitizeUser,
  escapeRegex,
  extractText,
} from '../../../../src/utils/helper/index.js';

// Mock dependencies
vi.mock('bcrypt');

describe('Helper Utils Unit Tests', () => {
  describe('Password Helpers', () => {
    it('hashPassword should call bcrypt with correct rounds', async () => {
      vi.mocked(bcrypt.genSalt).mockResolvedValue('salt');
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-pwd');

      const result = await hashPassword('plain-pwd');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(result).toBe('hashed-pwd');
    });

    it('comparePassword should return true on match', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      const result = await comparePassword('plain', 'hashed');
      expect(result).toBe(true);
    });
  });

  describe('createToken()', () => {
    it('should return a plain token and its SHA-256 hash', () => {
      const { plainToken, hashedToken, expiresAt } = createToken();

      expect(plainToken).toBeDefined();
      expect(hashedToken).toHaveLength(64); // SHA-256 hex length
      expect(expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('buildResetPasswordEmail()', () => {
    const clientURL = 'http://localhost:5173';
    const token = 'plain-token';

    it('should return an object with the correct subject', () => {
      const result = buildResetPasswordEmail(clientURL, token);
      expect(result.subject).toBe('Reset your password');
    });

    it('should inject the clientUrl and token into the email body link', () => {
      const result = buildResetPasswordEmail(clientURL, token);

      const expectedHref = `href='${clientURL}/reset-password?token=${token}'`;
      expect(result.body).toContain(expectedHref);
    });

    it('should contain the expiration notice', () => {
      const result = buildResetPasswordEmail(clientURL, token);
      expect(result.body).toContain('This link is available for 15 minutes');
    });

    it('should return a string for the email body', () => {
      const result = buildResetPasswordEmail(clientURL, token);
      expect(typeof result.body).toBe('string');
    });
  });

  describe('sanitizeUser()', () => {
    it('should remove sensitive fields from a plain object', () => {
      const userDoc = {
        username: 'test',
        password: '123',
        resetPasswordToken: 'token',
        email: 'test@test.com',
      };
      const result = sanitizeUser(userDoc);

      expect(result.password).toBeUndefined();
      expect(result.resetPasswordToken).toBeUndefined();
      expect(result.username).toBe('test');
    });

    it('should handle Mongoose documents via toObject()', () => {
      const userDoc = {
        username: 'test',
        password: '123',
        toObject: vi.fn().mockReturnValue({ username: 'test', password: '123' }),
      };
      const result = sanitizeUser(userDoc);

      expect(userDoc.toObject).toHaveBeenCalled();
      expect(result.password).toBeUndefined();
    });
  });

  describe('escapeRegex()', () => {
    it('should escape special regex characters', () => {
      const input = 'Hello. (world)*';
      const result = escapeRegex(input);
      expect(result).toBe('Hello\\. \\(world\\)\\*');
    });
  });

  describe('extractText()', () => {
    it('should extract text from a simple paragraph', () => {
      const node = {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Hello world', version: 1 }],
      };
      expect(extractText(node)).toBe('Hello world');
    });

    it('should extract and join text from multiple children', () => {
      const node = {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Hello', version: 1 },
          { type: 'text', text: ' ', version: 1 },
          { type: 'text', text: 'World', version: 1 },
        ],
      };
      expect(extractText(node)).toBe('Hello   World');
    });

    it('should handle deeply nested structures (like lists)', () => {
      const node = {
        type: 'list',
        children: [
          {
            type: 'listitem',
            children: [{ type: 'text', text: 'Item 1' }],
          },
          {
            type: 'listitem',
            children: [{ type: 'text', text: 'Item 2' }],
          },
        ],
      };
      // Expected: "Item 1 Item 2"
      expect(extractText(node).trim()).toContain('Item 1');
      expect(extractText(node).trim()).toContain('Item 2');
    });

    it('should return empty string for image or divider nodes without text', () => {
      const node = {
        type: 'image',
        src: 'cat.jpg',
        version: 1,
      };
      expect(extractText(node)).toBe('');
    });

    it('should handle null or undefined gracefully', () => {
      expect(extractText(null)).toBe('');
      expect(extractText(undefined)).toBe('');
    });
  });
});
