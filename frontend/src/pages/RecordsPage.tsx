import React, { useState } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import { useRecords } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import {
  Skeleton, ErrorState, PageHeader, Badge, Pagination, Select, Input
} from '../components/ui';
import { formatCurrency, formatDate, typeBadgeClass, statusBadgeClass, channelLabel } from '../lib/format';
import { RecordFilters } from '../types';
import { CreateRecordModal } from '../components/dashboard/CreateRecordModal';

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Refund', value: 'REFUND' },
  { label: 'Fee', value: 'FEE' },
];

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Settled', value: 'SETTLED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Reversed', value: 'REVERSED' },
];

const CHANNEL_OPTIONS = [
  { label: 'All Channels', value: '' },
  { label: 'UPI', value: 'UPI' },
  { label: 'Card', value: 'CARD' },
  { label: 'Net Banking', value: 'NETBANKING' },
  { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
];

export const RecordsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [filters, setFilters] = useState<RecordFilters>({ page: 1, limit: 20 });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { data, meta, loading, error, refetch } = useRecords(filters);

  const setFilter = (key: keyof RecordFilters, value: string | number) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const clearFilters = () => setFilters({ page: 1, limit: 20 });
  const hasActiveFilters = !!(filters.type || filters.status || filters.channel || filters.search || filters.from_date || filters.to_date);

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${meta.total.toLocaleString()} total records`}
        actions={
          <>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-ghost flex items-center gap-1.5 ${hasActiveFilters ? 'text-accent' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
            {isAdmin && (
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                New Record
              </button>
            )}
          </>
        }
      />

      {/* Filters panel */}
      {showFilters && (
        <div className="card mb-5 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <p className="label mb-1.5">Search Notes</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <Input
                  placeholder="Search…"
                  value={filters.search || ''}
                  onChange={(e) => setFilter('search', e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </div>
            <div>
              <p className="label mb-1.5">Type</p>
              <Select
                value={filters.type || ''}
                onChange={(v) => setFilter('type', v)}
                options={TYPE_OPTIONS}
              />
            </div>
            <div>
              <p className="label mb-1.5">Status</p>
              <Select
                value={filters.status || ''}
                onChange={(v) => setFilter('status', v)}
                options={STATUS_OPTIONS}
              />
            </div>
            <div>
              <p className="label mb-1.5">Channel</p>
              <Select
                value={filters.channel || ''}
                onChange={(v) => setFilter('channel', v)}
                options={CHANNEL_OPTIONS}
              />
            </div>
            <div>
              <p className="label mb-1.5">From Date</p>
              <Input
                type="date"
                value={filters.from_date || ''}
                onChange={(e) => setFilter('from_date', e.target.value)}
              />
            </div>
            <div>
              <p className="label mb-1.5">To Date</p>
              <Input
                type="date"
                value={filters.to_date || ''}
                onChange={(e) => setFilter('to_date', e.target.value)}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-text-muted hover:text-danger transition-colors">
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="space-y-3">
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-muted text-sm">No transactions match your filters.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-accent text-sm mt-2 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Category', 'Type', 'Amount', 'Status', 'Channel', 'Date', 'Notes'].map((h) => (
                      <th key={h} className="text-left pb-3 pr-5 label whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="py-3 pr-5 text-text-primary capitalize font-medium whitespace-nowrap">
                        {tx.category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 pr-5 whitespace-nowrap">
                        <Badge label={tx.type} className={typeBadgeClass[tx.type]} />
                      </td>
                      <td className={`py-3 pr-5 font-mono font-medium whitespace-nowrap ${
                        tx.type === 'INCOME' ? 'text-success' :
                        tx.type === 'EXPENSE' ? 'text-danger' :
                        tx.type === 'REFUND' ? 'text-warning' : 'text-text-secondary'
                      }`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 pr-5 whitespace-nowrap">
                        <Badge label={tx.status} className={statusBadgeClass[tx.status]} />
                      </td>
                      <td className="py-3 pr-5 text-text-secondary text-xs whitespace-nowrap">
                        {channelLabel[tx.channel] || tx.channel}
                      </td>
                      <td className="py-3 pr-5 text-text-muted text-xs whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 max-w-[200px]">
                        <span className="text-text-muted text-xs truncate block">{tx.notes || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPage={(p) => setFilters((f) => ({ ...f, page: p }))}
            />
          </>
        )}
      </div>

      {showCreate && <CreateRecordModal onClose={() => setShowCreate(false)} onSuccess={refetch} />}
    </div>
  );
};
