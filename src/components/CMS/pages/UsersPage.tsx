import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Tables } from '../../../types/supabase';
import { Users } from 'lucide-react';
import { sanitizeUserName } from '../../../utils/textUtils';
import UserDetailPage from '../UserDetailPage';

type User = Tables<'users'>;

const UsersPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setUsers(userData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (id: string) => {
    navigate(`/admin/users/${id}`);
  };

  const handleBack = () => {
    navigate('/admin/users');
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ja-JP');
  };

  // ユーザー詳細を表示する場合
  if (userId) {
    return <UserDetailPage userId={userId} onBack={handleBack} />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ユーザー管理
        </h1>
        <p className="text-gray-600">
          ユーザーの情報を確認・管理できます
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          ユーザー一覧 ({users.length}件)
        </h2>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '更新中...' : '更新'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      ) : (
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleUserClick(user.id)}>
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
                          alt={sanitizeUserName(user.display_name)}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{sanitizeUserName(user.display_name)}</div>
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

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">ユーザーが見つかりませんでした</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsersPage;