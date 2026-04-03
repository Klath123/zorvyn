import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional().default('VIEWER'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const createRecordSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number.' })
    .positive('Amount must be a positive number greater than 0.'),
  type: z.enum(['INCOME', 'EXPENSE', 'REFUND', 'FEE'], {
    errorMap: () => ({ message: 'Type must be one of: INCOME, EXPENSE, REFUND, FEE.' }),
  }),
  category: z.string().min(1, 'Category is required.').max(100),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date format. Use ISO 8601.'),
  notes: z.string().max(500).optional(),
  status: z.enum(['PENDING', 'SETTLED', 'REVERSED']).optional().default('SETTLED'),
  channel: z.enum(['UPI', 'CARD', 'NETBANKING', 'BANK_TRANSFER']).optional().default('BANK_TRANSFER'),
});

export const updateRecordSchema = createRecordSchema.partial();

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
});
