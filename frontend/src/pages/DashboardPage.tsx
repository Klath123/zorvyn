import React from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, RefreshCw, Zap, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { useSummary, useCashflow } from '../hooks/useApi';
import { StatCard, Skeleton, ErrorState, Badge, PageHeader } from '../components/ui';
import { formatCurrency, formatDate, typeBadgeClass, statusBadgeClass, formatMonth } from '../lib/format';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="text-text-secondary mb-1.5 font-medium">{formatMonth(label)}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 justify-between">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-text-primary font-mono">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { data: summary, loading: sl, error: se } = useSummary();
  const { data: cashflow, loading: cl } = useCashflow(6);

  if (se) return <ErrorState message={se} />;

  const kpis = summary ? [
    {
      label: 'Total Income',
      value: formatCurrency(summary.total_income),
      icon: <TrendingUp className="w-4 h-4" />,
      accent: 'text-success',
    },
    {
      label: 'Total Expense',
      value: formatCurrency(summary.total_expense),
      icon: <TrendingDown className="w-4 h-4" />,
      accent: 'text-danger',
    },
    {
      label: 'Net Balance',
      value: formatCurrency(summary.net_balance),
      icon: <DollarSign className="w-4 h-4" />,
      accent: summary.net_balance >= 0 ? 'text-success' : 'text-danger',
    },
    {
      label: 'Total Refunds',
      value: formatCurrency(summary.total_refunds),
      icon: <RefreshCw className="w-4 h-4" />,
      accent: 'text-warning',
    },
    {
      label: 'Gateway Fees',
      value: formatCurrency(summary.total_fees),
      icon: <Zap className="w-4 h-4" />,
      accent: 'text-text-secondary',
    },
    {
      label: 'Total Transactions',
      value: summary.record_count.toLocaleString(),
      icon: <Activity className="w-4 h-4" />,
      accent: 'text-accent',
    },
  ] : [];

  const chartData = cashflow?.monthly?.map((m) => ({
    month: m.month,
    Income: m.total_income,
    Expense: m.total_expense,
    Net: m.net,
  })) ?? [];

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="High-level financial KPIs for your organisation"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sl
          ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)
          : kpis.map((k) => (
            <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} accent={k.accent} />
          ))
        }
      </div>

      {/* Cash Flow Chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-5">
          <p className="section-title">6-Month Cash Flow</p>
          <span className="text-xs text-text-muted">Income vs Expense</span>
        </div>
        {cl ? (
          <Skeleton className="h-56" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2433" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fill: '#50586a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#50586a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend
                formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>}
                iconType="square"
                iconSize={8}
              />
              <Bar dataKey="Income" fill="#34d399" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Expense" fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title">Recent Activity</p>
          <span className="text-xs text-text-muted">Last 15 transactions</span>
        </div>

        {sl ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {summary?.recent_activities.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-text-primary font-medium truncate capitalize">
                      {tx.category.replace(/_/g, ' ')}
                    </span>
                    <Badge label={tx.type} className={typeBadgeClass[tx.type]} />
                    <Badge label={tx.status} className={statusBadgeClass[tx.status]} />
                  </div>
                  <p className="text-xs text-text-muted truncate">{tx.notes || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-mono font-medium ${
                    tx.type === 'INCOME' ? 'text-success' :
                    tx.type === 'EXPENSE' ? 'text-danger' :
                    tx.type === 'REFUND' ? 'text-warning' : 'text-text-secondary'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[11px] text-text-muted">{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
