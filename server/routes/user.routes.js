import { Router } from 'express';
import { getAllUsers, getUserById } from '../controllers/user.controller.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

router.get('/', authenticate, getAllUsers);
router.get('/:id', authenticate, getUserById);

export default router;
