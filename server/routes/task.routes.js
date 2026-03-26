import { Router } from 'express';
import { getProjectTasks, createTask, updateTask, addComment, deleteTask } from '../controllers/task.controller.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.get('/project/:projectId', authenticate, getProjectTasks);
router.post('/', authenticate, authorize('admin', 'contributor'), createTask);
router.put('/:taskId', authenticate, updateTask);
router.post('/:taskId/comments', authenticate, addComment);
router.delete('/:taskId', authenticate, deleteTask);

export default router;
