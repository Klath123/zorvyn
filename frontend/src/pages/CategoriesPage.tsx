import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useCategories } from '../hooks/useApi';
import { Skeleton, ErrorState, PageHeader } from '../components/ui';
import { formatCurrency } from '../lib/format';

const COLORS = ['#4f8ef7', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#fb923c'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-text-secondary capitalize mb-1">{payload[0]?.payload?.category?.replace(/_/g, ' ')}</p>
      <p className="text-text-primary font-mono font-medium">{formatCurrency(payload[0]?.value)}</p>
    </div>
  );
};

const CategoryBar: React.FC<{ data: Record<string, number>; color: string; title: string }> = ({
  data, color, title,
}) => {
  const entries = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => ({ category: k, amount: v }));

  const total = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title">{title}</p>
        <span className="text-xs text-text-muted font-mono">{formatCurrency(total)} total</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-text-muted text-sm py-4 text-center">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={entries.length * 44 + 20}>
          <BarChart data={entries} layout="vertical" barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2433" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fill: '#50586a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={140}
              tick={{ fill: '#8892a4', fontSize: 11 }}
              tickFormatter={(v) => v.replace(/_/g, ' ')}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]} fill={color}>
              {entries.map((_, idx) => (
                <Cell key={idx} fill={color} fillOpacity={1 - idx * 0.08} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export const CategoriesPage: React.FC = () => {
  const { data, loading, error, refetch } = useCategories();

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const channelData = data?.by_channel?.map((c, i) => ({
    name: c.channel.replace(/_/g, ' '),
    value: c.total_amount,
    count: c.transaction_count,
    fill: COLORS[i % COLORS.length],
  })) ?? [];

  return (
    <div>
      <PageHeader
        title="Category Breakdown"
        subtitle="Income and expense analysis by category"
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <CategoryBar data={data?.incomes_by_category ?? {}} color="#34d399" title="Income by Category" />
            <CategoryBar data={data?.expenses_by_category ?? {}} color="#f87171" title="Expense by Category" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CategoryBar data={data?.refunds_by_category ?? {}} color="#fbbf24" title="Refunds by Category" />
            <CategoryBar data={data?.fees_by_category ?? {}} color="#8892a4" title="Fees by Category" />
          </div>

          {/* Channel distribution */}
          {channelData.length > 0 && (
            <div className="card mt-4">
              <p className="section-title mb-4">Transaction Volume by Payment Channel</p>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ background: '#191d27', border: '1px solid #252a38', borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2.5">
                  {channelData.map((c) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.fill }} />
                        <span className="text-sm text-text-secondary capitalize">{c.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-text-primary">{formatCurrency(c.value)}</p>
                        <p className="text-[10px] text-text-muted">{c.count} txns</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
