import User from '../models/user.model.js';
import AppError from '../config/AppError.js';
import catchAsync from '../middleware/catchAsync.js';

const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new AppError('User not found', 404));
  res.json(user);
});

export { getAllUsers, getUserById };
