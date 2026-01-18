import { vi, describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import {
  hashPassword,
  comparePassword,
  createToken,
  sanitizeUser,
  escapeRegex,
  generateSlug,
} from '../../../src/utils/helper.js';

// Mock dependencies
vi.mock('bcrypt');
vi.mock('nanoid');

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

  describe('generateSlug()', () => {
    it('should clean title and append nanoid', () => {
      vi.mocked(nanoid).mockReturnValue('123456');

      const title = '  My Awesome Post!  ';
      const result = generateSlug(title);

      // 1. Lowercase 2. Hyphenated 3. Trimmed 4. ID appended
      expect(result).toBe('my-awesome-post-123456');
    });

    it('should handle special characters correctly', () => {
      vi.mocked(nanoid).mockReturnValue('abc');
      expect(generateSlug('C++ is great')).toBe('c-is-great-abc');
    });
  });
});
