import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AppError from '../config/AppError.js';
import logger from '../config/logger.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const registerUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 400);

  const user = await User.create({ name, email, password, role });
  logger.info('Auth', `New user registered: ${user.email}`);
  const token = signToken(user._id);
  return { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    throw new AppError('Invalid email or password', 401);

  const token = signToken(user._id);
  return { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } };
};

export { registerUser, loginUser };
