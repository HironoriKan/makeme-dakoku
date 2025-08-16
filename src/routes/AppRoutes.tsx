import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';

// 管理画面のメインレイアウト
import AdminDashboard from '../components/CMS/AdminDashboard';

// 個別ページコンポーネント
import CMSDashboard from '../components/CMSDashboard';
import UsersPage from '../components/CMS/pages/UsersPage';
import ShiftManagementPage from '../components/CMS/pages/ShiftManagementPage';
import TimeRecordsPage from '../components/CMS/pages/TimeRecordsPage';
import LocationManagementPage from '../components/CMS/pages/LocationManagementPage';
import SettingsPage from '../components/CMS/pages/SettingsPage';

const AppRoutes: React.FC = () => {
  const { logout } = useAdmin();

  return (
    <AdminDashboard onLogout={logout}>
      <Routes>
        <Route path="/admin/dashboard" element={<CMSDashboard />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/users/:userId" element={<UsersPage />} />
        <Route path="/admin/shift-management" element={<ShiftManagementPage />} />
        <Route path="/admin/time-records" element={<TimeRecordsPage />} />
        <Route path="/admin/time-records/:recordId" element={<TimeRecordsPage />} />
        <Route path="/admin/location-management" element={<Navigate to="/admin/location-management/permanent" replace />} />
        <Route path="/admin/location-management/:tab" element={<LocationManagementPage />} />
        <Route path="/admin/settings" element={<Navigate to="/admin/settings/attendance_logic" replace />} />
        <Route path="/admin/settings/:subTab" element={<SettingsPage />} />
        
        {/* デフォルトリダイレクト */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminDashboard>
  );
};

export default AppRoutes;