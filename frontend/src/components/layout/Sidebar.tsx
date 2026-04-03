import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Tag, AlertTriangle,
  FileText, Users, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', roles: ['VIEWER', 'ANALYST', 'ADMIN'] },
  { to: '/cashflow', icon: TrendingUp, label: 'Cash Flow', roles: ['ANALYST', 'ADMIN'] },
  { to: '/categories', icon: Tag, label: 'Categories', roles: ['ANALYST', 'ADMIN'] },
  { to: '/anomalies', icon: AlertTriangle, label: 'Anomalies', roles: ['ANALYST', 'ADMIN'] },
  { to: '/records', icon: FileText, label: 'Transactions', roles: ['VIEWER', 'ANALYST', 'ADMIN'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['ADMIN'] },
];

export const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) =>
    item.roles.some((r) => hasRole(r))
  );

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-surface-1 border-r border-border min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-display font-bold text-xs">Z</span>
          </div>
          <div>
            <p className="font-display font-bold text-sm text-text-primary leading-tight">Zorvyn</p>
            <p className="text-[10px] text-text-muted leading-tight">FinanceOps</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-100 group
              ${isActive
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-accent/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-border">
        <div className="px-3 py-2.5 rounded-lg bg-surface-2 mb-1">
          <p className="text-xs font-medium text-text-primary truncate">{user?.name}</p>
          <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
          <p className="text-[10px] text-accent mt-0.5 font-medium">{user?.roles?.[0]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
};
