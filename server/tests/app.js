import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import authRoutes from '../routes/auth.routes.js';
import projectRoutes from '../routes/project.routes.js';
import taskRoutes from '../routes/task.routes.js';
import userRoutes from '../routes/user.routes.js';
import errorHandler from '../middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use(errorHandler);

export { app, server };
