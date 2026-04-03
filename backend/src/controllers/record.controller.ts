import { Response, NextFunction } from 'express';
import { recordService } from '../services/record.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class RecordController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const record = await recordService.create({ ...req.body, userId });
      return sendSuccess(res, record, 201);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        type: req.query.type as string,
        category: req.query.category as string,
        status: req.query.status as string,
        channel: req.query.channel as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await recordService.findAll(filters);
      return sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await recordService.findById(req.params.id);
      return sendSuccess(res, record);
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await recordService.update(req.params.id, req.body);
      return sendSuccess(res, record);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await recordService.softDelete(req.params.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const recordController = new RecordController();
