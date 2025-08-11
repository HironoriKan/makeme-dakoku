import React, { useState } from 'react';
import { LocationService } from '../../services/locationService';
import { X, Save, MapPin } from 'lucide-react';

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
    address: '',
    latitude: '',
    longitude: '',
    is_active: true,
    display_order: ''
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

    if (formData.latitude && isNaN(Number(formData.latitude))) {
      errors.latitude = '緯度は数値で入力してください';
    }

    if (formData.longitude && isNaN(Number(formData.longitude))) {
      errors.longitude = '経度は数値で入力してください';
    }

    if (formData.display_order && isNaN(Number(formData.display_order))) {
      errors.display_order = '表示順序は数値で入力してください';
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
        address: formData.address.trim() || undefined,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        is_active: formData.is_active,
        display_order: formData.display_order ? Number(formData.display_order) : undefined
      });

      // Reset form
      setFormData({
        name: '',
        code: '',
        address: '',
        latitude: '',
        longitude: '',
        is_active: true,
        display_order: ''
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
        address: '',
        latitude: '',
        longitude: '',
        is_active: true,
        display_order: ''
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
          </div>

          {/* Location Coordinates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">位置情報（任意）</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  緯度
                </label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.latitude ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例: 35.6762"
                />
                {validationErrors.latitude && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.latitude}</p>
                )}
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  経度
                </label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.longitude ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例: 139.6503"
                />
                {validationErrors.longitude && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.longitude}</p>
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">設定</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表示順序
                </label>
                <input
                  type="text"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.display_order ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例: 1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  空欄の場合、自動で最後の順序になります
                </p>
                {validationErrors.display_order && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.display_order}</p>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <div className="flex items-center space-x-4 mt-3">
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