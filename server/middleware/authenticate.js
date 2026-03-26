import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AppError from '../config/AppError.js';

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next(new AppError('No token provided', 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new AppError('User no longer exists', 401));

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export default authenticate;
