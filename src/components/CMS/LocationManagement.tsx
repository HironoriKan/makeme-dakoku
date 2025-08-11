import React, { useState, useEffect } from 'react';
import { LocationService, Location } from '../../services/locationService';
import AddLocationModal from './AddLocationModal';
import UserLocationAssignment from './UserLocationAssignment';
import { MapPin, Plus, Edit3, Trash2, Eye, EyeOff, Save, X, Users } from 'lucide-react';

const LocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editedData, setEditedData] = useState<Partial<Location>>({});

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await LocationService.getAllLocations();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '拠点データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setEditedData({
      name: location.name,
      code: location.code,
      address: location.address || '',
      latitude: location.latitude,
      longitude: location.longitude,
      is_active: location.is_active,
      display_order: location.display_order
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLocation) return;

    try {
      const updatedLocation = await LocationService.updateLocation(
        editingLocation.id,
        editedData
      );
      
      setLocations(prev =>
        prev.map(loc => loc.id === editingLocation.id ? updatedLocation : loc)
      );
      
      setEditingLocation(null);
      setEditedData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : '拠点の更新に失敗しました');
    }
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditedData({});
  };

  const handleToggleActive = async (locationId: string, isActive: boolean) => {
    try {
      const updatedLocation = await LocationService.updateLocation(
        locationId,
        { is_active: !isActive }
      );
      
      setLocations(prev =>
        prev.map(loc => loc.id === locationId ? updatedLocation : loc)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ステータスの変更に失敗しました');
    }
  };

  const handleDelete = async (locationId: string, locationName: string) => {
    if (!window.confirm(`拠点「${locationName}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      await LocationService.deleteLocation(locationId);
      await fetchLocations(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : '拠点の削除に失敗しました');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const handleInputChange = (field: keyof Location, value: string | number | boolean) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MapPin className="w-6 h-6 text-gray-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">拠点管理</h1>
            <p className="text-gray-600">打刻拠点の追加・編集・管理ができます</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsAssignmentModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Users className="w-4 h-4 mr-2" />
            ユーザー割り当て
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            新規拠点追加
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Locations List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            拠点一覧 ({locations.length}件)
          </h2>
        </div>

        {locations.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">登録されている拠点がありません</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              最初の拠点を追加
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    順序
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    拠点名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    拠点コード
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    住所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((location) => (
                  <tr key={location.id} className={`hover:bg-gray-50 ${!location.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingLocation?.id === location.id ? (
                        <input
                          type="number"
                          value={editedData.display_order || 0}
                          onChange={(e) => handleInputChange('display_order', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                        />
                      ) : (
                        location.display_order
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingLocation?.id === location.id ? (
                        <input
                          type="text"
                          value={editedData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingLocation?.id === location.id ? (
                        <input
                          type="text"
                          value={editedData.code || ''}
                          onChange={(e) => handleInputChange('code', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {location.code}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {editingLocation?.id === location.id ? (
                        <input
                          type="text"
                          value={editedData.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="住所（任意）"
                        />
                      ) : (
                        location.address || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          location.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {location.is_active ? '有効' : '無効'}
                        </span>
                        <button
                          onClick={() => handleToggleActive(location.id, location.is_active)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title={location.is_active ? '無効にする' : '有効にする'}
                        >
                          {location.is_active ? (
                            <EyeOff className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(location.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingLocation?.id === location.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="保存"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                            title="キャンセル"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(location)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="編集"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(location.id, location.name)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">拠点の管理</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 拠点の追加・編集・削除</li>
            <li>• 有効/無効の切り替え</li>
            <li>• 表示順序の変更</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">拠点コード</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• 英数字で設定（重複不可）</li>
            <li>• 打刻時の識別に使用</li>
            <li>• 短くて覚えやすいものを推奨</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">表示順序</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• 数値が小さい順に表示</li>
            <li>• ユーザー画面の選択順序</li>
            <li>• よく使う拠点は小さい値に</li>
          </ul>
        </div>
      </div>

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchLocations}
      />

      {/* User Location Assignment Modal */}
      <UserLocationAssignment
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
      />
    </div>
  );
};

export default LocationManagement;