import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import {
  DashboardSummary, CashflowData, CategoryData, AnomalyData,
  FinancialRecord, RecordFilters, User
} from '../types';

function useQuery<T>(url: string, params?: Record<string, unknown>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params });
      setData(res.data.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params), enabled]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export const useSummary = () => useQuery<DashboardSummary>('/dashboard/summary');
export const useCashflow = (months = 6) => useQuery<CashflowData>('/dashboard/cashflow', { months });
export const useCategories = () => useQuery<CategoryData>('/dashboard/categories');
export const useAnomalies = () => useQuery<AnomalyData>('/dashboard/anomalies');

export function useRecords(filters: RecordFilters) {
  const [data, setData] = useState<FinancialRecord[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clean = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
      );
      const res = await api.get('/records', { params: clean });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, meta, loading, error, refetch: fetch };
}

export function useUsers() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setData(res.data.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
