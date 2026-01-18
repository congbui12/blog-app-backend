import { vi, describe, beforeEach, it, expect } from 'vitest';
import authService from '../../../src/services/auth-service.js';
import User from '../../../src/db/models/User.js';
import AppError from '../../../src/utils/AppError.js';
import { createToken, sendEmail } from '../../../src/utils/helper.js';
import logger from '../../../src/utils/logger.js';
import { genObjectId, createMockUser } from '../../utils/unit-helper.js';

// Mock User model
vi.mock('../../../src/db/models/User.js', () => ({
  default: {
    exists: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
  },
}));

// Mock utils
vi.mock('../../../src/utils/helper.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendEmail: vi.fn(),
    createToken: vi.fn(() => ({
      plainToken: 'plain-token',
      hashedToken: 'hashed-token',
      expiresAt: 100,
    })),
  };
});

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register()', () => {
    const input = { username: 'test', email: 'test@test.com', password: '123' };

    it('should throw 409 if username or email already exists', async () => {
      const mockId = genObjectId();

      vi.mocked(User.exists).mockResolvedValue({ _id: mockId });

      await expect(authService.register(input)).rejects.toThrow(AppError);

      await expect(authService.register(input)).rejects.toMatchObject({
        message: 'Account already exists with this email or username',
        statusCode: 409,
        isOperational: true,
      });
      expect(User.exists).toHaveBeenCalledWith({
        $or: [{ username: 'test' }, { email: 'test@test.com' }],
      });
    });

    it('should create new user and return safe payload', async () => {
      const mockId = genObjectId();
      const input = { username: 'test', email: 'test@test.com', password: '123' };

      vi.mocked(User.exists).mockResolvedValue(null);

      const mockUser = createMockUser({
        ...input,
        _id: mockId,
        toObject: () => ({ ...input, _id: mockId }),
      });

      vi.mocked(User.create).mockResolvedValue(mockUser);

      const result = await authService.register(input);

      // Assertions
      expect(result).toHaveProperty('_id', mockId);
      expect(result).toHaveProperty('username', 'test');
      expect(result).toHaveProperty('email', 'test@test.com');
      expect(result.password).toBeUndefined();
    });
  });

  describe('initiatePasswordReset()', () => {
    const input = { email: 'j@doe.com' };

    it('should do nothing if user not found', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await authService.initiatePasswordReset(input);

      expect(createToken).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should generate token, save user and send email', async () => {
      vi.stubEnv('FRONTEND_BASE_URL', 'http://localhost:5173');

      const mockUser = createMockUser({ email: 'j@doe.com' });
      const expectedLink = 'http://localhost:5173/reset-password?token=plain-token';

      vi.mocked(User.findOne).mockResolvedValue(mockUser);

      await authService.initiatePasswordReset(input);

      expect(mockUser.resetPasswordToken).toEqual('hashed-token');
      expect(mockUser.resetPasswordTokenExpiry).toEqual(100);
      expect(mockUser.save).toHaveBeenCalledOnce();
      expect(sendEmail).toHaveBeenCalledWith(
        'j@doe.com',
        'Reset your password',
        expect.stringContaining(expectedLink)
      );
    });

    it('should log error if sending email fails', async () => {
      const mockUser = createMockUser({ email: 'j@doe.com' });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(sendEmail).mockRejectedValue(new Error('SMTP error'));

      await authService.initiatePasswordReset(input);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('resetPassword()', () => {
    const input = { resetPasswordToken: 'plain', newPassword: '456' };

    it('should throw 400 if token is invalid or expired', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(authService.resetPassword(input)).rejects.toThrow(AppError);

      await expect(authService.resetPassword(input)).rejects.toMatchObject({
        message: 'This password reset link is either invalid or expired',
        statusCode: 400,
        isOperational: true,
      });
    });

    it('should update password and clear reset token', async () => {
      const mockUser = createMockUser({
        password: '123',
        resetPasswordToken: 'hashed',
        resetPasswordTokenExpiry: 100,
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);

      await authService.resetPassword(input);

      expect(User.findOne).toHaveBeenCalled({
        resetPasswordToken: expect.any(String),
        resetPasswordTokenExpiry: { $gt: expect.any(Number) },
      });
      expect(mockUser.password).toBe('456');
      expect(mockUser.resetPasswordToken).toBeUndefined();
      expect(mockUser.resetPasswordTokenExpiry).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalledOnce();
    });
  });
});
