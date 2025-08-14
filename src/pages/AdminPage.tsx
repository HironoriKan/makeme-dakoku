import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import AdminLogin from '../components/CMS/AdminLogin';
import AdminDashboard from '../components/CMS/AdminDashboard';

const AdminPage: React.FC = () => {
  const { isAdminAuthenticated, login, logout } = useAdmin();

  if (!isAdminAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <Routes>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboard onLogout={logout} />} />
      <Route path="users" element={<AdminDashboard onLogout={logout} />} />
      <Route path="users/:userId" element={<AdminDashboard onLogout={logout} />} />
      <Route path="locations" element={<AdminDashboard onLogout={logout} />} />
      <Route path="locations/:locationId" element={<AdminDashboard onLogout={logout} />} />
      <Route path="time-records" element={<AdminDashboard onLogout={logout} />} />
      <Route path="shifts" element={<AdminDashboard onLogout={logout} />} />
      <Route path="settings" element={<AdminDashboard onLogout={logout} />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};;

export default AdminPage;