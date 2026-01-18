import { describe, it, expect } from 'vitest';
import { addPostSchema, editPostSchema } from '../../../src/schemas/post-schema.js';

describe('Post Schema Unit Tests', () => {
  describe('addPostSchema', () => {
    it('should validate a valid post schema', () => {
      const validSchema = {
        title: 'title',
        content: 'post content',
        status: 'draft',
      };

      const { error } = addPostSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should fail if content field is not draft or published', () => {
      const invalidSchema = {
        title: 'title',
        content: 'post content',
        status: 'rejected',
      };

      const { error } = addPostSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('any.only');
    });
  });

  describe('editPostSchema', () => {
    it('should fail if there is no field provided (when defaults are ignored)', () => {
      const invalidSchema = {};

      const { error } = editPostSchema.validate(invalidSchema, { noDefaults: true });
      expect(error.details[0].type).toBe('object.min');
    });

    it('should fail if at least 1 invalid field is provided', () => {
      const invalidSchema = {
        content: 'new',
      };

      const { error } = editPostSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('string.min');
    });

    it('should validate if at least 1 valid field is provided', () => {
      const invalidSchema = {
        content: 'new content',
      };

      const { error } = editPostSchema.validate(invalidSchema);
      expect(error).toBeUndefined();
    });
  });
});
