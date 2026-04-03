import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../utils/schemas';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), authController.register.bind(authController));

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login.bind(authController));

// GET /api/v1/auth/me  (protected)
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
