import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CashflowPage } from './pages/CashflowPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { RecordsPage } from './pages/RecordsPage';
import { UsersPage } from './pages/UsersPage';

// Protected route wrapper
const Protected: React.FC<{
  children: React.ReactNode;
  roles?: string[];
}> = ({ children, roles }) => {
  const { isAuthenticated, hasRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.some((r) => hasRole(r))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/cashflow"
          element={
            <Protected roles={['ANALYST', 'ADMIN']}>
              <CashflowPage />
            </Protected>
          }
        />
        <Route
          path="/categories"
          element={
            <Protected roles={['ANALYST', 'ADMIN']}>
              <CategoriesPage />
            </Protected>
          }
        />
        <Route
          path="/anomalies"
          element={
            <Protected roles={['ANALYST', 'ADMIN']}>
              <AnomaliesPage />
            </Protected>
          }
        />
        <Route path="/records" element={<RecordsPage />} />
        <Route
          path="/users"
          element={
            <Protected roles={['ADMIN']}>
              <UsersPage />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
