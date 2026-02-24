import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} from '../../../../src/modules/auth/auth-schema.js';

describe('Auth Schema Unit Tests', () => {
  describe('registerSchema', () => {
    it('should validate a valid schema', () => {
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
    it('should validate a valid schema', () => {
      const validSchema = {
        login: 'login',
        password: 'secret',
      };

      const { error } = loginSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should not allow an empty schema', () => {
      const invalidSchema = {};

      const { error } = loginSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('"login" is required');
    });

    it('should fail if password is missing', () => {
      const invalidSchema = {
        login: 'login',
      };

      const { error } = loginSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('"password" is required');
    });

    it('should fail if password is blank', () => {
      const invalidSchema = {
        login: 'login',
        password: ' ',
      };

      const { error } = loginSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('"password" is not allowed to be empty');
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate a valid schema', () => {
      const validSchema = {
        resetPasswordToken: 'ab9d7f75febb5dd82adf3abd78d2aa374b2b6e75caa4dc4db56a5d88d1fedbaa',
        newPassword: 'NewPwd1!',
      };

      const { error } = resetPasswordSchema.validate(validSchema);
      expect(error).toBeUndefined();
    });

    it('should fail if resetPasswordToken is not a valid hex string', () => {
      const invalidSchema = {
        resetPasswordToken: '-'.repeat(64),
        newPassword: 'NewPwd1!',
      };

      const { error } = resetPasswordSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('string.hex');
    });

    it('should fail if resetPasswordToken is not exactly 64 characters', () => {
      const invalidSchema = {
        resetPasswordToken: 'a'.repeat(32),
        newPassword: 'NewPwd1!',
      };

      const { error } = resetPasswordSchema.validate(invalidSchema);
      expect(error.details[0].type).toBe('string.length');
    });

    it('should fail if new password is missing a number', () => {
      const invalidSchema = {
        resetPasswordToken: 'ab9d7f75febb5dd82adf3abd78d2aa374b2b6e75caa4dc4db56a5d88d1fedbaa',
        newPassword: 'NewPwd!',
      };

      const { error } = resetPasswordSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('New password must include numbers');
    });

    it('should fail if new password is missing a letter', () => {
      const invalidSchema = {
        resetPasswordToken: 'ab9d7f75febb5dd82adf3abd78d2aa374b2b6e75caa4dc4db56a5d88d1fedbaa',
        newPassword: '5*****',
      };

      const { error } = resetPasswordSchema.validate(invalidSchema);
      expect(error.details[0].message).toBe('New password must include letters');
    });
  });
});
