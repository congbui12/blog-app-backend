import userService from '../services/user-service.js';
import { sanitizeUser } from '../utils/helper.js';
import { StatusCodes } from 'http-status-codes';

class UserController {
  constructor() {}

  viewPersonalData = (req, res) => {
    const currentUser = req.user;
    return res.status(StatusCodes.OK).json({
      ok: true,
      message: 'Personal data fetched successfully',
      payload: sanitizeUser(currentUser),
    });
  };

  updatePersonalData = async (req, res, next) => {
    const currentUser = req.user;
    const { username } = req.body;

    try {
      const updatedUser = await userService.updatePersonalData(currentUser._id, { username });
      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'Personal data updated successfully',
        payload: updatedUser,
      });
    } catch (error) {
      return next(error);
    }
  };

  changePassword = async (req, res, next) => {
    const currentUser = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
      await userService.changePassword(currentUser._id, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  };
}

export default UserController;
