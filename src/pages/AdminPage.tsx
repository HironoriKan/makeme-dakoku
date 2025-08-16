import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import AdminLogin from '../components/CMS/AdminLogin';
import AppRoutes from '../routes/AppRoutes';

const AdminPage: React.FC = () => {
  const { isAdminAuthenticated, login, logout } = useAdmin();

  if (!isAdminAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return <AppRoutes />;
};

export default AdminPage;