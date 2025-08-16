import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';


interface AdminDashboardProps {
  onLogout?: () => void;
  children?: React.ReactNode;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, children }) => {
  const location = useLocation();

  // 現在のパスからアクティブなタブを決定
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/dashboard')) return 'dashboard';
    if (path.startsWith('/admin/users')) return 'users';
    if (path.startsWith('/admin/shift-management')) return 'shift-management';
    if (path.startsWith('/admin/time-records')) return 'time-records';
    if (path.startsWith('/admin/location-management')) return 'location-management';
    if (path.startsWith('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const activeTab = getCurrentTab();



  const tabConfig = [
    { key: 'dashboard', label: 'ダッシュボード', path: '/admin/dashboard' },
    { key: 'users', label: 'ユーザー', path: '/admin/users' },
    { key: 'shift-management', label: 'シフト管理', path: '/admin/shift-management' },
    { key: 'time-records', label: '打刻管理', path: '/admin/time-records' },
    { key: 'location-management', label: '拠点管理', path: '/admin/location-management' },
    { key: 'settings', label: '各種設定', path: '/admin/settings', subTabs: [
      { key: 'attendance_logic', label: '勤怠ロジック管理', path: '/admin/settings/attendance_logic' },
      { key: 'break_time', label: '休憩時間管理', path: '/admin/settings/break_time' },
      { key: 'transaction', label: 'トランザクション管理', path: '/admin/settings/transaction' }
    ]}
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Sidebar Navigation */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Navigation Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">メニュー</h2>
          <p className="text-sm text-gray-600 mt-1">管理機能を選択してください</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {tabConfig.map((tab) => (
              <div key={tab.key}>
                <Link
                  to={tab.path}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors block ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-700 border-blue-200 border'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{tab.label}</span>
                  </div>
                </Link>
                
                {/* 設定のサブメニュー */}
                {tab.key === 'settings' && activeTab === 'settings' && tab.subTabs && (
                  <div className="ml-4 mt-2 space-y-1">
                    {tab.subTabs.map((subTab) => (
                      <Link
                        key={subTab.key}
                        to={subTab.path}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors block ${
                          location.pathname === subTab.path
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        ∟ {subTab.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </button>
          )}
          
          {/* Version Info */}
          <div className="text-xs text-gray-500 text-center">
            <p>メイクミー勤怠 CMS</p>
            <p>管理者ダッシュボード v1.0</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-screen-2xl mx-auto">
        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;