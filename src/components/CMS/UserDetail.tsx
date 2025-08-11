import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import { 
  X, 
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
  Users as UsersIcon
} from 'lucide-react';
import { sanitizeUserName, sanitizeDisplayText } from '../../utils/textUtils';

type User = Tables<'users'>;

type DailyReport = Tables<'daily_reports'>;

interface UserDetailProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

interface UserStats {
  totalReports: number;
  totalSales: number;
  avgSales: number;
  totalCustomers: number;
  avgCustomers: number;
}

const UserDetail: React.FC<UserDetailProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<User>>({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetail();
      fetchUserStats();
      fetchUserReports();
    }
  }, [isOpen, userId]);

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
        
        setUserStats({
          totalReports: data.length,
          totalSales,
          avgSales: totalSales / data.length,
          totalCustomers,
          avgCustomers: totalCustomers / data.length
        });
      } else {
        setUserStats({
          totalReports: 0,
          totalSales: 0,
          avgSales: 0,
          totalCustomers: 0,
          avgCustomers: 0
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
        .order('report_date', { ascending: false })
        .limit(30); // 最新30件

      if (reportsError) throw reportsError;

      setDailyReports(data || []);
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
        updated_at: new Date().toISOString()
      };

      // プロファイルフィールドがサポートされている場合
      if ('address' in editedData) updateData.address = editedData.address || null;
      if ('self_pr' in editedData) updateData.self_pr = editedData.self_pr || null;
      if ('career' in editedData) updateData.career = editedData.career || null;

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // ローカルステートを更新
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">ユーザー詳細</h2>
              <p className="text-sm text-gray-600">プロファイルと実績を確認・編集できます</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading && !user ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        ) : error && !user ? (
          <div className="p-6 bg-red-50 border-b border-red-200">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        ) : user ? (
          <div className="p-6 space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* User Profile Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Profile Picture & Name */}
                  <div className="flex items-center space-x-4">
                    {user.picture_url ? (
                      <img
                        src={user.picture_url}
                        alt={sanitizeUserName(user.display_name)}
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          #{user.employee_number || '---'}
                        </span>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData.display_name || ''}
                          onChange={(e) => handleInputChange('display_name', e.target.value)}
                          className="text-lg font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <h4 className="text-lg font-bold text-gray-900">
                          {sanitizeUserName(user.display_name)}
                        </h4>
                      )}
                    </div>
                  </div>

                  {/* Email */}
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

                  {/* Address */}
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
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Self PR */}
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

                  {/* Career */}
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

            {/* Stats Section */}
            {userStats && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">実績サマリー</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{userStats.totalReports}</div>
                      <div className="text-sm text-gray-600">日報投稿数</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{formatCurrency(userStats.totalSales)}</div>
                      <div className="text-sm text-gray-600">累計売上</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{formatCurrency(Math.round(userStats.avgSales))}</div>
                      <div className="text-sm text-gray-600">平均売上</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                        <UsersIcon className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{Math.round(userStats.avgCustomers)}</div>
                      <div className="text-sm text-gray-600">平均客数</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Reports */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">最近の日報</h3>
              </div>
              <div className="p-6">
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
        ) : null}
      </div>
    </div>
  );
};

export default UserDetail;