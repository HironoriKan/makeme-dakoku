import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LocationService, Location } from '../../services/locationService';
import { Tables } from '../../types/supabase';
import { X, Save, Clock } from 'lucide-react';

type TimeRecord = Tables<'time_records'>;

interface TimeRecordEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TimeRecord | null;
  onSave: () => void;
}

const TimeRecordEditModal: React.FC<TimeRecordEditModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave
}) => {
  const [formData, setFormData] = useState({
    record_type: 'clock_in' as 'clock_in' | 'clock_out' | 'break_start' | 'break_end',
    recorded_at: '',
    location_id: '',
    location_name: '',
    note: ''
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      if (record) {
        setFormData({
          record_type: record.record_type as any,
          recorded_at: record.recorded_at ? new Date(record.recorded_at).toISOString().slice(0, 16) : '',
          location_id: record.location_id || '',
          location_name: record.location_name || '',
          note: record.note || ''
        });
      }
    }
  }, [isOpen, record]);

  const fetchLocations = async () => {
    try {
      const data = await LocationService.getAllLocations();
      setLocations(data);
    } catch (err) {
      console.error('拠点一覧取得エラー:', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    setFormData(prev => ({
      ...prev,
      location_id: locationId,
      location_name: location ? (location.brand_name && location.store_name 
        ? `${location.brand_name} ${location.store_name}` 
        : location.name) : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        record_type: formData.record_type,
        recorded_at: formData.recorded_at ? new Date(formData.recorded_at).toISOString() : record.recorded_at,
        location_id: formData.location_id || null,
        location_name: formData.location_name || null,
        note: formData.note || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('time_records')
        .update(updateData)
        .eq('id', record.id);

      if (error) throw error;

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!record || !window.confirm('この打刻記録を削除しますか？この操作は取り消せません。')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('time_records')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case 'clock_in': return '出勤';
      case 'clock_out': return '退勤';
      case 'break_start': return '休憩開始';
      case 'break_end': return '休憩終了';
      default: return type;
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">打刻記録編集</h2>
              <p className="text-sm text-gray-600">打刻記録の詳細を編集できます</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
            
            {/* Record Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                記録タイプ
              </label>
              <select
                value={formData.record_type}
                onChange={(e) => handleInputChange('record_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="clock_in">出勤</option>
                <option value="clock_out">退勤</option>
                <option value="break_start">休憩開始</option>
                <option value="break_end">休憩終了</option>
              </select>
            </div>

            {/* Recorded At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                記録時間
              </label>
              <input
                type="datetime-local"
                value={formData.recorded_at}
                onChange={(e) => handleInputChange('recorded_at', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                元の記録時間: {formatDateTime(record.recorded_at)}
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                拠点
              </label>
              <select
                value={formData.location_id}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">拠点を選択</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.brand_name && location.store_name 
                      ? `${location.brand_name} ${location.store_name}` 
                      : location.name}
                    {location.prefecture && ` (${location.prefecture})`}
                  </option>
                ))}
              </select>
              {record.location_name && (
                <p className="mt-1 text-xs text-gray-500">
                  元の拠点: {record.location_name}
                </p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                備考
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="備考を入力（任意）"
              />
            </div>
          </div>

          {/* Original Record Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">元の記録情報</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">タイプ:</span>
                <span className="ml-2 font-medium">{getRecordTypeLabel(record.record_type)}</span>
              </div>
              <div>
                <span className="text-gray-600">記録時間:</span>
                <span className="ml-2 font-medium">{formatDateTime(record.recorded_at)}</span>
              </div>
              <div>
                <span className="text-gray-600">拠点:</span>
                <span className="ml-2 font-medium">{record.location_name || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600">備考:</span>
                <span className="ml-2 font-medium">{record.note || '-'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-red-700 font-medium border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              削除
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeRecordEditModal;