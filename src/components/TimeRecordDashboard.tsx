import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TimeRecordService } from '../services/timeRecordService';
import TimeRecordButton from './TimeRecordButton';
import TimeRecordHistory from './TimeRecordHistory';
import { Database } from '../types/supabase';

type TimeRecord = Database['public']['Tables']['time_records']['Row'];
type RecordType = Database['public']['Enums']['record_type'];

const TimeRecordDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [todayRecords, setTodayRecords] = useState<TimeRecord[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTodayRecords = async () => {
    if (!user) return;

    try {
      const records = await TimeRecordService.getTodayTimeRecords(user);
      setTodayRecords(records);
    } catch (error) {
      console.error('今日の記録の取得に失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodayRecords();
  }, [user, refreshTrigger]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleTimeRecordSuccess = () => {
    showNotification('success', '打刻が完了しました');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTimeRecordError = (error: string) => {
    showNotification('error', `打刻エラー: ${error}`);
  };

  const getNextRecordType = (): RecordType => {
    return TimeRecordService.getNextRecordType(todayRecords);
  };

  const canClockOut = (): boolean => {
    return TimeRecordService.canClockOut(todayRecords);
  };

  const getCurrentStatus = () => {
    if (todayRecords.length === 0) {
      return { status: '未出勤', color: 'text-gray-600' };
    }

    const lastRecord = todayRecords[todayRecords.length - 1];
    
    switch (lastRecord.record_type) {
      case 'clock_in':
        return { status: '勤務中', color: 'text-green-600' };
      case 'break_start':
        return { status: '休憩中', color: 'text-yellow-600' };
      case 'break_end':
        return { status: '勤務中', color: 'text-green-600' };
      case 'clock_out':
        return { status: '退勤済み', color: 'text-red-600' };
      default:
        return { status: '不明', color: 'text-gray-600' };
    }
  };

  const getWorkingTime = () => {
    if (todayRecords.length === 0) return '00:00';

    let totalMinutes = 0;
    let clockInTime: Date | null = null;
    let breakStart: Date | null = null;

    for (const record of todayRecords) {
      const recordTime = new Date(record.recorded_at);

      switch (record.record_type) {
        case 'clock_in':
          clockInTime = recordTime;
          break;
        case 'break_start':
          if (clockInTime) {
            totalMinutes += (recordTime.getTime() - clockInTime.getTime()) / (1000 * 60);
          }
          breakStart = recordTime;
          break;
        case 'break_end':
          clockInTime = recordTime;
          breakStart = null;
          break;
        case 'clock_out':
          if (clockInTime) {
            totalMinutes += (recordTime.getTime() - clockInTime.getTime()) / (1000 * 60);
          }
          clockInTime = null;
          break;
      }
    }

    // 現在勤務中の場合、現在時刻まで加算
    if (clockInTime && !breakStart) {
      totalMinutes += (new Date().getTime() - clockInTime.getTime()) / (1000 * 60);
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return <div>ユーザー情報が見つかりません</div>;
  }

  const currentStatus = getCurrentStatus();
  const nextRecordType = getNextRecordType();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#CB8585' }}>
                <div className="text-white text-lg font-bold">勤</div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">メイクミー勤怠</h1>
                <p className="text-sm text-gray-600">{user.displayName}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300`}>
          <div className="flex items-center">
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-1">現在の状態</h3>
              <p className={`text-2xl font-bold ${currentStatus.color}`}>
                {currentStatus.status}
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-1">本日の勤務時間</h3>
              <p className="text-2xl font-bold text-blue-600">
                {isLoading ? '--:--' : getWorkingTime()}
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-1">本日の打刻回数</h3>
              <p className="text-2xl font-bold text-purple-600">
                {todayRecords.length}回
              </p>
            </div>
          </div>
        </div>

        {/* Time Record Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">打刻</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">次の打刻</h3>
              <TimeRecordButton
                recordType={nextRecordType}
                onSuccess={handleTimeRecordSuccess}
                onError={handleTimeRecordError}
              />
            </div>
            {canClockOut() && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">退勤</h3>
                <TimeRecordButton
                  recordType="clock_out"
                  onSuccess={handleTimeRecordSuccess}
                  onError={handleTimeRecordError}
                />
              </div>
            )}
          </div>
        </div>

        {/* Today's Records */}
        <TimeRecordHistory
          refreshTrigger={refreshTrigger}
          todayOnly={true}
        />

        {/* All Records */}
        <TimeRecordHistory
          refreshTrigger={refreshTrigger}
          todayOnly={false}
        />
      </div>
    </div>
  );
};

export default TimeRecordDashboard;