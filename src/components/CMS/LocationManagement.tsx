import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { LocationService, Location } from '../../services/locationService';
import AddLocationModal from './AddLocationModal';
import UserLocationAssignment from './UserLocationAssignment';
import LocationDetailPage from './LocationDetailPage';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  Users, 
  GripVertical, 
  Store, 
  Calendar,
  Heart,
  ExternalLink
} from 'lucide-react';

type LocationType = 'makeme' | 'permanent' | 'event';

interface LocationManagementProps {
  defaultTab?: LocationType;
}

const LocationManagement: React.FC<LocationManagementProps> = ({ defaultTab }) => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editedData, setEditedData] = useState<Partial<Location>>({});
  const [activeTab, setActiveTab] = useState<LocationType>(defaultTab || 'permanent');

  // タブ変更時の処理（URLも更新）
  const handleTabChange = (tab: LocationType) => {
    setActiveTab(tab);
    navigate(`/admin/location-management/${tab}`, { replace: true });
  };
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  // defaultTabが変更されたときに、activeTabを更新
  useEffect(() => {
    if (defaultTab && defaultTab !== activeTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, activeTab]);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);

    try {
      const [locationsData, userCountsData] = await Promise.all([
        LocationService.getAllLocations(),
        LocationService.getLocationUserCounts()
      ]);
      setLocations(locationsData);
      setUserCounts(userCountsData);
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
      prefecture: location.prefecture || '',
      brand_name: location.brand_name || '',
      store_name: location.store_name || '',
      address: location.address || '',
      is_active: location.is_active,
      display_order: location.display_order,
      location_type: location.location_type || 'permanent',
      start_date: location.start_date || '',
      end_date: location.end_date || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLocation) return;

    try {
      await LocationService.updateLocation(editingLocation.id, editedData);
      setEditingLocation(null);
      setEditedData({});
      await fetchLocations(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : '拠点の更新に失敗しました');
    }
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditedData({});
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const filteredLocations = getFilteredLocations();
    const reorderedLocations = Array.from(filteredLocations);
    const [reorderedItem] = reorderedLocations.splice(result.source.index, 1);
    reorderedLocations.splice(result.destination.index, 0, reorderedItem);

    // Update display order
    const updates = reorderedLocations.map((location, index) => ({
      id: location.id,
      display_order: index + 1
    }));

    try {
      // Update all locations with new order
      for (const update of updates) {
        await LocationService.updateLocation(update.id, { 
          display_order: update.display_order 
        });
      }
      await fetchLocations(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : '表示順序の更新に失敗しました');
    }
  };

  const handleToggleActive = async (locationId: string, isActive: boolean) => {
    try {
      await LocationService.updateLocation(locationId, { is_active: !isActive });
      await fetchLocations(); // Refresh the list
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const handleInputChange = (field: keyof Location, value: string | number | boolean) => {
    setEditedData(prev => {
      const newData = { ...prev, [field]: value };
      
      // location_typeが'makeme'または'permanent'に変更された場合、日付フィールドをクリア
      if (field === 'location_type' && (value === 'makeme' || value === 'permanent')) {
        newData.start_date = '';
        newData.end_date = '';
      }
      
      return newData;
    });
  };

  const getFilteredLocations = () => {
    return locations.filter(location => 
      (location.location_type || 'permanent') === activeTab
    );
  };

  const getLocationTypeLabel = (type: LocationType) => {
    switch (type) {
      case 'makeme': return 'メイクミー';
      case 'permanent': return '常設展';
      case 'event': return 'イベント';
      default: return 'メイクミー';
    }
  };

  const getLocationTypeIcon = (type: LocationType) => {
    switch (type) {
      case 'makeme': return Heart;
      case 'permanent': return Store;
      case 'event': return Calendar;
      default: return Heart;
    }
  };

  const getLocationTypeBadge = (type: LocationType | null) => {
    const actualType = type || 'permanent';
    const label = getLocationTypeLabel(actualType);
    const colorClass = actualType === 'makeme' 
      ? 'bg-pink-100 text-pink-800'
      : actualType === 'permanent' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {label}
      </span>
    );
  };

  // 拠点詳細ページが選択されている場合
  if (selectedLocationId) {
    return (
      <LocationDetailPage 
        locationId={selectedLocationId}
        onBack={() => setSelectedLocationId(null)}
      />
    );
  }

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

  const filteredLocations = getFilteredLocations();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">拠点管理</h1>
            </div>
            <p className="text-gray-600">打刻拠点の追加・編集・管理ができます</p>
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

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {(['permanent', 'event', 'makeme'] as LocationType[]).map((tab) => {
              const Icon = getLocationTypeIcon(tab);
              const isActive = activeTab === tab;
              const count = locations.filter(l => (l.location_type || 'permanent') === tab).length;
              
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-sm font-medium text-center border-b-2 focus:z-10 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{getLocationTypeLabel(tab)}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Locations List */}
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {getLocationTypeLabel(activeTab)}一覧 ({filteredLocations.length}件)
            </h2>
          </div>

          {filteredLocations.length === 0 ? (
            <div className="p-12 text-center">
              {React.createElement(getLocationTypeIcon(activeTab), {
                className: "w-12 h-12 text-gray-300 mx-auto mb-4"
              })}
              <p className="text-gray-500">
                {getLocationTypeLabel(activeTab)}の拠点がありません
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                最初の拠点を追加
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DragDropContext onDragEnd={handleDragEnd}>
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
                        タイプ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        都道府県
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        配属人数
                      </th>
                      {activeTab === 'event' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            開始日
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            終了日
                          </th>
                        </>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <Droppable droppableId="locations">
                    {(provided) => (
                      <tbody 
                        className="bg-white divide-y divide-gray-200"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {filteredLocations.map((location, index) => (
                          <Draggable key={location.id} draggableId={location.id} index={index}>
                            {(provided, snapshot) => (
                              <tr 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`hover:bg-gray-50 ${!location.is_active ? 'opacity-60' : ''} ${
                                  snapshot.isDragging ? 'shadow-lg bg-blue-50' : ''
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      {...provided.dragHandleProps}
                                      className="cursor-grab hover:bg-gray-100 p-1 rounded"
                                      title="ドラッグして順序を変更"
                                    >
                                      <GripVertical className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <span className="text-sm font-medium text-blue-600">
                                      {index + 1}
                                    </span>
                                  </div>
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
                                    <div className="text-sm font-medium text-gray-900">
                                      {location.brand_name && location.store_name 
                                        ? `${location.brand_name} ${location.store_name}` 
                                        : location.name}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {editingLocation?.id === location.id ? (
                                    <select
                                      value={editedData.location_type || 'permanent'}
                                      onChange={(e) => handleInputChange('location_type', e.target.value as LocationType)}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="permanent">常設展</option>
                                      <option value="event">イベント</option>
                                      <option value="makeme">メイクミー</option>
                                    </select>
                                  ) : (
                                    getLocationTypeBadge(location.location_type)
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {editingLocation?.id === location.id ? (
                                    <input
                                      type="text"
                                      value={editedData.prefecture || ''}
                                      onChange={(e) => handleInputChange('prefecture', e.target.value)}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                      placeholder="都道府県"
                                    />
                                  ) : (
                                    location.prefecture || '-'
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="flex items-center space-x-1">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-blue-600">
                                      {userCounts[location.id] || 0}名
                                    </span>
                                  </div>
                                </td>
                                {activeTab === 'event' && (
                                  <>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      {editingLocation?.id === location.id ? (
                                        <input
                                          type="date"
                                          value={editedData.start_date || ''}
                                          onChange={(e) => handleInputChange('start_date', e.target.value)}
                                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                      ) : (
                                        formatDate(location.start_date)
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      {editingLocation?.id === location.id ? (
                                        <input
                                          type="date"
                                          value={editedData.end_date || ''}
                                          onChange={(e) => handleInputChange('end_date', e.target.value)}
                                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                      ) : (
                                        formatDate(location.end_date)
                                      )}
                                    </td>
                                  </>
                                )}
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
                                  {editingLocation?.id === location.id ? (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={handleSaveEdit}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                        title="保存"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="p-2 text-gray-500 hover:bg-gray-50 rounded transition-colors"
                                        title="キャンセル"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => setSelectedLocationId(location.id)}
                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                        title="詳細"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleEdit(location)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="編集"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(location.id, location.name)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="削除"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </tbody>
                    )}
                  </Droppable>
                </table>
              </DragDropContext>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchLocations}
      />

      <UserLocationAssignment
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
      />
    </div>
  );
};

export default LocationManagement;