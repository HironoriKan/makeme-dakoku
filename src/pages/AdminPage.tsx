import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import AdminLogin from '../components/CMS/AdminLogin';
import AdminDashboard from '../components/CMS/AdminDashboard';

// 個別ページコンポーネント
import CMSDashboard from '../components/CMSDashboard';
import UsersPage from '../components/CMS/pages/UsersPage';
import ShiftManagementPage from '../components/CMS/pages/ShiftManagementPage';
import TimeRecordsPage from '../components/CMS/pages/TimeRecordsPage';
import LocationManagementPage from '../components/CMS/pages/LocationManagementPage';
import SettingsPage from '../components/CMS/pages/SettingsPage';

const AdminPage: React.FC = () => {
  const { isAdminAuthenticated, login, logout } = useAdmin();

  if (!isAdminAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <AdminDashboard onLogout={logout}>
      <Routes>
        <Route path="dashboard" element={<CMSDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:userId" element={<UsersPage />} />
        <Route path="shift-management" element={<ShiftManagementPage />} />
        <Route path="time-records" element={<TimeRecordsPage />} />
        <Route path="time-records/:recordId" element={<TimeRecordsPage />} />
        <Route path="location-management" element={<Navigate to="/admin/location-management/permanent" replace />} />
        <Route path="location-management/:tab" element={<LocationManagementPage />} />
        <Route path="settings" element={<Navigate to="/admin/settings/attendance_logic" replace />} />
        <Route path="settings/:subTab" element={<SettingsPage />} />
        
        {/* デフォルトリダイレクト */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminDashboard>
  );
};

export default AdminPage;