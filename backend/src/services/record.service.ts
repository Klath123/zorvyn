import { TransactionType, TransactionStatus, PaymentChannel } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/response';

interface CreateRecordInput {
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string;
  status?: TransactionStatus;
  channel?: PaymentChannel;
}

interface RecordFilters {
  from_date?: string;
  to_date?: string;
  type?: string;
  category?: string;
  status?: string;
  channel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class RecordService {
  async create(input: CreateRecordInput) {
    const record = await prisma.financialRecord.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        type: input.type,
        category: input.category,
        date: new Date(input.date),
        notes: input.notes,
        status: input.status || 'SETTLED',
        channel: input.channel || 'BANK_TRANSFER',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return record;
  }

  async findAll(filters: RecordFilters) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // cap at 100
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isDeleted: false,
    };

    if (filters.from_date || filters.to_date) {
      where.date = {
        ...(filters.from_date && { gte: new Date(filters.from_date) }),
        ...(filters.to_date && { lte: new Date(filters.to_date) }),
      };
    }

    if (filters.type) {
      where.type = filters.type.toUpperCase() as TransactionType;
    }

    if (filters.category) {
      where.category = { contains: filters.category };
    }

    if (filters.status) {
      where.status = filters.status.toUpperCase() as TransactionStatus;
    }

    if (filters.channel) {
      where.channel = filters.channel.toUpperCase() as PaymentChannel;
    }

    if (filters.search) {
      where.notes = { contains: filters.search };
    }

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: { id, isDeleted: false },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!record) throw new AppError('Financial record not found.', 404);
    return record;
  }

  async update(id: string, input: Partial<CreateRecordInput>) {
    const existing = await prisma.financialRecord.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) throw new AppError('Financial record not found.', 404);

    const updated = await prisma.financialRecord.update({
      where: { id },
      data: {
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.type && { type: input.type }),
        ...(input.category && { category: input.category }),
        ...(input.date && { date: new Date(input.date) }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.status && { status: input.status }),
        ...(input.channel && { channel: input.channel }),
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return updated;
  }

  async softDelete(id: string) {
    const existing = await prisma.financialRecord.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) throw new AppError('Financial record not found.', 404);

    await prisma.financialRecord.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return { message: 'Record deleted successfully.' };
  }
}

export const recordService = new RecordService();
