import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import AdminLogin from '../components/CMS/AdminLogin';
import AdminDashboard from '../components/CMS/AdminDashboard';

const AdminPage: React.FC = () => {
  const { isAdminAuthenticated, login, logout } = useAdmin();

  if (!isAdminAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <div className="relative">
      {/* Logout button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
        >
          ログアウト
        </button>
      </div>
      
      <AdminDashboard />
    </div>
  );
};

export default AdminPage;