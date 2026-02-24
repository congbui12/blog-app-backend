import { describe, it, expect } from 'vitest';
import { addPostSchema, editPostSchema } from '../../../../src/modules/post/post-schema.js';
import { createLexicalContent } from '../../../helpers/integration-helper.js';

describe('Post Schema Unit Tests', () => {
  describe('addPostSchema', () => {
    it('should validate a valid schema', () => {
      const validSchema = {
        title: 'title',
        content: createLexicalContent(),
        status: 'draft',
      };

      const { error } = addPostSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should fail if content is empty', () => {
      const invalidSchema = {
        title: 'title',
        content: {
          root: {
            type: 'root',
            version: 1,
            children: [],
          },
        },
        status: 'published',
      };
      const { error } = addPostSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('lexical.empty');
      expect(error.details[0].message).toContain('Post content cannot be empty');
    });

    it('should fail if content has only whitespace', () => {
      const invalidSchema = {
        title: 'title',
        content: createLexicalContent('     '),
        status: 'published',
      };
      const { error } = addPostSchema.validate(invalidSchema);
      expect(error).toBeDefined();
    });

    it('should fail if content is too large', () => {
      const invalidSchema = {
        title: 'title',
        content: createLexicalContent('a'.repeat(60000)),
        status: 'published',
      };
      const { error } = addPostSchema.validate(invalidSchema);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('too large');
    });

    it('should fail if status is not draft or published', () => {
      const invalidSchema = {
        title: 'title',
        content: createLexicalContent(),
        status: 'rejected',
      };

      const { error } = addPostSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('any.only');
    });
  });

  describe('editPostSchema', () => {
    it('should not allow an empty schema', () => {
      const invalidSchema = {};

      const { error } = editPostSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('object.min');
    });

    it('should fail if 1 invalid field is provided', () => {
      const invalidSchema = {
        content: 'new',
      };

      const { error } = editPostSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('object.base');
    });

    it('should validate if 1 valid field is provided', () => {
      const invalidSchema = {
        content: createLexicalContent(),
      };

      const { error } = editPostSchema.validate(invalidSchema);
      expect(error).toBeUndefined();
    });
  });
});
