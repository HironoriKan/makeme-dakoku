import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import { User, ChevronDown } from 'lucide-react';

type UserType = Tables<'users'>;

interface UserSelectorProps {
  selectedUserId: string | null;
  onUserSelect: (userId: string | null) => void;
  placeholder?: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUserId,
  onUserSelect,
  placeholder = "ユーザーを選択してください"
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('display_name', { ascending: true });

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  const handleUserSelect = (userId: string | null) => {
    onUserSelect(userId);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
          <span className="text-gray-500">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <div className="w-full px-4 py-3 bg-red-50 border border-red-300 rounded-lg">
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 mr-3" />
          <span className={selectedUser ? 'text-gray-900' : 'text-gray-500'}>
            {selectedUser ? selectedUser.display_name : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {/* All Users Option */}
            <button
              type="button"
              onClick={() => handleUserSelect(null)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center ${
                !selectedUserId ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <User className="w-4 h-4 mr-3 text-gray-400" />
              <div>
                <div className="font-medium">全ユーザー</div>
                <div className="text-sm text-gray-500">全てのユーザーを表示</div>
              </div>
            </button>

            {/* Individual Users */}
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleUserSelect(user.id)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center ${
                  selectedUserId === user.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                {user.picture_url ? (
                  <img
                    src={user.picture_url}
                    alt={user.display_name}
                    className="w-8 h-8 rounded-full mr-3 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user.display_name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    ID: {user.id.slice(0, 8)}...
                  </div>
                </div>
                {selectedUserId === user.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                )}
              </button>
            ))}

            {users.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-center">
                ユーザーが見つかりません
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserSelector;