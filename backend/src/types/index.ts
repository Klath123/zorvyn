import { Request } from 'express';
import { RoleName } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  email: string;
  roles: RoleName[];
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface RecordFilterQuery extends PaginationQuery {
  from_date?: string;
  to_date?: string;
  type?: string;
  category?: string;
  status?: string;
  channel?: string;
  search?: string;
}
