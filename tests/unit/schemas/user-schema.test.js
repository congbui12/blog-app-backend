import { describe, it, expect } from 'vitest';
import {
  updatePersonalDataSchema,
  changePasswordSchema,
} from '../../../src/schemas/user-schema.js';

describe('User Schema Unit Tests', () => {
  describe('updatePersonalDataSchema', () => {
    it('should allow an empty object', () => {
      const validSchema = {};

      const { error } = updatePersonalDataSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should allow input containing only username field', () => {
      const validSchema = {
        username: 'test_01',
      };

      const { error } = updatePersonalDataSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should not allow input containing email and password', () => {
      const invalidSchema = {
        email: 'test@test.com',
        password: 'Secret1*',
      };

      const { error } = updatePersonalDataSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('any.unknown');
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate a valid change password schema', () => {
      const validSchema = {
        currentPassword: 'old',
        newPassword: 'Newpwd1*',
        confirmPassword: 'Newpwd1*',
      };

      const { error } = changePasswordSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should fail if confirm password does not match with new password', () => {
      const validSchema = {
        currentPassword: 'old',
        newPassword: 'Newpwd1*',
        confirmPassword: 'Newpwd1',
      };

      const { error } = changePasswordSchema.validate(validSchema);
      expect(error.details[0].type).toBe('any.only');
    });
  });
});
