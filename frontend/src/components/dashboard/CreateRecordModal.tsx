import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../lib/api';
import { Spinner, Select, Input } from '../ui';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  INCOME: ['sales', 'subscription_revenue', 'investor_funding', 'consulting_fees', 'licensing_revenue'],
  EXPENSE: ['salary', 'rent', 'vendor_payment', 'advertising', 'software_subscriptions', 'infrastructure', 'legal_compliance'],
  REFUND: ['customer_refund', 'payment_gateway_refund', 'vendor_refund'],
  FEE: ['payment_gateway_fee', 'bank_fee', 'transaction_fee', 'compliance_fee'],
};

export const CreateRecordModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    amount: '',
    type: 'INCOME',
    category: 'sales',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'SETTLED',
    channel: 'BANK_TRANSFER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'type') next.category = CATEGORIES_BY_TYPE[v]?.[0] || '';
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/records', { ...form, amount: parseFloat(form.amount) });
      onSuccess();
      onClose();
    } catch (err: any) {
      const details = err.response?.data?.details;
      setError(details ? details.map((d: any) => d.message).join(', ') : err.response?.data?.error || 'Failed to create record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-1 border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-text-primary">New Transaction</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="label mb-1.5">Type</p>
              <Select
                value={form.type}
                onChange={(v) => set('type', v)}
                options={[
                  { label: 'Income', value: 'INCOME' },
                  { label: 'Expense', value: 'EXPENSE' },
                  { label: 'Refund', value: 'REFUND' },
                  { label: 'Fee', value: 'FEE' },
                ]}
              />
            </div>
            <div>
              <p className="label mb-1.5">Amount (₹)</p>
              <Input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <p className="label mb-1.5">Category</p>
            <Select
              value={form.category}
              onChange={(v) => set('category', v)}
              options={(CATEGORIES_BY_TYPE[form.type] || []).map((c) => ({
                label: c.replace(/_/g, ' '),
                value: c,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="label mb-1.5">Date</p>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div>
              <p className="label mb-1.5">Status</p>
              <Select
                value={form.status}
                onChange={(v) => set('status', v)}
                options={[
                  { label: 'Settled', value: 'SETTLED' },
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Reversed', value: 'REVERSED' },
                ]}
              />
            </div>
          </div>

          <div>
            <p className="label mb-1.5">Channel</p>
            <Select
              value={form.channel}
              onChange={(v) => set('channel', v)}
              options={[
                { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
                { label: 'UPI', value: 'UPI' },
                { label: 'Card', value: 'CARD' },
                { label: 'Net Banking', value: 'NETBANKING' },
              ]}
            />
          </div>

          <div>
            <p className="label mb-1.5">Notes (optional)</p>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Monthly payroll disbursement"
              rows={2}
              maxLength={500}
              className="input resize-none"
            />
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              <p className="text-danger text-xs">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Spinner size="sm" />}
              {loading ? 'Creating…' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
