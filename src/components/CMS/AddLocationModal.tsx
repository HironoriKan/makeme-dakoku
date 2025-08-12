import React, { useState } from 'react';
import { LocationService } from '../../services/locationService';
import { X, Save, MapPin, Store, Calendar, Heart } from 'lucide-react';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    prefecture: '',
    brand_name: '',
    store_name: '',
    address: '',
    is_active: true,
    location_type: 'makeme' as 'makeme' | 'permanent' | 'event',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = '拠点名は必須です';
    }

    if (!formData.code.trim()) {
      errors.code = '拠点コードは必須です';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.code)) {
      errors.code = '拠点コードは英数字、ハイフン、アンダースコアのみ使用可能です';
    }

    // イベントには開始日と終了日が必要
    if (formData.location_type === 'event') {
      if (!formData.start_date) {
        errors.start_date = 'イベントには開始日が必須です';
      }
      if (!formData.end_date) {
        errors.end_date = 'イベントには終了日が必須です';
      }
      if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
        errors.end_date = '終了日は開始日以降の日付を指定してください';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check for duplicate code
      const isDuplicate = await LocationService.checkCodeDuplicate(formData.code);
      if (isDuplicate) {
        setValidationErrors({ code: 'この拠点コードは既に使用されています' });
        setLoading(false);
        return;
      }

      // Create location
      await LocationService.createLocation({
        name: formData.name.trim(),
        code: formData.code.trim(),
        prefecture: formData.prefecture.trim() || undefined,
        brand_name: formData.brand_name.trim() || undefined,
        store_name: formData.store_name.trim() || undefined,
        address: formData.address.trim() || undefined,
        is_active: formData.is_active,
        location_type: formData.location_type,
        start_date: formData.location_type === 'event' && formData.start_date ? formData.start_date : undefined,
        end_date: formData.location_type === 'event' && formData.end_date ? formData.end_date : undefined
      });

      // Reset form
      setFormData({
        name: '',
        code: '',
        prefecture: '',
        brand_name: '',
        store_name: '',
        address: '',
        is_active: true,
        location_type: 'makeme',
        start_date: '',
        end_date: ''
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '拠点の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        code: '',
        prefecture: '',
        brand_name: '',
        store_name: '',
        address: '',
        is_active: true,
        location_type: 'makeme',
        start_date: '',
        end_date: ''
      });
      setError(null);
      setValidationErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">新規拠点追加</h2>
              <p className="text-sm text-gray-600">新しい打刻拠点を登録します</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
            
            {/* Location Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                拠点名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例: 本社"
                maxLength={100}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Location Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                拠点コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.code ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例: HQ"
                maxLength={20}
              />
              <p className="mt-1 text-xs text-gray-500">
                英数字、ハイフン、アンダースコアのみ使用可能。重複不可。
              </p>
              {validationErrors.code && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>
              )}
            </div>

            {/* Prefecture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                都道府県
              </label>
              <input
                type="text"
                value={formData.prefecture}
                onChange={(e) => handleInputChange('prefecture', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: 東京都"
                maxLength={50}
              />
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ブランド名
              </label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => handleInputChange('brand_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: メイクミー"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">
                ユーザー側に表示されます
              </p>
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                店舗名
              </label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => handleInputChange('store_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: 渋谷店"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">
                ユーザー側に表示されます
              </p>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住所（任意）
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: 東京都渋谷区..."
                maxLength={255}
              />
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                拠点タイプ <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="location_type"
                    value="makeme"
                    checked={formData.location_type === 'makeme'}
                    onChange={(e) => handleInputChange('location_type', e.target.value)}
                    className="mr-3 text-pink-600"
                  />
                  <Heart className="w-5 h-5 text-pink-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">メイクミー</div>
                    <div className="text-sm text-gray-600">メイクミー拠点</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="location_type"
                    value="permanent"
                    checked={formData.location_type === 'permanent'}
                    onChange={(e) => handleInputChange('location_type', e.target.value)}
                    className="mr-3 text-blue-600"
                  />
                  <Store className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">常設展</div>
                    <div className="text-sm text-gray-600">継続的な展示・販売</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="location_type"
                    value="event"
                    checked={formData.location_type === 'event'}
                    onChange={(e) => handleInputChange('location_type', e.target.value)}
                    className="mr-3 text-purple-600"
                  />
                  <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">イベント</div>
                    <div className="text-sm text-gray-600">期間限定イベント</div>
                  </div>
                </label>
              </div>
            </div>

            {/* イベント Date Fields */}
            {formData.location_type === 'event' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.start_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.start_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    終了日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.end_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.end_date}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">設定</h3>
            
            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === true}
                    onChange={() => handleInputChange('is_active', true)}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">有効</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === false}
                    onChange={() => handleInputChange('is_active', false)}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">無効</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
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
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;