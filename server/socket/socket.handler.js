import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../config/logger.js';

const initSocketHandler = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      logger.warn('Socket', 'Connection rejected — no token');
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (err) {
      logger.warn('Socket', 'Connection rejected — invalid token');
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket', `${socket.user?.name} connected`);

    socket.on('join-project',  (projectId) => socket.join(`project:${projectId}`));
    socket.on('leave-project', (projectId) => socket.leave(`project:${projectId}`));

    socket.on('task-created', ({ projectId, task }) =>
      socket.to(`project:${projectId}`).emit('task-created', task));

    socket.on('task-updated', ({ projectId, task }) =>
      socket.to(`project:${projectId}`).emit('task-updated', task));

    socket.on('task-deleted', ({ projectId, taskId }) =>
      socket.to(`project:${projectId}`).emit('task-deleted', taskId));

    socket.on('task-moved', ({ projectId, taskId, fromList, toList, order }) =>
      socket.to(`project:${projectId}`).emit('task-moved', { taskId, fromList, toList, order }));

    socket.on('typing', ({ projectId, taskId, userName }) =>
      socket.to(`project:${projectId}`).emit('typing', { taskId, userName }));

    socket.on('disconnect', () => logger.info('Socket', `${socket.user?.name} disconnected`));
  });
};

export default initSocketHandler;
