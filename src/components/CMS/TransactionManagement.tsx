import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import TimeRecordEditModal from './TimeRecordEditModal';
import { 
  Database, 
  Clock, 
  Calendar, 
  FileText, 
  Users,
  Edit,
  Trash2,
  RefreshCw,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { sanitizeUserName } from '../../utils/textUtils';

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

type TransactionType = 'time_records' | 'shifts' | 'daily_reports';

const TransactionManagement: React.FC = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType>('time_records');
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
  const [expandedTransaction, setExpandedTransaction] = useState<TransactionType>('time_records');

  const transactionTypes = [
    {
      key: 'time_records' as TransactionType,
      label: '旧打刻記録',
      icon: Clock,
      description: '打刻記録の確認・編集ができます',
      color: 'text-blue-600'
    },
    {
      key: 'shifts' as TransactionType,
      label: 'シフト',
      icon: Calendar,
      description: 'シフトの確認・管理ができます',
      color: 'text-green-600'
    },
    {
      key: 'daily_reports' as TransactionType,
      label: '日報',
      icon: FileText,
      description: '日報データを確認できます',
      color: 'text-orange-600'
    }
  ];

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

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setData(prev => ({
        ...prev,
        users: usersData || []
      }));
    } catch (err) {
      console.error('ユーザー取得エラー:', err);
    }
  };

  useEffect(() => {
    fetchData(selectedTransaction);
    fetchUsers();
  }, [selectedTransaction]);

  const handleTransactionSelect = (transactionType: TransactionType) => {
    setSelectedTransaction(transactionType);
    setExpandedTransaction(transactionType);
  };

  const handleTimeRecordEdit = (record: TimeRecord) => {
    setSelectedTimeRecord(record);
    setIsTimeRecordEditOpen(true);
  };

  const handleTimeRecordModalClose = () => {
    setIsTimeRecordEditOpen(false);
    setSelectedTimeRecord(null);
  };

  const handleTimeRecordSave = () => {
    fetchData('time_records');
  };

  const getUserName = (userId: string) => {
    const user = data.users.find(u => u.id === userId);
    return user ? sanitizeUserName(user.display_name) : '不明なユーザー';
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return timeString.slice(0, 5);
  };

  const renderTimeRecordsTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">記録タイプ</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">記録日時</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">拠点</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.time_records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-900">
                {getUserName(record.user_id)}
              </td>
              <td className="px-4 py-2 text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  record.record_type === 'clock_in' ? 'bg-green-100 text-green-800' :
                  record.record_type === 'clock_out' ? 'bg-red-100 text-red-800' :
                  record.record_type === 'break_start' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {record.record_type === 'clock_in' && '出勤'}
                  {record.record_type === 'clock_out' && '退勤'}
                  {record.record_type === 'break_start' && '休憩開始'}
                  {record.record_type === 'break_end' && '休憩終了'}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {formatDateTime(record.recorded_at)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {record.location_name || '-'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                <button
                  onClick={() => handleTimeRecordEdit(record)}
                  className="text-blue-600 hover:text-blue-900 mr-2"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderShiftsTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">シフト日</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">シフトタイプ</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">開始時間</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">終了時間</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メモ</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.shifts.map((shift) => (
            <tr key={shift.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-900">
                {getUserName(shift.user_id)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {shift.shift_date ? new Date(shift.shift_date).toLocaleDateString('ja-JP') : '-'}
              </td>
              <td className="px-4 py-2 text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  shift.shift_type === 'normal' ? 'bg-blue-100 text-blue-800' :
                  shift.shift_type === 'early' ? 'bg-yellow-100 text-yellow-800' :
                  shift.shift_type === 'late' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {shift.shift_type === 'normal' && '通常'}
                  {shift.shift_type === 'early' && '早番'}
                  {shift.shift_type === 'late' && '遅番'}
                  {shift.shift_type === 'off' && '休み'}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {formatTime(shift.start_time)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {formatTime(shift.end_time)}
              </td>
              <td className="px-4 py-2 text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  shift.shift_status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {shift.shift_status === 'confirmed' ? '確定' : '調整中'}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                {shift.note || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDailyReportsTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">報告日</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">売上金額</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客数</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">販売点数</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客単価</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メモ</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.daily_reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-900">
                {getUserName(report.user_id)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {report.report_date ? new Date(report.report_date).toLocaleDateString('ja-JP') : '-'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                ¥{report.sales_amount?.toLocaleString() || '0'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {report.customer_count || 0}人
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {report.items_sold || 0}点
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                ¥{report.customer_unit_price?.toLocaleString() || '0'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                {report.notes || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTable = () => {
    switch (selectedTransaction) {
      case 'time_records':
        return renderTimeRecordsTable();
      case 'shifts':
        return renderShiftsTable();
      case 'daily_reports':
        return renderDailyReportsTable();
      default:
        return null;
    }
  };

  const selectedTransactionData = transactionTypes.find(t => t.key === selectedTransaction);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">トランザクション管理</h1>
          <p className="text-gray-600">打刻記録・シフト・日報データの確認・管理</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Transaction Types */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">データタイプ</h3>
            <div className="space-y-2">
              {transactionTypes.map((transaction) => {
                const Icon = transaction.icon;
                const isSelected = selectedTransaction === transaction.key;
                
                return (
                  <button
                    key={transaction.key}
                    onClick={() => handleTransactionSelect(transaction.key)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : transaction.color}`} />
                        <span className="font-medium">{transaction.label}</span>
                      </div>
                      <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                        {data[transaction.key].length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content - Data Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Content Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    {selectedTransactionData && <selectedTransactionData.icon className={`w-5 h-5 ${selectedTransactionData.color}`} />}
                    <span>{selectedTransactionData?.label}管理</span>
                  </h2>
                  <p className="text-gray-600 mt-1">{selectedTransactionData?.description}</p>
                </div>
                <button
                  onClick={() => fetchData(selectedTransaction)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>更新</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6">
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
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedTransactionData?.label}一覧 ({data[selectedTransaction].length}件)
                    </h3>
                  </div>
                  {data[selectedTransaction].length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {selectedTransactionData?.label}データがありません
                    </div>
                  ) : (
                    renderTable()
                  )}
                </div>
              )}
            </div>
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

export default TransactionManagement;