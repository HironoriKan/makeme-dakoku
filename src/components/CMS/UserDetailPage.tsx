import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import { 
  ArrowLeft,
  Edit3, 
  Save, 
  User, 
  Mail, 
  MapPin, 
  Award, 
  Briefcase,
  Calendar,
  TrendingUp,
  DollarSign,
  Users as UsersIcon,
  BarChart3,
  ShoppingCart,
  Target
} from 'lucide-react';
import { sanitizeUserName, sanitizeDisplayText } from '../../utils/textUtils';

type User = Tables<'users'>;
type DailyReport = Tables<'daily_reports'>;

interface UserDetailPageProps {
  userId: string;
  onBack: () => void;
}

interface UserStats {
  totalReports: number;
  totalSales: number;
  avgSales: number;
  totalCustomers: number;
  avgCustomers: number;
  totalItemsSold: number;
  avgItemsSold: number;
  avgUnitPrice: number;
}

interface DailyReportGraphData {
  date: string;
  sales: number;
  customers: number;
  unitPrice: number;
  itemsSold: number;
  formattedDate: string;
}

const UserDetailPage: React.FC<UserDetailPageProps> = ({
  userId,
  onBack
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [graphData, setGraphData] = useState<DailyReportGraphData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<User>>({});
  const [graphMode, setGraphMode] = useState<'sales' | 'customers' | 'unitPrice' | 'itemsSold'>('sales');

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
      fetchUserStats();
      fetchUserReports();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      setUser(data);
      setEditedData({
        display_name: data.display_name,
        email: data.email || '',
        address: data.address || '',
        self_pr: data.self_pr || '',
        career: data.career || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!userId) return;

    try {
      const { data, error: statsError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId);

      if (statsError) throw statsError;

      if (data && data.length > 0) {
        const totalSales = data.reduce((sum, report) => sum + report.sales_amount, 0);
        const totalCustomers = data.reduce((sum, report) => sum + report.customer_count, 0);
        const totalItemsSold = data.reduce((sum, report) => sum + report.items_sold, 0);
        const totalUnitPrice = data.reduce((sum, report) => sum + (report.customer_unit_price || 0), 0);
        
        setUserStats({
          totalReports: data.length,
          totalSales,
          avgSales: totalSales / data.length,
          totalCustomers,
          avgCustomers: totalCustomers / data.length,
          totalItemsSold,
          avgItemsSold: totalItemsSold / data.length,
          avgUnitPrice: totalUnitPrice / data.length
        });
      } else {
        setUserStats({
          totalReports: 0,
          totalSales: 0,
          avgSales: 0,
          totalCustomers: 0,
          avgCustomers: 0,
          totalItemsSold: 0,
          avgItemsSold: 0,
          avgUnitPrice: 0
        });
      }
    } catch (err) {
      console.warn('統計データの取得に失敗しました:', err);
    }
  };

  const fetchUserReports = async () => {
    if (!userId) return;

    try {
      const { data, error: reportsError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId)
        .order('report_date', { ascending: true });

      if (reportsError) throw reportsError;

      setDailyReports(data || []);
      
      // グラフデータを準備
      if (data && data.length > 0) {
        const graphData = data.map(report => ({
          date: report.report_date,
          sales: report.sales_amount,
          customers: report.customer_count,
          unitPrice: report.customer_unit_price || 0,
          itemsSold: report.items_sold,
          formattedDate: new Date(report.report_date).toLocaleDateString('ja-JP', {
            month: 'short',
            day: 'numeric'
          })
        }));
        setGraphData(graphData);
      }
    } catch (err) {
      console.warn('日報データの取得に失敗しました:', err);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const updateData: Record<string, any> = {
        display_name: editedData.display_name,
        email: editedData.email || null,
        address: editedData.address || null,
        self_pr: editedData.self_pr || null,
        career: editedData.career || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUser(prev => prev ? { ...prev, ...updateData } : null);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  // iOS ヘルスケア風のグラフコンポーネント
  const HealthKitStyleGraph = () => {
    if (graphData.length === 0) return null;

    const getCurrentValue = (d: DailyReportGraphData) => {
      switch (graphMode) {
        case 'sales': return d.sales;
        case 'customers': return d.customers;
        case 'unitPrice': return d.unitPrice;
        case 'itemsSold': return d.itemsSold;
        default: return d.sales;
      }
    };

    const maxValue = Math.max(...graphData.map(getCurrentValue));
    const minValue = Math.min(...graphData.map(getCurrentValue));
    const range = maxValue - minValue || 1;

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              graphMode === 'sales' ? 'bg-blue-100' :
              graphMode === 'customers' ? 'bg-green-100' :
              graphMode === 'unitPrice' ? 'bg-purple-100' :
              'bg-orange-100'
            }`}>
              {graphMode === 'sales' && <DollarSign className="w-5 h-5 text-blue-600" />}
              {graphMode === 'customers' && <UsersIcon className="w-5 h-5 text-green-600" />}
              {graphMode === 'unitPrice' && <Target className="w-5 h-5 text-purple-600" />}
              {graphMode === 'itemsSold' && <ShoppingCart className="w-5 h-5 text-orange-600" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {graphMode === 'sales' && '売上推移'}
                {graphMode === 'customers' && '客数推移'}
                {graphMode === 'unitPrice' && '客単価推移'}
                {graphMode === 'itemsSold' && '販売個数推移'}
              </h3>
              <p className="text-sm text-gray-600">過去30日間</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setGraphMode('sales')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                graphMode === 'sales' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              売上
            </button>
            <button
              onClick={() => setGraphMode('customers')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                graphMode === 'customers' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              客数
            </button>
            <button
              onClick={() => setGraphMode('unitPrice')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                graphMode === 'unitPrice' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              客単価
            </button>
            <button
              onClick={() => setGraphMode('itemsSold')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                graphMode === 'itemsSold' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              販売個数
            </button>
          </div>
        </div>

        {/* グラフエリア */}
        <div className="h-64 relative">
          <div className="absolute inset-0 flex items-end space-x-1">
            {graphData.map((data, index) => {
              const value = getCurrentValue(data);
              const height = ((value - minValue) / range) * 100;
              const barColor = 
                graphMode === 'sales' ? 'bg-blue-500' :
                graphMode === 'customers' ? 'bg-green-500' :
                graphMode === 'unitPrice' ? 'bg-purple-500' :
                'bg-orange-500';
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex justify-center mb-1">
                    <div
                      className={`w-3/4 ${barColor} rounded-t-sm transition-all duration-300 hover:opacity-80 relative group`}
                      style={{ height: `${height || 2}%` }}
                    >
                      {/* ツールチップ */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {graphMode === 'sales' && formatCurrency(data.sales)}
                          {graphMode === 'customers' && `${data.customers}人`}
                          {graphMode === 'unitPrice' && formatCurrency(data.unitPrice)}
                          {graphMode === 'itemsSold' && `${data.itemsSold}個`}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 transform rotate-45 origin-center">
                    {data.formattedDate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              graphMode === 'sales' ? 'text-blue-600' :
              graphMode === 'customers' ? 'text-green-600' :
              graphMode === 'unitPrice' ? 'text-purple-600' :
              'text-orange-600'
            }`}>
              {graphMode === 'sales' && formatCurrency(graphData.reduce((sum, d) => sum + d.sales, 0))}
              {graphMode === 'customers' && `${graphData.reduce((sum, d) => sum + d.customers, 0)}人`}
              {graphMode === 'unitPrice' && formatCurrency(graphData.reduce((sum, d) => sum + d.unitPrice, 0))}
              {graphMode === 'itemsSold' && `${graphData.reduce((sum, d) => sum + d.itemsSold, 0)}個`}
            </div>
            <div className="text-sm text-gray-600">合計</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              graphMode === 'sales' ? 'text-blue-600' :
              graphMode === 'customers' ? 'text-green-600' :
              graphMode === 'unitPrice' ? 'text-purple-600' :
              'text-orange-600'
            }`}>
              {graphMode === 'sales' && formatCurrency(Math.round(graphData.reduce((sum, d) => sum + d.sales, 0) / graphData.length))}
              {graphMode === 'customers' && `${Math.round(graphData.reduce((sum, d) => sum + d.customers, 0) / graphData.length)}人`}
              {graphMode === 'unitPrice' && formatCurrency(Math.round(graphData.reduce((sum, d) => sum + d.unitPrice, 0) / graphData.length))}
              {graphMode === 'itemsSold' && `${Math.round(graphData.reduce((sum, d) => sum + d.itemsSold, 0) / graphData.length)}個`}
            </div>
            <div className="text-sm text-gray-600">平均</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              graphMode === 'sales' ? 'text-blue-600' :
              graphMode === 'customers' ? 'text-green-600' :
              graphMode === 'unitPrice' ? 'text-purple-600' :
              'text-orange-600'
            }`}>
              {graphMode === 'sales' && formatCurrency(maxValue)}
              {graphMode === 'customers' && `${maxValue}人`}
              {graphMode === 'unitPrice' && formatCurrency(maxValue)}
              {graphMode === 'itemsSold' && `${maxValue}個`}
            </div>
            <div className="text-sm text-gray-600">最大</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">ユーザーが見つかりません</div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ユーザー詳細</h1>
                <p className="text-sm text-gray-600">プロファイルと実績を確認・編集</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? '保存中...' : '保存'}
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  編集
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左カラム: プロファイル */}
          <div className="lg:col-span-1 space-y-6">
            {/* ユーザー基本情報 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                {user.picture_url ? (
                  <img
                    src={user.picture_url}
                    alt={sanitizeUserName(user.display_name)}
                    className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      #{user.employee_number || '---'}
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.display_name || ''}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      className="text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-3 py-2 text-center"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900">
                      {sanitizeUserName(user.display_name)}
                    </h2>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* メール */}
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="example@company.com"
                      />
                    ) : (
                      <p className="text-gray-900">{user.email || '未設定'}</p>
                    )}
                  </div>
                </div>

                {/* 住所 */}
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      住所
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={2}
                        placeholder="住所を入力してください"
                      />
                    ) : (
                      <p className="text-gray-900">{user.address || '未設定'}</p>
                    )}
                  </div>
                </div>

                {/* 自己PR */}
                <div className="flex items-start space-x-3">
                  <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      自己PR
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedData.self_pr || ''}
                        onChange={(e) => handleInputChange('self_pr', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="自己PRを入力してください"
                      />
                    ) : (
                      <p className="text-gray-900">{sanitizeDisplayText(user.self_pr) || '未設定'}</p>
                    )}
                  </div>
                </div>

                {/* 経歴 */}
                <div className="flex items-start space-x-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      経歴・職歴
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedData.career || ''}
                        onChange={(e) => handleInputChange('career', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="経歴や職歴を入力してください"
                      />
                    ) : (
                      <p className="text-gray-900">{sanitizeDisplayText(user.career) || '未設定'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 右カラム: グラフと日報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* iOS風グラフ */}
            <HealthKitStyleGraph />

            {/* 最近の日報 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近の日報</h3>
              {dailyReports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          日付
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          売上金額
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          客数
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          客単価
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          販売個数
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyReports.slice(0, 10).map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatDate(report.report_date)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatCurrency(report.sales_amount)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {report.customer_count}人
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatCurrency(report.customer_unit_price || 0)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {report.items_sold}個
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">日報データがありません</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;