import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Coffee, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TimeRecordService } from '../services/timeRecordService';
import { Database } from '../types/supabase';

type TimeRecord = Database['public']['Tables']['time_records']['Row'];
type RecordType = Database['public']['Enums']['record_type'];

interface AttendanceCalendarProps {
  availableDates?: number[];
}

interface DayAttendance {
  date: string;
  hasAttendance: boolean;
  records: TimeRecord[];
  workingHours?: number; // 勤務時間（分）
}

interface LocationStats {
  location: string;
  workingDays: number;
  totalMinutes: number;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ 
  availableDates = [] 
}) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyAttendance, setMonthlyAttendance] = useState<DayAttendance[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStats[]>([]);
  const [totalStats, setTotalStats] = useState<{ workingDays: number; totalMinutes: number }>({ workingDays: 0, totalMinutes: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<TimeRecord[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 月の最初の日と最後の日を取得
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 月の最初の日の曜日（0=日曜日）
  const firstDayOfWeek = firstDay.getDay();
  
  // 月の日数
  const daysInMonth = lastDay.getDate();

  // 月間の打刻記録を読み込み
  const loadMonthlyAttendance = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const records = await TimeRecordService.getMonthlyTimeRecords(user, year, month + 1);
      
      // 日付ごとにグループ化
      const attendanceByDate: { [key: string]: DayAttendance } = {};
      
      records.forEach(record => {
        const recordDate = new Date(record.recorded_at).toLocaleDateString('sv-SE'); // YYYY-MM-DD
        
        if (!attendanceByDate[recordDate]) {
          attendanceByDate[recordDate] = {
            date: recordDate,
            hasAttendance: false,
            records: [],
            workingHours: 0
          };
        }
        
        attendanceByDate[recordDate].records.push(record);
        attendanceByDate[recordDate].hasAttendance = true;
      });

      // 勤務時間を計算
      Object.values(attendanceByDate).forEach(dayData => {
        dayData.workingHours = calculateWorkingMinutes(dayData.records);
      });

      const attendanceArray = Object.values(attendanceByDate);
      setMonthlyAttendance(attendanceArray);

      // 拠点別統計を計算
      calculateLocationStats(attendanceArray);

      console.log('✅ 月間実績読み込み完了:', Object.keys(attendanceByDate).length, '日');
    } catch (error) {
      console.error('❌ 月間実績読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 勤務時間を計算（分単位）
  const calculateWorkingMinutes = (records: TimeRecord[]): number => {
    let totalMinutes = 0;
    let clockInTime: Date | null = null;
    let breakStart: Date | null = null;

    for (const record of records) {
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

    return Math.round(totalMinutes);
  };

  // 拠点別統計を計算
  const calculateLocationStats = (attendanceArray: DayAttendance[]) => {
    const locationMap = new Map<string, { workingDays: Set<string>; totalMinutes: number }>();
    let allWorkingDays = 0;
    let allTotalMinutes = 0;

    attendanceArray.forEach(dayData => {
      if (!dayData.hasAttendance || !dayData.records.length) return;

      // その日の勤務拠点を特定（noteから抽出）
      const dayLocations = new Set<string>();
      dayData.records.forEach(record => {
        if (record.note) {
          const locationMatch = record.note.match(/(.+)からの打刻/);
          if (locationMatch) {
            dayLocations.add(locationMatch[1]);
          }
        }
      });

      // 拠点が特定できない場合は「不明」とする
      if (dayLocations.size === 0) {
        dayLocations.add('不明');
      }

      // 各拠点に統計を追加
      dayLocations.forEach(location => {
        if (!locationMap.has(location)) {
          locationMap.set(location, { workingDays: new Set(), totalMinutes: 0 });
        }
        
        const stats = locationMap.get(location)!;
        stats.workingDays.add(dayData.date);
        stats.totalMinutes += dayData.workingHours || 0;
      });

      // 全体統計
      allWorkingDays++;
      allTotalMinutes += dayData.workingHours || 0;
    });

    // 拠点別統計を配列に変換
    const locationStatsArray: LocationStats[] = [];
    locationMap.forEach((stats, location) => {
      locationStatsArray.push({
        location,
        workingDays: stats.workingDays.size,
        totalMinutes: stats.totalMinutes
      });
    });

    // 拠点名でソート
    locationStatsArray.sort((a, b) => a.location.localeCompare(b.location));

    setLocationStats(locationStatsArray);
    setTotalStats({ workingDays: allWorkingDays, totalMinutes: allTotalMinutes });
  };

  useEffect(() => {
    loadMonthlyAttendance();
  }, [user, currentDate]);

  // 指定日の出勤データを取得
  const getAttendanceForDate = (dateString: string): DayAttendance | undefined => {
    return monthlyAttendance.find(attendance => attendance.date === dateString);
  };

  // 前月に移動
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 次月に移動
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 日付クリック処理
  const handleDateClick = async (dateString: string) => {
    if (!user) return;

    const attendance = getAttendanceForDate(dateString);
    if (!attendance || !attendance.hasAttendance) return;

    setSelectedDate(dateString);
    setSelectedRecords(attendance.records);
  };

  // 勤務状況に応じた色を取得
  const getAttendanceColor = (attendance: DayAttendance): string => {
    if (!attendance.hasAttendance) return '#e5e7eb'; // gray-200
    
    const workingHours = (attendance.workingHours || 0) / 60; // 時間に変換
    
    if (workingHours >= 8) return '#059669'; // emerald-600 - フルタイム
    if (workingHours >= 4) return '#CB8585'; // テーマカラー - ハーフタイム
    return '#f59e0b'; // amber-500 - 短時間
  };

  // カレンダーのグリッドを生成
  const generateCalendarDays = () => {
    const days = [];
    
    // 前月の空白セルを追加
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square flex items-center justify-center text-gray-300">
          -
        </div>
      );
    }
    
    // 現在月の日付を追加
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const attendance = getAttendanceForDate(dateString);
      
      days.push(
        <div
          key={day}
          className="aspect-square flex items-center justify-center text-sm font-medium relative cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => handleDateClick(dateString)}
        >
          {attendance && attendance.hasAttendance ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
              style={{ backgroundColor: getAttendanceColor(attendance) }}
            >
              {day}
            </div>
          ) : (
            <span className="text-gray-800 hover:text-gray-600">{day}</span>
          )}
        </div>
      );
    }
    
    return days;
  };

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatWorkingHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTotalHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}時間${minutes % 60}分`;
  };

  return (
    <div className="space-y-4">
      {/* 実績カレンダー */}
      <div className="bg-white rounded-lg shadow-sm p-4 aspect-square">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            style={{ color: '#CB8585' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h3 className="text-lg font-medium text-gray-900">
            {year}年 {monthNames[month]} 実績
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            style={{ color: '#CB8585' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center text-sm font-medium ${
                index === 5 ? 'text-blue-600' : index === 6 ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-1 mb-4 flex-1">
          {generateCalendarDays()}
        </div>

        {/* 凡例 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-gray-600 text-xs">8時間以上</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#CB8585' }} />
              <span className="text-gray-600 text-xs">4-8時間</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-gray-600 text-xs">4時間未満</span>
            </div>
          </div>
          <span className="text-gray-500">
            {isLoading ? '読み込み中...' : `出勤日：${monthlyAttendance.length}日`}
          </span>
        </div>
      </div>

      {/* 拠点別・全体統計 */}
      <div className="space-y-4">
        {/* 全体統計 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">📊 今月の勤怠統計</h4>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm text-gray-600">総稼働日数</p>
                <p className="text-2xl font-bold text-blue-600">{totalStats.workingDays}日</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">総稼働時間</p>
                <p className="text-2xl font-bold text-blue-600">{formatTotalHours(totalStats.totalMinutes)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 拠点別統計 */}
        {locationStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">🏢 拠点別統計</h4>
            <div className="space-y-3">
              {locationStats.map((stats, index) => (
                <div key={stats.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${index * 60}, 60%, 50%)` }}
                    />
                    <span className="font-medium text-gray-900">{stats.location}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {stats.workingDays}日 / {formatTotalHours(stats.totalMinutes)}
                    </p>
                    <p className="text-xs text-gray-500">
                      平均 {formatTotalHours(Math.round(stats.totalMinutes / stats.workingDays))} / 日
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 打刻記録表示モーダル */}
      {selectedDate && selectedRecords.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {new Date(selectedDate).toLocaleDateString('ja-JP')} の打刻記録
            </h3>
            
            <div className="space-y-3">
              {selectedRecords.map((record, index) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {record.record_type === 'clock_in' && <LogIn className="w-4 h-4 text-green-600" />}
                      {record.record_type === 'clock_out' && <LogOut className="w-4 h-4 text-red-600" />}
                      {(record.record_type === 'break_start' || record.record_type === 'break_end') && <Coffee className="w-4 h-4 text-orange-600" />}
                      <span className="text-sm font-medium text-gray-900">
                        {TimeRecordService.getRecordTypeLabel(record.record_type)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(record.recorded_at)}
                    </p>
                    {record.note && (
                      <p className="text-xs text-gray-500">{record.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 勤務時間サマリー */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">勤務時間</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatWorkingHours(calculateWorkingMinutes(selectedRecords))}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedRecords([]);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;