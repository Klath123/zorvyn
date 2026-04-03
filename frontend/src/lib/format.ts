export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));

export const formatMonth = (yyyyMm: string): string => {
  const [year, month] = yyyyMm.split('-');
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(
    new Date(parseInt(year), parseInt(month) - 1, 1)
  );
};

export const formatPercent = (value: number): string => `${value > 0 ? '+' : ''}${value}%`;

export const typeColor: Record<string, string> = {
  INCOME: 'text-success',
  EXPENSE: 'text-danger',
  REFUND: 'text-warning',
  FEE: 'text-text-secondary',
};

export const typeBadgeClass: Record<string, string> = {
  INCOME: 'bg-success/10 text-success',
  EXPENSE: 'bg-danger/10 text-danger',
  REFUND: 'bg-warning/10 text-warning',
  FEE: 'bg-text-muted/10 text-text-secondary',
};

export const statusBadgeClass: Record<string, string> = {
  SETTLED: 'bg-success/10 text-success',
  PENDING: 'bg-warning/10 text-warning',
  REVERSED: 'bg-danger/10 text-danger',
};

export const channelLabel: Record<string, string> = {
  UPI: 'UPI',
  CARD: 'Card',
  NETBANKING: 'Net Banking',
  BANK_TRANSFER: 'Bank Transfer',
};

export const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-accent/15 text-accent',
  ANALYST: 'bg-purple-500/15 text-purple-400',
  VIEWER: 'bg-surface-3 text-text-secondary',
};
