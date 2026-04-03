import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateUserSchema } from '../utils/schemas';

const router = Router();

// All user management routes require authentication + ADMIN role
router.use(authenticate, requireAdmin);

// GET /api/v1/users
router.get('/', userController.getAll.bind(userController));

// GET /api/v1/users/:id
router.get('/:id', userController.getById.bind(userController));

// PATCH /api/v1/users/:id
router.patch('/:id', validate(updateUserSchema), userController.update.bind(userController));

export default router;
