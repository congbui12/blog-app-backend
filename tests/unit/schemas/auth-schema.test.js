import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  passwordResetSchema,
} from '../../../src/schemas/auth-schema.js';

describe('Auth Schema Unit Tests', () => {
  describe('registerSchema', () => {
    it('should validate a valid registration schema', () => {
      const validSchema = {
        username: 'test_01',
        email: 'test@test.com',
        password: 'Secret01*',
      };

      const { error } = registerSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should fail if username is too long', () => {
      const invalidSchema = {
        username: 'a'.repeat(21),
        email: 'test@test.com',
        password: 'Secret01*',
      };
      const { error } = registerSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('string.max');
    });

    it('should fail if username contains invalid characters', () => {
      const invalidSchema = {
        username: 'test_*',
        email: 'test@test.com',
        password: 'Secret01*',
      };
      const { error } = registerSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe(
        'Username can only contain letters, numbers and underscore'
      );
    });

    it('should fail if email is invalid', () => {
      const invalidSchema = {
        username: 'test_01',
        email: 'test@test',
        password: 'Secret01*',
      };

      const { error } = registerSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('"email" must be a valid email');
    });

    it('should fail if password is too short', () => {
      const invalidSchema = {
        username: 'test_01',
        email: 'test@test.com',
        password: 'Pwd1*',
      };
      const { error } = registerSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('string.min');
    });

    it('should fail if password is missing a special character', () => {
      const invalidSchema = {
        username: 'test_01',
        email: 'test@test.com',
        password: 'Secret01',
      };

      const { error } = registerSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('Password must include special characters');
    });
  });

  describe('loginSchema', () => {
    it('should validate a valid login schema', () => {
      const validSchema = {
        login: 'login',
        password: 'Secret',
      };

      const { error } = loginSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should fail if password field is missing', () => {
      const invalidSchema = {
        login: 'login',
      };

      const { error } = loginSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('"password" is required');
    });

    it('should fail if password field is blank', () => {
      const invalidSchema = {
        login: 'login',
        password: ' ',
      };

      const { error } = loginSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('"password" is not allowed to be empty');
    });
  });

  describe('passwordResetSchema', () => {
    it('should validate a valid password reset schema', () => {
      const validSchema = {
        resetPasswordToken: 'plain',
        newPassword: 'NewPwd1!',
      };

      const { error } = passwordResetSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should fail if new password is missing a number', () => {
      const invalidSchema = {
        resetPasswordToken: 'plain',
        newPassword: 'NewPwd!',
      };

      const { error } = passwordResetSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('New password must include numbers');
    });

    it('should fail if new password is missing a letter', () => {
      const invalidSchema = {
        resetPasswordToken: 'plain',
        newPassword: '5*****',
      };

      const { error } = passwordResetSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('New password must include letters');
    });
  });
});
