import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LocationService, Location } from '../../services/locationService';
import { Tables } from '../../types/supabase';
import { Users, MapPin, Save, X, Check } from 'lucide-react';
import { sanitizeUserName } from '../../utils/textUtils';

type User = Tables<'users'>;

interface UserLocationAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserLocationAccess {
  id: string;
  user_id: string;
  location_id: string;
  created_at: string;
  updated_at: string;
}

const UserLocationAssignment: React.FC<UserLocationAssignmentProps> = ({
  isOpen,
  onClose
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userLocationAccess, setUserLocationAccess] = useState<UserLocationAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [tempAssignments, setTempAssignments] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('display_name', { ascending: true });

      if (usersError) throw usersError;

      // Fetch locations
      const locationsData = await LocationService.getActiveLocations();

      // Fetch user location access from DB
      const { data: accessData, error: accessError } = await supabase
        .from('user_location_access')
        .select('*');

      if (accessError) {
        console.warn('ユーザー拠点アクセス権取得エラー:', accessError);
      }
      
      // Initialize temp assignments with current data
      const assignments: Record<string, string[]> = {};
      usersData?.forEach(user => {
        const userAccess = (accessData || []).filter(access => access.user_id === user.id);
        assignments[user.id] = userAccess.map(access => access.location_id);
      });

      setUsers(usersData || []);
      setLocations(locationsData);
      setUserLocationAccess(accessData || []);
      setTempAssignments(assignments);

      if (usersData && usersData.length > 0) {
        setSelectedUser(usersData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = (userId: string, locationId: string) => {
    setTempAssignments(prev => {
      const userLocations = prev[userId] || [];
      const newLocations = userLocations.includes(locationId)
        ? userLocations.filter(id => id !== locationId)
        : [...userLocations, locationId];
      
      return {
        ...prev,
        [userId]: newLocations
      };
    });
  };

  const handleSaveAssignments = async () => {
    setSaving(true);
    setError(null);

    try {
      // 全ユーザーの拠点アクセス権を更新
      for (const [userId, locationIds] of Object.entries(tempAssignments)) {
        // 既存のアクセス権を削除
        await supabase
          .from('user_location_access')
          .delete()
          .eq('user_id', userId);

        // 新しいアクセス権を挿入
        if (locationIds.length > 0) {
          const insertData = locationIds.map(locationId => ({
            user_id: userId,
            location_id: locationId
          }));

          const { error } = await supabase
            .from('user_location_access')
            .insert(insertData);

          if (error) throw error;
        }
      }
      
      // Show success message
      alert('拠点割り当てを保存しました');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllLocations = (userId: string) => {
    setTempAssignments(prev => ({
      ...prev,
      [userId]: locations.map(loc => loc.id)
    }));
  };

  const handleDeselectAllLocations = (userId: string) => {
    setTempAssignments(prev => ({
      ...prev,
      [userId]: []
    }));
  };

  const getSelectedUser = () => {
    return users.find(user => user.id === selectedUser);
  };

  const getUserLocationCount = (userId: string) => {
    return tempAssignments[userId]?.length || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">ユーザー拠点割り当て</h2>
              <p className="text-sm text-gray-600">ユーザーがアクセス可能な拠点を設定します</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        ) : (
          <div className="flex h-[600px]">
            {/* Users List */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">ユーザー一覧</h3>
              </div>
              <div className="overflow-y-auto h-full">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 ${
                      selectedUser === user.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
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
                          <div className="text-xs text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {getUserLocationCount(user.id)}/{locations.length}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location Assignment */}
            <div className="flex-1">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {sanitizeUserName(getSelectedUser()?.display_name)}の拠点アクセス
                  </h3>
                  {selectedUser && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectAllLocations(selectedUser)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        全選択
                      </button>
                      <button
                        onClick={() => handleDeselectAllLocations(selectedUser)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        全解除
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-b border-red-200">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div className="p-4 space-y-3 overflow-y-auto h-full">
                {selectedUser && locations.map((location) => {
                  const isAssigned = tempAssignments[selectedUser]?.includes(location.id) || false;
                  
                  return (
                    <div
                      key={location.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                        isAssigned
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleLocationToggle(selectedUser, location.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className={`w-5 h-5 ${
                          isAssigned ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900">
                            {location.brand_name && location.store_name 
                              ? `${location.brand_name} ${location.store_name}` 
                              : location.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            コード: {location.code}
                            {location.prefecture && ` • ${location.prefecture}`}
                            {location.address && ` • ${location.address}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!location.is_active && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            無効
                          </span>
                        )}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isAssigned
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isAssigned && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {locations.length === 0 && (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">利用可能な拠点がありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSaveAssignments}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLocationAssignment;