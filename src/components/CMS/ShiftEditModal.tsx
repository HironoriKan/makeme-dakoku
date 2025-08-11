import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables, Enums } from '../../types/supabase';
import { X, Calendar, Clock, User, Save, Trash2 } from 'lucide-react';

type Shift = Tables<'shifts'>;
type ShiftType = Enums<'shift_type'>;
type ShiftStatus = Enums<'shift_status'>;

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  onSave: () => void;
}

const ShiftEditModal: React.FC<ShiftEditModalProps> = ({
  isOpen,
  onClose,
  shift,
  onSave
}) => {
  const [formData, setFormData] = useState({
    shift_date: '',
    shift_type: 'normal' as ShiftType,
    shift_status: 'adjusting' as ShiftStatus,
    start_time: '',
    end_time: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ display_name: string; picture_url?: string } | null>(null);

  useEffect(() => {
    if (shift && isOpen) {
      setFormData({
        shift_date: shift.shift_date,
        shift_type: shift.shift_type,
        shift_status: shift.shift_status,
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
        note: shift.note || ''
      });
      fetchUserInfo(shift.user_id);
    }
  }, [shift, isOpen]);

  useEffect(() => {
    setError(null);
  }, [formData]);

  const fetchUserInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('display_name, picture_url')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserInfo(data);
    } catch (err) {
      console.error('User info fetch error:', err);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!shift) return;

    setLoading(true);
    setError(null);

    try {
      const shiftData = {
        user_id: shift.user_id,
        shift_date: formData.shift_date,
        shift_type: formData.shift_type,
        shift_status: formData.shift_status,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        note: formData.note || null,
        updated_at: new Date().toISOString()
      };

      if (shift.id) {
        // Update existing shift
        const { error: updateError } = await supabase
          .from('shifts')
          .update(shiftData)
          .eq('id', shift.id);

        if (updateError) throw updateError;
      } else {
        // Create new shift
        const { error: insertError } = await supabase
          .from('shifts')
          .insert([{
            ...shiftData,
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'シフトの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!shift) return;

    if (!window.confirm('このシフトを削除しますか？この操作は取り消せません。')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shift.id);

      if (deleteError) throw deleteError;

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'シフトの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!shift) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ 
          shift_status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', shift.id);

      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, shift_status: 'confirmed' }));
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'シフトの承認に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getShiftTypeLabel = (shiftType: ShiftType) => {
    const labels = {
      normal: '通常',
      early: '早番',
      late: '遅番',
      off: '休み'
    };
    return labels[shiftType] || shiftType;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {shift?.id ? 'シフト編集' : '新規シフト追加'}
              </h2>
              <p className="text-sm text-gray-600">{formatDate(shift.shift_date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          {userInfo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {userInfo.picture_url ? (
                  <img
                    src={userInfo.picture_url}
                    alt={userInfo.display_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{userInfo.display_name}</h3>
                  <p className="text-sm text-gray-600">ユーザー ID: {shift.user_id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付
              </label>
              <input
                type="date"
                value={formData.shift_date}
                onChange={(e) => handleInputChange('shift_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Shift Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                シフトタイプ
              </label>
              <select
                value={formData.shift_type}
                onChange={(e) => handleInputChange('shift_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">通常</option>
                <option value="early">早番</option>
                <option value="late">遅番</option>
                <option value="off">休み</option>
              </select>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始時間
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了時間
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={formData.shift_status}
                onChange={(e) => handleInputChange('shift_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="adjusting">調整中</option>
                <option value="confirmed">承認済み</option>
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="備考を入力（任意）"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              {formData.shift_status === 'adjusting' && (
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  承認
                </button>
              )}
              {shift?.id && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  削除
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftEditModal;