import React, { useState, useEffect } from 'react';
import { LocationService, Location } from '../services/locationService';
import { MapPin, Store, Calendar, ChevronDown, Heart } from 'lucide-react';

interface LocationSelectorProps {
  selectedLocationId: string | null;
  onLocationSelect: (locationId: string | null, location: Location | null) => void;
  className?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocationId,
  onLocationSelect,
  className = ''
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchActiveLocations();
  }, []);

  const fetchActiveLocations = async () => {
    setLoading(true);
    setError(null);

    try {
      const activeLocations = await LocationService.getActiveLocations();
      setLocations(activeLocations);
    } catch (err) {
      setError(err instanceof Error ? err.message : '拠点の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  const getLocationDisplayName = (location: Location) => {
    if (location.brand_name && location.store_name) {
      return `${location.brand_name} ${location.store_name}`;
    }
    return location.name;
  };

  const getLocationTypeIcon = (locationType: 'makeme' | 'permanent' | 'event' | null) => {
    switch (locationType) {
      case 'makeme': return Heart;
      case 'permanent': return Store;
      case 'event': return Calendar;
      default: return Heart;
    }
  };

  const getLocationTypeColor = (locationType: 'makeme' | 'permanent' | 'event' | null) => {
    switch (locationType) {
      case 'makeme': return 'text-pink-600';
      case 'permanent': return 'text-blue-600';
      case 'event': return 'text-purple-600';
      default: return 'text-pink-600';
    }
  };

  const isLocationAvailable = (location: Location) => {
    if (location.location_type !== 'event') return true;
    
    if (!location.start_date || !location.end_date) return true;
    
    const now = new Date();
    const startDate = new Date(location.start_date);
    const endDate = new Date(location.end_date);
    
    return now >= startDate && now <= endDate;
  };

  const handleLocationSelect = (location: Location | null) => {
    onLocationSelect(location?.id || null, location);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-gray-600">拠点を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="p-4 border border-red-300 rounded-lg bg-red-50">
          <div className="text-red-700 text-sm">{error}</div>
          <button
            onClick={fetchActiveLocations}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        打刻拠点を選択 <span className="text-red-500">*</span>
      </label>
      
      {/* Selected Location Display / Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <div className="flex items-center space-x-3">
          {selectedLocation ? (
            <>
              {React.createElement(getLocationTypeIcon(selectedLocation.location_type), {
                className: `w-5 h-5 ${getLocationTypeColor(selectedLocation.location_type)}`
              })}
              <div className="text-left">
                <div className="font-medium text-gray-900">
                  {getLocationDisplayName(selectedLocation)}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedLocation.prefecture} • {selectedLocation.location_type === 'popup' ? 'POP-UP' : '常設展'}
                </div>
              </div>
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">拠点を選択してください</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Clear Selection Option */}
          <button
            type="button"
            onClick={() => handleLocationSelect(null)}
            className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <MapPin className="w-5 h-5 text-gray-400 mr-3" />
            <span className="text-gray-600">拠点を選択しない</span>
          </button>

          {/* Location Options */}
          {locations.map((location) => {
            const isAvailable = isLocationAvailable(location);
            const Icon = getLocationTypeIcon(location.location_type);
            
            return (
              <button
                key={location.id}
                type="button"
                onClick={() => isAvailable ? handleLocationSelect(location) : undefined}
                disabled={!isAvailable}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  isAvailable 
                    ? 'hover:bg-gray-50 cursor-pointer' 
                    : 'bg-gray-50 cursor-not-allowed opacity-60'
                } ${selectedLocationId === location.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
              >
                <Icon className={`w-5 h-5 mr-3 ${getLocationTypeColor(location.location_type)}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {getLocationDisplayName(location)}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{location.prefecture}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      location.location_type === 'makeme'
                        ? 'bg-pink-100 text-pink-800'
                        : location.location_type === 'permanent'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {location.location_type === 'makeme' ? 'メイクミー' :
                       location.location_type === 'permanent' ? '常設展' : 'イベント'}
                    </span>
                    {location.location_type === 'event' && location.start_date && location.end_date && (
                      <>
                        <span>•</span>
                        <span className="text-xs">
                          {new Date(location.start_date).toLocaleDateString('ja-JP')} - {new Date(location.end_date).toLocaleDateString('ja-JP')}
                        </span>
                      </>
                    )}
                  </div>
                  {!isAvailable && (
                    <div className="text-xs text-red-600 mt-1">期間外のため選択できません</div>
                  )}
                </div>
              </button>
            );
          })}

          {locations.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p>利用可能な拠点がありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;