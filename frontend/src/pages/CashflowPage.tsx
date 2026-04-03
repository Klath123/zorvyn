import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useCashflow } from '../hooks/useApi';
import { Skeleton, ErrorState, PageHeader } from '../components/ui';
import { formatCurrency, formatMonth } from '../lib/format';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="text-text-secondary mb-2 font-medium">{formatMonth(label)}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-3 justify-between mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-text-primary font-mono">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const CashflowPage: React.FC = () => {
  const { data, loading, error, refetch } = useCashflow(6);

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const monthly = data?.monthly ?? [];

  const chartData = monthly.map((m) => ({
    month: m.month,
    Income: m.total_income,
    Expense: m.total_expense,
    Net: m.net,
  }));

  const totalIncome = monthly.reduce((s, m) => s + m.total_income, 0);
  const totalExpense = monthly.reduce((s, m) => s + m.total_expense, 0);
  const netCashflow = totalIncome - totalExpense;
  const deficitMonths = monthly.filter((m) => m.is_deficit).length;

  return (
    <div>
      <PageHeader
        title="Cash Flow"
        subtitle="Monthly income vs expense trends for the last 6 months"
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Income (6mo)', value: formatCurrency(totalIncome), accent: 'text-success' },
          { label: 'Total Expense (6mo)', value: formatCurrency(totalExpense), accent: 'text-danger' },
          { label: 'Net Cash Flow', value: formatCurrency(netCashflow), accent: netCashflow >= 0 ? 'text-success' : 'text-danger' },
          { label: 'Deficit Months', value: deficitMonths.toString(), accent: deficitMonths > 0 ? 'text-warning' : 'text-success' },
        ].map(({ label, value, accent }) =>
          loading ? (
            <Skeleton key={label} className="h-24" />
          ) : (
            <div key={label} className="card">
              <p className="label mb-2">{label}</p>
              <p className={`font-display text-xl font-bold ${accent}`}>{value}</p>
            </div>
          )
        )}
      </div>

      {/* Main chart */}
      <div className="card mb-6">
        <p className="section-title mb-5">Income vs Expense vs Net Cash Flow</p>
        {loading ? (
          <Skeleton className="h-64" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} barGap={4} barCategoryGap="30%">
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
              <Line
                type="monotone"
                dataKey="Net"
                stroke="#4f8ef7"
                strokeWidth={2}
                dot={{ fill: '#4f8ef7', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly breakdown table */}
      <div className="card">
        <p className="section-title mb-4">Monthly Breakdown</p>
        {loading ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Month', 'Income', 'Expense', 'Net', 'Status'].map((h) => (
                    <th key={h} className="text-left pb-3 pr-6 label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthly.map((m) => (
                  <tr key={m.month}>
                    <td className="py-3 pr-6 text-text-primary font-medium">{formatMonth(m.month)}</td>
                    <td className="py-3 pr-6 text-success font-mono">{formatCurrency(m.total_income)}</td>
                    <td className="py-3 pr-6 text-danger font-mono">{formatCurrency(m.total_expense)}</td>
                    <td className={`py-3 pr-6 font-mono font-medium ${m.net >= 0 ? 'text-success' : 'text-danger'}`}>
                      {m.net >= 0 ? '+' : ''}{formatCurrency(m.net)}
                    </td>
                    <td className="py-3">
                      <span className={`badge ${m.is_deficit ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                        {m.is_deficit ? 'Deficit' : 'Surplus'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
