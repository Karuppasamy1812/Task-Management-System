import { registerUser, loginUser } from '../services/auth.service.js';
import catchAsync from '../middleware/catchAsync.js';

const register = catchAsync(async (req, res) => {
  const result = await registerUser(req.body);
  res.status(201).json(result);
});

const login = catchAsync(async (req, res) => {
  const result = await loginUser(req.body);
  res.json(result);
});

const getMe = (req, res) => res.json(req.user);

const logout = (req, res) => res.json({ message: 'Logged out successfully' });

export { register, login, getMe, logout };
