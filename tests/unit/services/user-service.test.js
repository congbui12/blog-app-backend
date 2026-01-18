import { vi, describe, beforeEach, it, expect } from 'vitest';
import userService from '../../../src/services/user-service.js';
import User from '../../../src/db/models/User.js';
import AppError from '../../../src/utils/AppError.js';
import { comparePassword } from '../../../src/utils/helper.js';
import { genObjectId, createMockUser } from '../../utils/unit-helper.js';

vi.mock('../../../src/db/models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../../src/utils/helper.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    comparePassword: vi.fn(),
  };
});

describe('User Service Unit Tests', () => {
  let mockId;
  beforeEach(() => {
    vi.clearAllMocks();
    mockId = genObjectId();
  });

  describe('updatePersonalData()', () => {
    const input = { username: 'test' };

    it('should throw 409 if username already taken', async () => {
      const mockUser = createMockUser();

      vi.mocked(User.findOne).mockResolvedValue(mockUser);

      await expect(userService.updatePersonalData(mockId, input)).rejects.toThrow(AppError);

      await expect(userService.updatePersonalData(mockId, input)).rejects.toMatchObject({
        message: 'Username already taken',
        statusCode: 409,
        isOperational: true,
      });

      expect(User.findOne).toHaveBeenCalledWith({
        username: 'test',
      });
    });

    it('should throw 404 if cannot find updated user', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(User.findByIdAndUpdate).mockResolvedValue(null);

      await expect(userService.updatePersonalData(mockId, input)).rejects.toThrow(AppError);

      await expect(userService.updatePersonalData(mockId, input)).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
        isOperational: true,
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        { username: 'test' },
        { new: true, runValidators: true }
      );
    });

    it('should update username successfully if username is not taken', async () => {
      const mockUpdatedUser = createMockUser({
        _id: mockId,
        username: 'test',
      });

      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(User.findByIdAndUpdate).mockResolvedValue(mockUpdatedUser);

      const result = await userService.updatePersonalData(mockId, input);

      expect(User.findOne).toHaveBeenCalledWith({ username: 'test' });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        { username: 'test' },
        { new: true, runValidators: true }
      );
      expect(result).toHaveProperty('_id', mockId);
      expect(result).toHaveProperty('username', 'test');
      expect(result.password).toBeUndefined();
    });
  });

  describe('changePassword()', () => {
    const invalidInput = {
      currentPassword: 'old',
      newPassword: 'old',
      confirmPassword: 'old',
    };
    const validInput = {
      currentPassword: 'old',
      newPassword: 'new',
      confirmPassword: 'new',
    };

    it('should throw 400 if current password equals to new password', async () => {
      await expect(userService.changePassword(mockId, invalidInput)).rejects.toThrow(AppError);

      await expect(userService.changePassword(mockId, invalidInput)).rejects.toMatchObject({
        message: 'New password should be different from current password',
        statusCode: 400,
        isOperational: true,
      });
    });

    it('should throw 404 if user not found', async () => {
      vi.mocked(User.findById).mockResolvedValue(null);

      await expect(userService.changePassword(mockId, validInput)).rejects.toThrow(AppError);

      await expect(userService.changePassword(mockId, validInput)).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
        isOperational: true,
      });

      expect(User.findById).toHaveBeenCalledWith(mockId);
    });

    it('should throw 400 if current password is incorrect', async () => {
      const mockUser = createMockUser({
        password: 'hashed',
      });

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(comparePassword).mockResolvedValue(false);

      await expect(userService.changePassword(mockId, validInput)).rejects.toThrow(AppError);

      await expect(userService.changePassword(mockId, validInput)).rejects.toMatchObject({
        message: 'Current password is incorrect',
        statusCode: 400,
        isOperational: true,
      });

      expect(User.findById).toHaveBeenCalledWith(mockId);
      expect(comparePassword).toHaveBeenCalledWith('old', 'hashed');
    });

    it('should update current password successfully', async () => {
      const mockUser = createMockUser({
        password: 'hashed',
      });

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(comparePassword).mockResolvedValue(true);

      await userService.changePassword(mockId, validInput);

      expect(User.findById).toHaveBeenCalledWith(mockId);
      expect(comparePassword).toHaveBeenCalledWith('old', 'hashed');
      expect(mockUser.password).toBe('new');
      expect(mockUser.save).toHaveBeenCalledOnce();
    });
  });
});
