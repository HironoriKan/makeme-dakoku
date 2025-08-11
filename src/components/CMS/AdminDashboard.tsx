import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import KPIDashboard from './KPIDashboard';
import ShiftManagement from './ShiftManagement';
import LocationManagement from './LocationManagement';
import TimeRecordEditModal from './TimeRecordEditModal';
import { Users } from 'lucide-react';

type User = Tables<'users'>;
type TimeRecord = Tables<'time_records'>;
type Shift = Tables<'shifts'>;
type DailyReport = Tables<'daily_reports'>;

interface TableData {
  users: User[];
  time_records: TimeRecord[];
  shifts: Shift[];
  daily_reports: DailyReport[];
}

type TabType = 'dashboard' | 'shift_management' | 'location_management' | keyof TableData;

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [data, setData] = useState<TableData>({
    users: [],
    time_records: [],
    shifts: [],
    daily_reports: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTimeRecordEditOpen, setIsTimeRecordEditOpen] = useState(false);
  const [selectedTimeRecord, setSelectedTimeRecord] = useState<TimeRecord | null>(null);

  const fetchData = async (table: keyof TableData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: tableData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setData(prev => ({
        ...prev,
        [table]: tableData || []
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'dashboard' && activeTab !== 'shift_management' && activeTab !== 'location_management') {
      fetchData(activeTab);
    }
  }, [activeTab]);

  const handleTimeRecordEdit = (record: TimeRecord) => {
    setSelectedTimeRecord(record);
    setIsTimeRecordEditOpen(true);
  };

  const handleTimeRecordModalClose = () => {
    setIsTimeRecordEditOpen(false);
    setSelectedTimeRecord(null);
  };

  const handleTimeRecordSave = () => {
    // Refresh time records data
    if (activeTab === 'time_records') {
      fetchData('time_records');
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const renderUserTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">従業員番号</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー情報</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LINE ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  #{user.employee_number || '---'}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="flex items-center space-x-3">
                  {user.picture_url ? (
                    <img
                      src={user.picture_url}
                      alt={user.display_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{user.display_name}</div>
                    <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">{user.line_user_id}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{user.email || '-'}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{formatDateTime(user.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTimeRecordTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザーID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">記録タイプ</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">記録時間</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">場所</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">備考</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.time_records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-900 font-mono">{record.user_id.slice(0, 8)}...</td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  record.record_type === 'clock_in' ? 'bg-green-100 text-green-800' :
                  record.record_type === 'clock_out' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {record.record_type}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">{formatDateTime(record.recorded_at)}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{record.location_name || '-'}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{record.note || '-'}</td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <button
                  onClick={() => handleTimeRecordEdit(record)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  編集
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderShiftTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザーID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">シフト日</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">シフトタイプ</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">開始時間</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">終了時間</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.shifts.map((shift) => (
            <tr key={shift.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-900 font-mono">{shift.user_id.slice(0, 8)}...</td>
              <td className="px-4 py-2 text-sm text-gray-900">{shift.shift_date}</td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  shift.shift_type === 'normal' ? 'bg-blue-100 text-blue-800' :
                  shift.shift_type === 'early' ? 'bg-yellow-100 text-yellow-800' :
                  shift.shift_type === 'late' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {shift.shift_type}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  shift.shift_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {shift.shift_status}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">{shift.start_time || '-'}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{shift.end_time || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDailyReportTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザーID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">売上金額</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客数</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品数</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客単価</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.daily_reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-900 font-mono">{report.user_id.slice(0, 8)}...</td>
              <td className="px-4 py-2 text-sm text-gray-900">{report.report_date}</td>
              <td className="px-4 py-2 text-sm text-gray-900">¥{report.sales_amount.toLocaleString()}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{report.customer_count}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{report.items_sold}</td>
              <td className="px-4 py-2 text-sm text-gray-900">¥{report.customer_unit_price.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTable = () => {
    switch (activeTab) {
      case 'users':
        return renderUserTable();
      case 'time_records':
        return renderTimeRecordTable();
      case 'shifts':
        return renderShiftTable();
      case 'daily_reports':
        return renderDailyReportTable();
      default:
        return null;
    }
  };

  const tabLabels = {
    dashboard: 'ダッシュボード',
    shift_management: 'シフト管理',
    location_management: '拠点管理',
    users: 'ユーザー',
    time_records: '打刻記録',
    shifts: 'シフト',
    daily_reports: '日報'
  };

  return (
    <div className="min-h-screen bg-gray-100 flex max-w-screen-2xl mx-auto">
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
            {(Object.keys(tabLabels) as Array<TabType>).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-50 text-blue-700 border-blue-200 border'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{tabLabels[tab]}</span>
                  {tab !== 'dashboard' && tab !== 'shift_management' && tab !== 'location_management' && (
                    <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                      {data[tab as keyof TableData].length}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>メイクミー勤怠 CMS</p>
            <p>管理者ダッシュボード v1.0</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
              <p className="text-gray-600">データベースの内容を確認できます</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className={activeTab === 'dashboard' || activeTab === 'shift_management' || activeTab === 'location_management' ? '' : 'bg-white rounded-lg shadow p-6'}>
            {activeTab === 'dashboard' ? (
              <KPIDashboard />
            ) : activeTab === 'shift_management' ? (
              <ShiftManagement />
            ) : activeTab === 'location_management' ? (
              <LocationManagement />
            ) : (
              <>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">読み込み中...</span>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {tabLabels[activeTab]}一覧
                      </h2>
                      <button
                        onClick={() => fetchData(activeTab as keyof TableData)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        更新
                      </button>
                    </div>
                    {renderTable()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Time Record Edit Modal */}
      <TimeRecordEditModal
        isOpen={isTimeRecordEditOpen}
        onClose={handleTimeRecordModalClose}
        record={selectedTimeRecord}
        onSave={handleTimeRecordSave}
      />
    </div>
  );
};

export default AdminDashboard;