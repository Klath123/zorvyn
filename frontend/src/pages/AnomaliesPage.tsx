import React from 'react';
import { AlertTriangle, TrendingUp, RefreshCw, ArrowLeftRight, ShieldAlert } from 'lucide-react';
import { useAnomalies } from '../hooks/useApi';
import { Skeleton, ErrorState, PageHeader, Badge } from '../components/ui';
import { formatCurrency, formatDate, typeBadgeClass } from '../lib/format';

export const AnomaliesPage: React.FC = () => {
  const { data, loading, error, refetch } = useAnomalies();

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const spike = data?.expense_spike;
  const refundAnalysis = data?.refund_analysis;

  return (
    <div>
      <PageHeader
        title="Anomaly Monitor"
        subtitle="Zorvyn-style fraud-monitoring-lite — flags unusual patterns in your financial data"
        actions={
          data && (
            <div className={`badge ${data.anomaly_count > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
              <ShieldAlert className="w-3 h-3" />
              {data.anomaly_count} {data.anomaly_count === 1 ? 'anomaly' : 'anomalies'} detected
            </div>
          )
        }
      />

      {/* Alert cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Expense spike */}
        <div className={`card border ${spike?.is_spike ? 'border-danger/30 bg-danger/5' : 'border-border'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${spike?.is_spike ? 'bg-danger/15' : 'bg-surface-2'}`}>
              <TrendingUp className={`w-4 h-4 ${spike?.is_spike ? 'text-danger' : 'text-text-muted'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="section-title text-sm">Expense Spike Detection</p>
                {spike?.is_spike && <Badge label="SPIKE" className="bg-danger/15 text-danger" />}
              </div>
              {loading ? <Skeleton className="h-16" /> : spike ? (
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Previous month</span>
                    <span className="font-mono text-text-primary">{formatCurrency(spike.prev_month_expense)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Current month</span>
                    <span className="font-mono text-text-primary">{formatCurrency(spike.current_month_expense)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-1 border-t border-border">
                    <span className="text-text-secondary">Change</span>
                    <span className={`font-mono ${spike.change_percentage > 30 ? 'text-danger' : spike.change_percentage > 0 ? 'text-warning' : 'text-success'}`}>
                      {spike.change_percentage > 0 ? '+' : ''}{spike.change_percentage}%
                    </span>
                  </div>
                  {spike.is_spike && (
                    <p className="text-xs text-danger/80 mt-1 pt-1 border-t border-danger/10">
                      ⚠ Expense increased by &gt;30% compared to last month. Manual review recommended.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Refund analysis */}
        <div className={`card border ${refundAnalysis?.is_high_refund_rate ? 'border-warning/30 bg-warning/5' : 'border-border'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${refundAnalysis?.is_high_refund_rate ? 'bg-warning/15' : 'bg-surface-2'}`}>
              <RefreshCw className={`w-4 h-4 ${refundAnalysis?.is_high_refund_rate ? 'text-warning' : 'text-text-muted'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="section-title text-sm">Refund Rate Analysis</p>
                {refundAnalysis?.is_high_refund_rate && <Badge label="HIGH" className="bg-warning/15 text-warning" />}
              </div>
              {loading ? <Skeleton className="h-16" /> : refundAnalysis ? (
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Total income</span>
                    <span className="font-mono text-text-primary">{formatCurrency(refundAnalysis.total_income)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Total refunds</span>
                    <span className="font-mono text-warning">{formatCurrency(refundAnalysis.total_refunds)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-1 border-t border-border">
                    <span className="text-text-secondary">Refund rate</span>
                    <span className={`font-mono ${refundAnalysis.refund_rate_percent > 5 ? 'text-warning' : 'text-success'}`}>
                      {refundAnalysis.refund_rate_percent}%
                    </span>
                  </div>
                  {refundAnalysis.is_high_refund_rate && (
                    <p className="text-xs text-warning/80 mt-1 pt-1 border-t border-warning/10">
                      ⚠ Refund rate exceeds 5% threshold. Consider reviewing payment flows.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* High-amount transactions */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <p className="section-title">High-Value Transactions (P90)</p>
          <span className="text-xs text-text-muted ml-auto">Transactions above 90th percentile by amount</span>
        </div>
        {loading ? (
          <Skeleton className="h-48" />
        ) : !data?.high_amount_transactions?.length ? (
          <p className="text-text-muted text-sm py-4 text-center">No high-value transactions flagged.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Category', 'Type', 'Channel', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left pb-3 pr-5 label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.high_amount_transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-surface-2/50">
                    <td className="py-3 pr-5 text-text-primary capitalize">{tx.category.replace(/_/g, ' ')}</td>
                    <td className="py-3 pr-5"><Badge label={tx.type} className={typeBadgeClass[tx.type]} /></td>
                    <td className="py-3 pr-5 text-text-secondary text-xs">{tx.channel?.replace(/_/g, ' ')}</td>
                    <td className="py-3 pr-5 font-mono font-medium text-warning">{formatCurrency(tx.amount)}</td>
                    <td className="py-3 pr-5">
                      <span className={`badge text-xs ${tx.status === 'REVERSED' ? 'bg-danger/10 text-danger' : tx.status === 'PENDING' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-text-muted text-xs">{formatDate(tx.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reversed transactions */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight className="w-4 h-4 text-danger" />
          <p className="section-title">Reversed Transactions</p>
        </div>
        {loading ? (
          <Skeleton className="h-32" />
        ) : !data?.reversed_transactions?.length ? (
          <p className="text-text-muted text-sm py-4 text-center">No reversed transactions found.</p>
        ) : (
          <div className="divide-y divide-border">
            {data.reversed_transactions.map((tx: any) => (
              <div key={tx.id} className="py-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-text-primary capitalize">{tx.category.replace(/_/g, ' ')}</span>
                    <Badge label={tx.type} className={typeBadgeClass[tx.type]} />
                  </div>
                  <p className="text-xs text-text-muted">{tx.notes || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-danger font-medium">{formatCurrency(tx.amount)}</p>
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
