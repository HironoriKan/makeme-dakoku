import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import { Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';
import { ShiftService } from '../../services/shiftService';

type User = Tables<'users'>;
type Shift = Tables<'shifts'>;
type TimeRecord = Tables<'time_records'>;
type Location = Tables<'locations'>;

interface ShiftUserData {
  user: User;
  shift: Shift;
  location: Location | { name: string };
  timeRecords: TimeRecord[];
  clockInTime?: string;
  clockOutTime?: string;
}

const TodayShiftView: React.FC = () => {
  const [shiftUsers, setShiftUsers] = useState<ShiftUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayShifts();
  }, []);

  const fetchTodayShifts = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // 今日のシフトを取得（ユーザー情報も含む）
      const { data: shifts, error: shiftError } = await supabase
        .from('shifts')
        .select(`
          *,
          users!inner(*)
        `)
        .eq('shift_date', today)
        .neq('shift_type', 'off')
        .order('start_time', { ascending: true, nullsLast: true });

      if (shiftError) {
        throw new Error(`シフト取得エラー: ${shiftError.message}`);
      }

      if (!shifts || shifts.length === 0) {
        setShiftUsers([]);
        return;
      }

      // ユーザーの拠点情報を取得（user_locationsテーブル経由）
      const userIds = shifts.map(shift => shift.user_id);
      const { data: userLocations, error: userError } = await supabase
        .from('user_locations')
        .select(`
          user_id,
          locations!inner(*)
        `)
        .in('user_id', userIds)
        .eq('is_active', true);

      if (userError) {
        throw new Error(`ユーザー拠点情報取得エラー: ${userError.message}`);
      }

      // 各ユーザーの今日の打刻記録を取得
      const { data: timeRecords, error: timeError } = await supabase
        .from('time_records')
        .select('*')
        .in('user_id', userIds)
        .gte('recorded_at', `${today}T00:00:00.000Z`)
        .lte('recorded_at', `${today}T23:59:59.999Z`)
        .order('recorded_at', { ascending: true });

      if (timeError) {
        throw new Error(`打刻記録取得エラー: ${timeError.message}`);
      }

      // データを整理
      const shiftUserData: ShiftUserData[] = shifts.map(shift => {
        const userTimeRecords = timeRecords?.filter(record => record.user_id === shift.user_id) || [];
        const clockInRecord = userTimeRecords.find(record => record.record_type === 'clock_in');
        const clockOutRecord = userTimeRecords.find(record => record.record_type === 'clock_out');
        
        // ユーザーの拠点情報を取得
        const userLocationData = userLocations?.find(ul => ul.user_id === shift.user_id);
        const location = userLocationData?.locations || { name: '拠点未設定' };

        return {
          user: shift.users,
          shift: shift,
          location: location,
          timeRecords: userTimeRecords,
          clockInTime: clockInRecord ? new Date(clockInRecord.recorded_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : undefined,
          clockOutTime: clockOutRecord ? new Date(clockOutRecord.recorded_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : undefined,
        };
      });

      setShiftUsers(shiftUserData);
    } catch (err) {
      console.error('今日のシフト取得エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const formatShiftTime = (time: string | null) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM
  };

  const getShiftTypeColor = (shiftType: string, startTime?: string | null, endTime?: string | null) => {
    // ShiftServiceの動的判定を使用
    return ShiftService.getShiftTypeColor(shiftType as any, startTime, endTime);
  };

  const getShiftTypeLabel = (shiftType: string) => {
    const labels = {
      early: '早番',
      late: '遅番',
      normal: '通常',
      off: '休み'
    };
    return labels[shiftType as keyof typeof labels] || shiftType;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 22; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const getShiftPosition = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return { left: 0, width: 0 };
    
    const start = parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1]) / 60;
    const end = endTime ? parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1]) / 60 : start + 8;
    
    const startPos = ((start - 9) / 13) * 100; // 9時を0%、22時を100%とする
    const width = ((end - start) / 13) * 100;
    
    return { left: Math.max(0, startPos), width: Math.max(5, width) };
  };

  const getWorkingPosition = (clockInTime: string | undefined, clockOutTime: string | undefined) => {
    if (!clockInTime) return { left: 0, width: 0 };
    
    const [inHour, inMin] = clockInTime.split(':').map(Number);
    const start = inHour + inMin / 60;
    
    let end = start + 8; // デフォルト8時間
    if (clockOutTime) {
      const [outHour, outMin] = clockOutTime.split(':').map(Number);
      end = outHour + outMin / 60;
    }
    
    const startPos = ((start - 9) / 13) * 100;
    const width = ((end - start) / 13) * 100;
    
    return { left: Math.max(0, startPos), width: Math.max(5, width) };
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">今日のシフト</h1>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString('ja-JP')} の勤務状況</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-gray-600">シフト予定</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span className="text-gray-600">実働時間</span>
            </div>
          </div>
        </div>
      </div>

      {/* 時間ヘッダー */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex">
          <div className="w-48 flex-shrink-0"></div>
          <div className="flex-1 flex">
            {timeSlots.map(hour => (
              <div key={hour} className="flex-1 text-center text-xs text-gray-600 border-r border-gray-200 last:border-r-0">
                {hour}:00
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* シフトリスト */}
      <div className="flex-1 overflow-y-auto">
        {shiftUsers.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>今日のシフトはありません</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-4">
            {shiftUsers.map((shiftUser, index) => {
              const shiftPos = getShiftPosition(shiftUser.shift.start_time, shiftUser.shift.end_time);
              const workingPos = getWorkingPosition(shiftUser.clockInTime, shiftUser.clockOutTime);
              const hasCheckedIn = !!shiftUser.clockInTime;
              const hasCheckedOut = !!shiftUser.clockOutTime;

              return (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex">
                    {/* ユーザー情報 */}
                    <div className="w-48 flex-shrink-0 pr-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{shiftUser.user.display_name}</h3>
                            <span 
                              className="px-2 py-1 text-xs rounded text-white"
                              style={{ backgroundColor: getShiftTypeColor(shiftUser.shift.shift_type, shiftUser.shift.start_time, shiftUser.shift.end_time) }}
                            >
                              {getShiftTypeLabel(shiftUser.shift.shift_type)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <p className="text-sm text-gray-600">{shiftUser.location.name || '拠点未設定'}</p>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs">
                            <div className="flex items-center space-x-1">
                              {hasCheckedIn ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-gray-400" />
                              )}
                              <span className={hasCheckedIn ? 'text-green-600' : 'text-gray-400'}>
                                出勤: {shiftUser.clockInTime || '未'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {hasCheckedOut ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-gray-400" />
                              )}
                              <span className={hasCheckedOut ? 'text-green-600' : 'text-gray-400'}>
                                退勤: {shiftUser.clockOutTime || '未'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ガントチャート */}
                    <div className="flex-1 relative h-16 bg-gray-50 rounded border">
                      {/* 時間グリッド */}
                      {timeSlots.map((_, index) => (
                        <div 
                          key={index}
                          className="absolute top-0 bottom-0 border-r border-gray-200"
                          style={{ left: `${(index / (timeSlots.length - 1)) * 100}%` }}
                        />
                      ))}

                      {/* シフト予定バー（薄い色） */}
                      {shiftPos.width > 0 && (
                        <div
                          className="absolute top-2 bottom-2 bg-gray-300 rounded opacity-60 flex items-center justify-center"
                          style={{ 
                            left: `${shiftPos.left}%`, 
                            width: `${shiftPos.width}%` 
                          }}
                        >
                          <span className="text-xs text-gray-700 font-medium">
                            {formatShiftTime(shiftUser.shift.start_time)} - {formatShiftTime(shiftUser.shift.end_time)}
                          </span>
                        </div>
                      )}

                      {/* 実働時間バー（濃い色） */}
                      {workingPos.width > 0 && hasCheckedIn && (
                        <div
                          className="absolute top-4 bottom-4 bg-blue-600 rounded flex items-center justify-center z-10"
                          style={{ 
                            left: `${workingPos.left}%`, 
                            width: `${workingPos.width}%` 
                          }}
                        >
                          <span className="text-xs text-white font-medium">
                            {shiftUser.clockInTime}
                            {shiftUser.clockOutTime && ` - ${shiftUser.clockOutTime}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayShiftView;