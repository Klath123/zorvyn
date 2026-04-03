import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate, requireAnyRole, requireAnalystOrAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/v1/dashboard/summary  — VIEWER, ANALYST, ADMIN
router.get('/summary', requireAnyRole, dashboardController.getSummary.bind(dashboardController));

// GET /api/v1/dashboard/cashflow  — ANALYST, ADMIN
router.get('/cashflow', requireAnalystOrAdmin, dashboardController.getCashflow.bind(dashboardController));

// GET /api/v1/dashboard/categories  — ANALYST, ADMIN
router.get('/categories', requireAnalystOrAdmin, dashboardController.getCategories.bind(dashboardController));

// GET /api/v1/dashboard/anomalies  — ANALYST, ADMIN
router.get('/anomalies', requireAnalystOrAdmin, dashboardController.getAnomalies.bind(dashboardController));

export default router;
