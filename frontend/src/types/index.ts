export type RoleName = 'VIEWER' | 'ANALYST' | 'ADMIN';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'REFUND' | 'FEE';
export type TransactionStatus = 'PENDING' | 'SETTLED' | 'REVERSED';
export type PaymentChannel = 'UPI' | 'CARD' | 'NETBANKING' | 'BANK_TRANSFER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roles: RoleName[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuthState {
  user: { id: string; email: string; name: string; roles: RoleName[] } | null;
  token: string | null;
}

export interface FinancialRecord {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string;
  status: TransactionStatus;
  channel: PaymentChannel;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string };
}

export interface DashboardSummary {
  total_income: number;
  total_expense: number;
  total_refunds: number;
  total_fees: number;
  net_balance: number;
  record_count: number;
  active_categories: string[];
  recent_activities: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string;
  status: TransactionStatus;
  channel: PaymentChannel;
}

export interface CashflowMonth {
  month: string;
  total_income: number;
  total_expense: number;
  net: number;
  is_deficit: boolean;
}

export interface CashflowWeek {
  week: string;
  total_income: number;
  total_expense: number;
  net: number;
}

export interface CashflowData {
  monthly: CashflowMonth[];
  weekly: CashflowWeek[];
}

export interface CategoryData {
  incomes_by_category: Record<string, number>;
  expenses_by_category: Record<string, number>;
  refunds_by_category: Record<string, number>;
  fees_by_category: Record<string, number>;
  by_channel: { channel: string; total_amount: number; transaction_count: number }[];
}

export interface AnomalyData {
  high_amount_transactions: FinancialRecord[];
  expense_spike: {
    prev_month_expense: number;
    current_month_expense: number;
    change_percentage: number;
    is_spike: boolean;
  };
  refund_analysis: {
    total_refunds: number;
    total_income: number;
    refund_rate_percent: number;
    is_high_refund_rate: boolean;
  };
  reversed_transactions: FinancialRecord[];
  anomaly_count: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export interface RecordFilters {
  page?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
  type?: string;
  category?: string;
  status?: string;
  channel?: string;
  search?: string;
}
