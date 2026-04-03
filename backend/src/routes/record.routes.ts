import { Router } from 'express';
import { recordController } from '../controllers/record.controller';
import { authenticate, requireAdmin, requireAnyRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRecordSchema, updateRecordSchema } from '../utils/schemas';

const router = Router();

// All record routes require authentication
router.use(authenticate);

// GET /api/v1/records  — VIEWER, ANALYST, ADMIN
router.get('/', requireAnyRole, recordController.getAll.bind(recordController));

// GET /api/v1/records/:id  — VIEWER, ANALYST, ADMIN
router.get('/:id', requireAnyRole, recordController.getById.bind(recordController));

// POST /api/v1/records  — ADMIN only
router.post('/', requireAdmin, validate(createRecordSchema), recordController.create.bind(recordController));

// PUT /api/v1/records/:id  — ADMIN only
router.put('/:id', requireAdmin, validate(updateRecordSchema), recordController.update.bind(recordController));

// DELETE /api/v1/records/:id  — ADMIN only (soft delete)
router.delete('/:id', requireAdmin, recordController.delete.bind(recordController));

export default router;
