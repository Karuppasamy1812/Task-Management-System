import logger from '../config/logger.js';
import AppError from '../config/AppError.js';

const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (err.name === 'CastError')
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already taken`, 400);
  }

  if (err.name === 'ValidationError')
    error = new AppError(Object.values(err.errors).map((e) => e.message).join(', '), 400);

  if (err.name === 'TokenExpiredError')
    error = new AppError('Session expired, please log in again', 401);

  if (err.name === 'JsonWebTokenError')
    error = new AppError('Invalid token, please log in again', 401);

  if (error.isOperational) {
    logger.warn('Errors', `${error.statusCode}: ${error.message}`);
    return res.status(error.statusCode).json({ message: error.message });
  }

  logger.error('Errors', `Unexpected error on ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ message: 'Something went wrong, please try again later' });
};

export default errorHandler;
