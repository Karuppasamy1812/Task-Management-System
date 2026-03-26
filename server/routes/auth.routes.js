import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
