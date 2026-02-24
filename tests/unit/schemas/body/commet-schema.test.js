import { describe, it, expect } from 'vitest';
import {
  addCommentSchema,
  editCommentSchema,
} from '../../../../src/modules/comment/comment-schema.js';

describe('Comment Schema Unit Tests', () => {
  describe('addCommentSchema', () => {
    it('should validate a valid schema', () => {
      const validSchema = {
        content: 'hello',
      };

      const { error } = addCommentSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should not allow an empty schema', () => {
      const invalidSchema = {};

      const { error } = addCommentSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('"content" is required');
    });

    it('should fail if content is too short', () => {
      const invalidSchema = {
        content: 'hi',
      };

      const { error } = addCommentSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('string.min');
    });
  });

  describe('editCommentSchema', () => {
    it('should not allow an empty schema', () => {
      const invalidSchema = {};

      const { error } = editCommentSchema.validate(invalidSchema);
      expect(error).toBeDefined();
    });

    it('should fail if content exceeds max length', () => {
      const invalidSchema = {
        content: 'a'.repeat(501),
      };

      const { error } = editCommentSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('string.max');
    });
  });
});
