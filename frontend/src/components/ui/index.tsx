import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const cls = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' }[size];
  return <Loader2 className={`${cls} animate-spin text-accent`} />;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-surface-2 rounded-lg ${className}`} />
);

// ─── Error State ──────────────────────────────────────────────────────────────
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message, onRetry,
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
    <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
      <span className="text-danger text-lg">!</span>
    </div>
    <p className="text-text-secondary text-sm">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary text-xs px-3 py-1.5">
        Retry
      </button>
    )}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ message?: string }> = ({
  message = 'No data available.',
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center">
      <span className="text-text-muted text-lg">∅</span>
    </div>
    <p className="text-text-muted text-sm">{message}</p>
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge: React.FC<{ label: string; className?: string }> = ({ label, className = '' }) => (
  <span className={`badge ${className}`}>{label}</span>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  accent?: string;
}> = ({ label, value, sub, icon, trend, accent = 'text-text-primary' }) => (
  <div className="card flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="label">{label}</span>
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-text-secondary">
          {icon}
        </div>
      )}
    </div>
    <div>
      <p className={`stat-value ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
    {trend && (
      <div className={`flex items-center gap-1 text-xs font-medium ${trend.value >= 0 ? 'text-success' : 'text-danger'}`}>
        <span>{trend.value >= 0 ? '↑' : '↓'}</span>
        <span>{Math.abs(trend.value)}%</span>
        <span className="text-text-muted font-normal">{trend.label}</span>
      </div>
    )}
  </div>
);

// ─── Page Header ──────────────────────────────────────────────────────────────
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="font-display text-xl font-bold text-text-primary">{title}</h1>
      {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, options, placeholder, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`input ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`input ${props.className || ''}`} />
);

// ─── Pagination ───────────────────────────────────────────────────────────────
export const Pagination: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}> = ({ page, totalPages, total, limit, onPage }) => {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <p className="text-xs text-text-muted">
        Showing {from}–{to} of {total} records
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="btn-ghost text-xs disabled:opacity-30"
        >
          ← Prev
        </button>
        <span className="px-3 py-1.5 text-xs text-text-secondary">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="btn-ghost text-xs disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
