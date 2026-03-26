import { Router } from 'express';
import { getAllProjects, getProject, createProject, updateProject, addMember, addList, archiveProject } from '../controllers/project.controller.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.get('/', authenticate, getAllProjects);
router.post('/', authenticate, createProject);
router.get('/:projectId', authenticate, getProject);
router.put('/:projectId', authenticate, authorize('admin'), updateProject);
router.post('/:projectId/members', authenticate, authorize('admin'), addMember);
router.post('/:projectId/lists', authenticate, authorize('admin', 'contributor'), addList);
router.delete('/:projectId', authenticate, authorize('admin'), archiveProject);

export default router;
