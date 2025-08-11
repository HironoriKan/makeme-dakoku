import React, { useState, useEffect } from 'react';
import { KPIService, KPIData } from '../../services/kpiService';
import { 
  Users, 
  UserCheck, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CheckCircle,
  BarChart3,
  Activity
} from 'lucide-react';

const KPIDashboard: React.FC = () => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchKPIData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await KPIService.getAllKPIData();
      setKpiData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'KPIデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIData();
  }, []);

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !kpiData) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">KPIデータを読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error && !kpiData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
          <button
            onClick={fetchKPIData}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-sm rounded"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KPI ダッシュボード</h2>
          <p className="text-gray-600">
            最終更新: {formatTime(lastUpdated)}
          </p>
        </div>
        <button
          onClick={fetchKPIData}
          disabled={loading}
          className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? '更新中...' : '更新'}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 総ユーザー数 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData?.totalUsers}</p>
            </div>
          </div>
        </div>

        {/* 本日の出勤者数 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">本日の出勤者</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData?.todayAttendance}</p>
            </div>
          </div>
        </div>

        {/* 現在勤務中 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">現在勤務中</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData?.currentlyWorking}</p>
            </div>
          </div>
        </div>

        {/* 本日の売上 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">本日の売上</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(kpiData?.todaySales || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ユーザー平均売上 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ユーザー平均売上</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(kpiData?.avgSalesPerUser || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* 今月のシフト */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Calendar className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今月のシフト</p>
              <p className="text-2xl font-bold text-gray-900">
                {kpiData?.completedShifts} / {kpiData?.totalShifts}
              </p>
            </div>
          </div>
        </div>

        {/* 月次出勤率 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">月次出勤率</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData?.monthlyAttendanceRate}%</p>
            </div>
          </div>
        </div>

        {/* 平均労働時間 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-rose-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">週平均労働時間</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData?.avgWorkingHours}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">最近のアクティビティ</h3>
          </div>
        </div>
        <div className="p-6">
          {kpiData?.recentActivity && kpiData.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {kpiData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user_display_name}
                      </p>
                      <p className="text-sm text-gray-500">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDateTime(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">最近のアクティビティがありません</p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">勤怠状況</h3>
          <p className="text-3xl font-bold">{kpiData?.currentlyWorking}</p>
          <p className="text-blue-100">人が現在勤務中</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">売上状況</h3>
          <p className="text-3xl font-bold">{formatCurrency(kpiData?.todaySales || 0)}</p>
          <p className="text-green-100">本日の売上合計</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">出勤率</h3>
          <p className="text-3xl font-bold">{kpiData?.monthlyAttendanceRate}%</p>
          <p className="text-purple-100">今月の出勤率</p>
        </div>
      </div>
    </div>
  );
};

export default KPIDashboard;