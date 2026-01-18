import { describe, it, expect } from 'vitest';
import {
  paginationSchema,
  postListQuerySchema,
  lazyQuerySchema,
} from '../../../src/schemas/query-schema.js';

describe('Query Schema Unit Tests', () => {
  describe('paginationSchema', () => {
    it('should validate a correct pagination schema', () => {
      const validQuery = {
        page: 2,
        limit: 10,
      };

      const { error } = paginationSchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    it('should use default limit value if limit field is missing', () => {
      const validQuery = {
        page: 2,
      };

      const { error, value } = paginationSchema.validate(validQuery);
      expect(error).toBeUndefined();
      expect(value.limit).toBe(5);
    });

    it('should allow an empty pagination schema', () => {
      const validQuery = {};

      const { error } = paginationSchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    it('should fail if page field is smaller than 1', () => {
      const invalidQuery = {
        page: 0,
      };

      const { error } = paginationSchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('number.min');
    });

    it('should fail if page field is string', () => {
      const invalidQuery = {
        page: '1',
      };

      const { error } = paginationSchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('number.base');
    });
  });

  describe('postListQuerySchema', () => {
    it('should allow search field is blank', () => {
      const validQuery = {
        search: '  ',
      };

      const { error } = postListQuerySchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    it('should fail if status field is not draft or published', () => {
      const invalidQuery = {
        status: 'rejected',
      };

      const { error } = postListQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('any.only');
    });

    it('should fail if author field is blank', () => {
      const invalidQuery = {
        author: '',
      };

      const { error } = postListQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('string.empty');
    });

    it('should fail if sortedBy field is invalid', () => {
      const invalidQuery = {
        sortedBy: 'updatedAt',
      };

      const { error } = postListQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('any.only');
    });
  });

  describe('lazyQuerySchema', () => {
    it('should validate if cursor field is a valid 24-character hex string', () => {
      const validQuery = {
        cursor: '507f1f78b21f867039461704',
      };

      const { error } = lazyQuerySchema.validate(validQuery);
      expect(error).toBeUndefined();
    });

    it('should allow cursor field to be null for the initial load', () => {
      const validQuery = {
        cursor: null,
      };

      const { error, value } = lazyQuerySchema.validate(validQuery);
      expect(error).toBeUndefined();
      expect(value.cursor).toBeNull();
    });

    it('should fail if cursor field is not a valid hex string', () => {
      const invalidQuery = {
        cursor: '-'.repeat(24),
      };

      const { error } = lazyQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('string.hex');
    });

    it('should fail if cursor field is not exactly 24 characters', () => {
      const invalidQuery = {
        cursor: 'c'.repeat(32),
      };

      const { error } = lazyQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('string.length');
    });

    it('should fail if limit field is greater than 15', () => {
      const invalidQuery = {
        limit: 16,
      };

      const { error } = lazyQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('number.max');
    });

    it('should fail if sortOrder field is not asc or desc', () => {
      const invalidQuery = {
        sortOrder: 'default',
      };

      const { error } = lazyQuerySchema.validate(invalidQuery);
      expect(error.details[0].type).toBe('any.only');
    });
  });
});
