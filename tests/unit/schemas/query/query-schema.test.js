import { describe, it, expect } from 'vitest';
import {
  paginationSchema,
  postListQuerySchema,
  postSearchQuerySchema,
  lazySchema,
} from '../../../../src/schemas/query/query-schema.js';

describe('Query Schema Unit Tests', () => {
  describe('paginationSchema', () => {
    it('should validate a valid schema', () => {
      const validQuery = {
        page: 2,
        limit: 10,
      };

      const { error } = paginationSchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    it('should use default limit value if limit is missing', () => {
      const validQuery = {
        page: 2,
      };

      const { error, value } = paginationSchema.validate(validQuery);
      expect(error).toBeUndefined();
      expect(value.limit).toBe(5);
    });

    it('should allow an empty schema', () => {
      const validQuery = {};

      const { error } = paginationSchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    it('should fail if page is smaller than 1', () => {
      const invalidQuery = {
        page: 0,
      };

      const { error } = paginationSchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('number.min');
    });

    it('should allow page to be a numeric string', () => {
      const invalidQuery = {
        page: '1',
      };

      const { error } = paginationSchema.validate(invalidQuery);
      expect(error).toBeUndefined();
    });
  });

  describe('postListQuerySchema', () => {
    it('should allow an empty schema', () => {
      const validQuery = {};

      const { error } = postListQuerySchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    it('should fail if status is not draft or published', () => {
      const invalidQuery = {
        status: 'rejected',
      };

      const { error } = postListQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('any.only');
    });

    it('should fail if author is blank', () => {
      const invalidQuery = {
        author: '',
      };

      const { error } = postListQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('string.empty');
    });

    it('should fail if author is 24 chars but not a hex string', () => {
      const invalidQuery = {
        // 'g' is not a valid hex character
        author: '60f71234567890abcdef123g',
      };

      const { error } = postListQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('string.hex');
    });

    it('should fail if author is too short', () => {
      const invalidQuery = { author: 'abc123' };
      const { error } = postListQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('string.length');
    });

    it('should allow valid pagination keys (inheritance check)', () => {
      const validQuery = {
        page: 1,
        limit: 10,
      };

      const { error, value } = postListQuerySchema.validate(validQuery);
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
    });

    it('should fail if sortedBy is invalid', () => {
      const invalidQuery = {
        sortedBy: 'updatedAt',
      };

      const { error } = postListQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('any.only');
    });
  });

  describe('postSearchQuerySchema', () => {
    it('should not allow blank term', () => {
      const invalidQuery = {
        term: '  ',
      };

      const { error } = postSearchQuerySchema.validate(invalidQuery);
      expect(error).toBeDefined();
    });

    it('should trim search correctly', () => {
      const validQuery = {
        term: ' hello ',
      };

      const { error, value } = postSearchQuerySchema.validate(validQuery);
      expect(error).toBeUndefined();
      expect(value.term).toBe('hello');
    });

    it('should pass for valid sortedBy key', () => {
      const validQuery = {
        term: 'hi',
        sortedBy: 'most-liked',
      };

      const { error } = postSearchQuerySchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    it('should fail if sortedBy is invalid', () => {
      const invalidQuery = {
        term: 'hello',
        sortedBy: 'invalid',
      };

      const { error } = postSearchQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('any.only');
    });
  });

  describe('lazySchema', () => {
    it('should validate if cursor is a valid 24-character hex string', () => {
      const validQuery = {
        cursor: '507f1f78b21f867039461704',
      };

      const { error } = lazySchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    it('should allow cursor to be null', () => {
      const validQuery = {
        cursor: null,
      };

      const { error, value } = lazySchema.validate(validQuery);
      expect(error).toBeUndefined();
      expect(value.cursor).toBeNull();
    });

    it('should fail if cursor is not a valid hex string', () => {
      const invalidQuery = {
        cursor: '-'.repeat(24),
      };

      const { error } = lazySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('string.hex');
    });

    it('should fail if cursor is not exactly 24 characters', () => {
      const invalidQuery = {
        cursor: 'c'.repeat(32),
      };

      const { error } = lazySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('string.length');
    });

    it('should fail if limit is greater than 15', () => {
      const invalidQuery = {
        limit: 16,
      };

      const { error } = lazySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('number.max');
    });

    it('should fail if sortOrder is not asc or desc', () => {
      const invalidQuery = {
        sortOrder: 'default',
      };

      const { error } = lazySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('any.only');
    });
  });
});
