import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import AdminLogin from '../components/CMS/AdminLogin';
import AdminDashboard from '../components/CMS/AdminDashboard';

const AdminPage: React.FC = () => {
  const { isAdminAuthenticated, login, logout } = useAdmin();

  if (!isAdminAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return <AdminDashboard onLogout={logout} />;
};

export default AdminPage;