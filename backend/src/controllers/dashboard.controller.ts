import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export class DashboardController {
  async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getSummary();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getCashflow(req: Request, res: Response, next: NextFunction) {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await dashboardService.getCashflow(months);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getCategoryBreakdown();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getAnomalies(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getAnomalies();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
