import React, { useState, useEffect } from 'react';
import { TimeRecordService } from '../services/timeRecordService';
import { LocationService } from '../services/locationService';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/supabase';

type TimeRecord = Database['public']['Tables']['time_records']['Row'];

interface TimeRecordHistoryProps {
  refreshTrigger?: number;
  todayOnly?: boolean;
}

const TimeRecordHistory: React.FC<TimeRecordHistoryProps> = ({
  refreshTrigger = 0,
  todayOnly = false
}) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimeRecords = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      let data: TimeRecord[];
      if (todayOnly) {
        data = await TimeRecordService.getTodayTimeRecords(user);
      } else {
        data = await TimeRecordService.getUserTimeRecords(user, 20);
      }
      setRecords(data);
    } catch (err) {
      console.error('❌ 打刻履歴取得エラー:', err);
      const message = err instanceof Error ? err.message : '履歴の取得に失敗しました';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimeRecords();
  }, [user, refreshTrigger, todayOnly]);

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      }),
      time: date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getRecordTypeColor = (recordType: string) => {
    switch (recordType) {
      case 'clock_in':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'clock_out':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'break_start':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'break_end':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecordTypeIcon = (recordType: string) => {
    switch (recordType) {
      case 'clock_in':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 001.414 1.414l2-2a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'clock_out':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 001.414 1.414l2-2a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'break_start':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zM11 8a1 1 0 112 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
          </svg>
        );
      case 'break_end':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600">履歴を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadTimeRecords}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {todayOnly ? '今日の打刻履歴' : '打刻履歴'}
        </h2>
        {records.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {records.length}件の記録
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {records.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-600">
              {todayOnly ? '今日はまだ打刻していません' : '打刻履歴がありません'}
            </p>
          </div>
        ) : (
          records.map((record, index) => {
            const { date, time } = formatDateTime(record.recorded_at);
            const label = TimeRecordService.getRecordTypeLabel(record.record_type);
            
            return (
              <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRecordTypeColor(record.record_type)}`}>
                      {getRecordTypeIcon(record.record_type)}
                      <span className="ml-1">{label}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {!todayOnly && <span className="mr-2">{date}</span>}
                      <span className="font-medium">{time}</span>
                    </div>
                  </div>
                  
                  {(record.location_lat && record.location_lng) && (
                    <div className="text-xs text-gray-500 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      位置情報あり
                    </div>
                  )}
                </div>
                
                {record.note && (
                  <div className="mt-2 text-sm text-gray-600 pl-8">
                    {record.note}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TimeRecordHistory;