import { vi, describe, beforeEach, it, expect } from 'vitest';
import userService from '../../../src/modules/user/user-service.js';
import User from '../../../src/db/models/User.js';
import AppError from '../../../src/utils/error/AppError.js';
import { comparePassword } from '../../../src/utils/helper/index.js';
import { genObjectId, createMockUser } from '../../helpers/unit-helper.js';

vi.mock('../../../src/db/models/User.js', () => ({
  default: {
    exists: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../../src/utils/helper/index.js', async (importOriginal) => {
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
      vi.mocked(User.exists).mockResolvedValue({ _id: genObjectId() });

      await expect(userService.updatePersonalData(mockId, input)).rejects.toThrow(AppError);
      await expect(userService.updatePersonalData(mockId, input)).rejects.toMatchObject({
        message: 'Username already taken',
        statusCode: 409,
        isOperational: true,
      });

      expect(User.exists).toHaveBeenCalledWith({
        username: 'test',
        _id: { $ne: mockId },
      });
    });

    it('should throw 404 if cannot find updated user', async () => {
      vi.mocked(User.exists).mockResolvedValue(null);
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

      vi.mocked(User.exists).mockResolvedValue(null);
      vi.mocked(User.findByIdAndUpdate).mockResolvedValue(mockUpdatedUser);

      const result = await userService.updatePersonalData(mockId, input);

      expect(User.exists).toHaveBeenCalledWith({ username: 'test', _id: { $ne: mockId } });
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
    const input = {
      currentPassword: 'old',
      newPassword: 'new',
    };
    const mockUser = createMockUser({
      _id: mockId,
      password: 'hashed',
    });

    it('should throw 404 if user not found', async () => {
      vi.mocked(User.findById).mockResolvedValue(null);

      await expect(userService.changePassword(mockId, input)).rejects.toThrow(AppError);
      await expect(userService.changePassword(mockId, input)).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
        isOperational: true,
      });

      expect(User.findById).toHaveBeenCalledWith(mockId, '_id password');
    });

    it('should throw 400 if current password is incorrect', async () => {
      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(comparePassword).mockResolvedValue(false);

      await expect(userService.changePassword(mockId, input)).rejects.toThrow(AppError);
      await expect(userService.changePassword(mockId, input)).rejects.toMatchObject({
        message: 'Incorrect current password',
        statusCode: 400,
        isOperational: true,
      });

      expect(User.findById).toHaveBeenCalledWith(mockId, '_id password');
      expect(comparePassword).toHaveBeenCalledWith('old', 'hashed');
    });

    it('should update current password successfully', async () => {
      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(comparePassword).mockResolvedValue(true);

      await userService.changePassword(mockId, input);

      expect(User.findById).toHaveBeenCalledWith(mockId, '_id password');
      expect(comparePassword).toHaveBeenCalledWith('old', 'hashed');
      expect(mockUser.password).toBe('new');
      expect(mockUser.save).toHaveBeenCalledOnce();
    });
  });
});
