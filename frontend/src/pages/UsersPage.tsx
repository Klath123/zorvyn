import React, { useState } from 'react';
import { useUsers } from '../hooks/useApi';
import { Skeleton, ErrorState, PageHeader, Badge } from '../components/ui';
import { formatDate, roleBadgeClass } from '../lib/format';
import { User } from '../types';
import api from '../lib/api';

export const UsersPage: React.FC = () => {
  const { data, loading, error, refetch } = useUsers();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ status?: string; role?: string }>({});
  const [saving, setSaving] = useState(false);

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({ status: user.status, role: user.roles[0] });
  };

  const handleSave = async (userId: string) => {
    setSaving(true);
    try {
      await api.patch(`/users/${userId}`, editForm);
      await refetch();
      setEditingId(null);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage user accounts and role-based access control"
      />

      <div className="card">
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left pb-3 pr-6 label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-2/30 transition-colors">
                    <td className="py-3.5 pr-6 text-text-primary font-medium">{user.name}</td>
                    <td className="py-3.5 pr-6 text-text-secondary text-xs font-mono">{user.email}</td>
                    <td className="py-3.5 pr-6">
                      {editingId === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                          className="input text-xs py-1 w-28"
                        >
                          {['VIEWER', 'ANALYST', 'ADMIN'].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge label={user.roles[0] || '—'} className={roleBadgeClass[user.roles[0]] || ''} />
                      )}
                    </td>
                    <td className="py-3.5 pr-6">
                      {editingId === user.id ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                          className="input text-xs py-1 w-28"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      ) : (
                        <Badge
                          label={user.status}
                          className={user.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}
                        />
                      )}
                    </td>
                    <td className="py-3.5 pr-6 text-text-muted text-xs">{formatDate(user.createdAt)}</td>
                    <td className="py-3.5">
                      {editingId === user.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSave(user.id)}
                            disabled={saving}
                            className="text-xs text-accent hover:underline disabled:opacity-50"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <span className="text-text-muted">·</span>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-text-muted hover:text-text-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-xs text-text-muted hover:text-accent transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RBAC explanation card */}
      <div className="card mt-4">
        <p className="section-title mb-3">Access Control Matrix</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-2 pr-6 label">Permission</th>
                {['VIEWER', 'ANALYST', 'ADMIN'].map((r) => (
                  <th key={r} className="text-center pb-2 pr-4 label">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                { action: 'View dashboard summary', roles: ['VIEWER', 'ANALYST', 'ADMIN'] },
                { action: 'View transactions', roles: ['VIEWER', 'ANALYST', 'ADMIN'] },
                { action: 'View cash flow analytics', roles: ['ANALYST', 'ADMIN'] },
                { action: 'View category breakdown', roles: ['ANALYST', 'ADMIN'] },
                { action: 'View anomaly monitor', roles: ['ANALYST', 'ADMIN'] },
                { action: 'Create / edit transactions', roles: ['ADMIN'] },
                { action: 'Delete transactions (soft)', roles: ['ADMIN'] },
                { action: 'Manage users', roles: ['ADMIN'] },
              ].map(({ action, roles: allowed }) => (
                <tr key={action}>
                  <td className="py-2.5 pr-6 text-text-secondary">{action}</td>
                  {['VIEWER', 'ANALYST', 'ADMIN'].map((r) => (
                    <td key={r} className="py-2.5 pr-4 text-center">
                      {allowed.includes(r) ? (
                        <span className="text-success">✓</span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
