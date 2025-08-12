import React, { useState } from 'react';
import { TimeRecordService, TimeRecordData } from '../services/timeRecordService';
import { LocationService, LocationData, Location } from '../services/locationService';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/supabase';
import LocationSelector from './LocationSelector';

type RecordType = Database['public']['Enums']['record_type'];

interface TimeRecordButtonProps {
  recordType: RecordType;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const TimeRecordButton: React.FC<TimeRecordButtonProps> = ({
  recordType,
  onSuccess,
  onError,
  disabled = false
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [useLocation, setUseLocation] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const getButtonColor = (type: RecordType) => {
    switch (type) {
      case 'clock_in':
        return 'bg-green-500 hover:bg-green-600';
      case 'clock_out':
        return 'bg-red-500 hover:bg-red-600';
      case 'break_start':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'break_end':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getButtonIcon = (type: RecordType) => {
    switch (type) {
      case 'clock_in':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 001.414 1.414l2-2a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'clock_out':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 001.414 1.414l2-2a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'break_start':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zM11 8a1 1 0 112 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
          </svg>
        );
      case 'break_end':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleTimeRecord = async () => {
    if (!user) {
      onError?.('ユーザー情報が見つかりません');
      return;
    }

    // 拠点が選択されていない場合のバリデーション
    if (!selectedLocationId && !useLocation) {
      onError?.('拠点を選択するか、位置情報を有効にしてください');
      return;
    }

    setIsLoading(true);

    try {
      let location: LocationData | undefined;
      let locationId: string | undefined;

      if (selectedLocationId && selectedLocation) {
        // 選択された拠点を使用
        locationId = selectedLocationId;
        
        // 拠点の座標情報があれば使用
        if (selectedLocation.latitude && selectedLocation.longitude) {
          location = {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            locationName: selectedLocation.brand_name && selectedLocation.store_name 
              ? `${selectedLocation.brand_name} ${selectedLocation.store_name}`
              : selectedLocation.name
          };
        }
        
        console.log('📍 選択された拠点:', selectedLocation.name, locationId);
      } else if (useLocation) {
        // 位置情報を取得
        try {
          location = await LocationService.getCurrentLocation();
          console.log('📍 位置情報取得成功:', location);
        } catch (locationError) {
          console.warn('⚠️ 位置情報取得失敗:', locationError);
          // 位置情報なしで続行
        }
      }

      const recordData: TimeRecordData = {
        recordType,
        locationId,
        location
      };

      const result = await TimeRecordService.createTimeRecord(user, recordData);
      console.log('✅ 打刻成功:', result);

      onSuccess?.();
    } catch (error) {
      console.error('❌ 打刻エラー:', error);
      const message = error instanceof Error ? error.message : '打刻に失敗しました';
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const label = TimeRecordService.getRecordTypeLabel(recordType);

  const handleLocationSelect = (locationId: string | null, location: Location | null) => {
    setSelectedLocationId(locationId);
    setSelectedLocation(location);
  };

  return (
    <div className="space-y-4">
      {/* 拠点選択 */}
      <LocationSelector
        selectedLocationId={selectedLocationId}
        onLocationSelect={handleLocationSelect}
      />

      {/* 位置情報オプション */}
      <div className="border-t pt-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            id={`location-${recordType}`}
            checked={useLocation}
            onChange={(e) => setUseLocation(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={`location-${recordType}`}>
            GPS位置情報も記録する
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          拠点選択に加えてGPS位置情報も記録します
        </p>
      </div>

      {/* 打刻ボタン */}
      <button
        onClick={handleTimeRecord}
        disabled={disabled || isLoading}
        className={`
          w-full flex items-center justify-center px-6 py-4 
          text-white font-medium rounded-lg shadow-md
          transition-all duration-200 transform
          ${disabled || isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : `${getButtonColor(recordType)} hover:shadow-lg active:scale-95`
          }
        `}
      >
        {isLoading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            打刻中...
          </div>
        ) : (
          <div className="flex items-center">
            {getButtonIcon(recordType)}
            <span className="ml-2">{label}</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default TimeRecordButton;