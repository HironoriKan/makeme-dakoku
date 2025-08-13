import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  ArrowLeft,
  Coffee,
  Timer,
  AlertCircle
} from 'lucide-react';
import { sanitizeUserName } from '../../utils/textUtils';

type UserType = Tables<'users'>;
type TimeRecord = Tables<'time_records'>;
type WorkPattern = Tables<'work_patterns'>;

interface TimeRecordWithDetails extends TimeRecord {
  work_pattern?: WorkPattern;
}

interface DailyAttendanceRecord {
  date: string;
  workPattern?: string;
  shiftStartTime?: string; // シフト出勤時間
  shiftEndTime?: string; // シフト退勤時間
  clockIn?: string;
  clockOut?: string;
  breakTime: number; // 分
  totalWorkTime: number; // 分（拘束時間）
  actualWorkTime: number; // 分（実働時間）
  overtimeMinutes: number; // 残業時間（分）
  lateMinutes: number; // 遅刻時間（分）
  earlyLeaveMinutes: number; // 早退時間（分）
  
  // 打刻記録
  records: {
    clockIn?: string;
    clockOut?: string;
    breakStart?: string;
    breakEnd?: string;
  };
}

interface TimeRecordDetailPageProps {
  userId: string;
  userName: string;
  year: number;
  month: number;
  onBack: () => void;
}

const TimeRecordDetailPage: React.FC<TimeRecordDetailPageProps> = ({
  userId,
  userName,
  year,
  month,
  onBack
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyAttendanceRecord[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(year, month - 1, 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndRecords();
  }, [userId, currentDate]);

  const fetchUserAndRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      // ユーザー情報を取得
      console.log('ユーザー情報取得開始:', userId);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('ユーザー情報取得エラー:', userError);
        throw new Error(`ユーザー情報の取得に失敗: ${userError.message}`);
      }
      console.log('ユーザー情報取得成功:', userData);
      setUser(userData);

      // 月の日数を取得
      const targetYear = currentDate.getFullYear();
      const targetMonth = currentDate.getMonth() + 1;
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);
      
      // その月のすべての日付を生成
      const dates: string[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      // 打刻記録を取得（勤務パターンとシフト情報も含む）
      console.log('打刻記録取得開始:', {
        userId,
        startDate: startDate.toISOString(),
        endDate: new Date(targetYear, targetMonth, 1).toISOString()
      });
      const { data: timeRecords, error: recordsError } = await supabase
        .from('time_records')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .lt('recorded_at', new Date(targetYear, targetMonth, 1).toISOString())
        .order('recorded_at');

      if (recordsError) {
        console.error('打刻記録取得エラー:', recordsError);
        throw new Error(`打刻記録の取得に失敗: ${recordsError.message}`);
      }
      console.log('打刻記録取得成功:', timeRecords?.length, '件');

      // シフト情報を取得（勤務パターン情報付き）
      console.log('シフト情報取得開始:', {
        userId,
        startDate: dates[0],
        endDate: dates[dates.length - 1]
      });
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId)
        .gte('shift_date', dates[0])
        .lte('shift_date', dates[dates.length - 1]);

      if (shiftsError) {
        console.error('シフト情報取得エラー:', shiftsError);
        throw new Error(`シフト情報の取得に失敗: ${shiftsError.message}`);
      }
      console.log('シフト情報取得成功:', shifts?.length, '件');

      // 日別にデータを整理
      const dailyRecordsMap: { [date: string]: DailyAttendanceRecord } = {};

      dates.forEach(date => {
        dailyRecordsMap[date] = {
          date,
          breakTime: 0,
          totalWorkTime: 0,
          actualWorkTime: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          records: {}
        };
      });

      // シフト情報を各日に設定
      shifts?.forEach(shift => {
        const shiftDate = shift.shift_date;
        if (dailyRecordsMap[shiftDate]) {
          dailyRecordsMap[shiftDate].workPattern = shift.shift_type || 'なし';
          dailyRecordsMap[shiftDate].shiftStartTime = shift.start_time || '-';
          dailyRecordsMap[shiftDate].shiftEndTime = shift.end_time || '-';
        }
      });

      // 日別の打刻記録を整理
      const dailyPunchRecordsMap: { [date: string]: { [type: string]: string[] } } = {};
      
      // 初期化
      dates.forEach(date => {
        dailyPunchRecordsMap[date] = {
          clock_in: [],
          clock_out: [],
          break_start: [],
          break_end: []
        };
      });

      // 打刻データを日別に分類
      timeRecords?.forEach(record => {
        const recordDate = new Date(record.recorded_at).toISOString().split('T')[0];
        const recordTime = new Date(record.recorded_at).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        if (dailyRecordsMap[recordDate] && dailyPunchRecordsMap[recordDate]) {
          const dailyRecord = dailyRecordsMap[recordDate];
          
          switch (record.record_type) {
            case 'clock_in':
              dailyRecord.clockIn = recordTime;
              dailyRecord.records.clockIn = recordTime;
              dailyPunchRecordsMap[recordDate].clock_in.push(recordTime);
              break;
            case 'clock_out':
              dailyRecord.clockOut = recordTime;
              dailyRecord.records.clockOut = recordTime;
              dailyPunchRecordsMap[recordDate].clock_out.push(recordTime);
              break;
            case 'break_start':
              dailyRecord.records.breakStart = recordTime;
              dailyPunchRecordsMap[recordDate].break_start.push(recordTime);
              break;
            case 'break_end':
              dailyRecord.records.breakEnd = recordTime;
              dailyPunchRecordsMap[recordDate].break_end.push(recordTime);
              break;
          }

          // 勤務パターンを設定（シフトタイプから取得）
          // work_patternsテーブルの参照は一旦削除
        }
      });

      // 各日の勤務時間を計算
      Object.keys(dailyRecordsMap).forEach(date => {
        const dailyRecord = dailyRecordsMap[date];
        const punchRecords = dailyPunchRecordsMap[date];
        
        if (dailyRecord.clockIn && dailyRecord.clockOut) {
          const clockInTime = new Date(`${dailyRecord.date} ${dailyRecord.clockIn}`);
          const clockOutTime = new Date(`${dailyRecord.date} ${dailyRecord.clockOut}`);
          
          // 拘束時間（分）
          const totalMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60);
          dailyRecord.totalWorkTime = Math.round(totalMinutes);
          
          // 実際の休憩時間を計算
          let actualBreakMinutes = 0;
          
          if (punchRecords.break_start.length > 0 && punchRecords.break_end.length > 0) {
            // 休憩開始・終了の打刻記録から計算
            const breakStartTimes = punchRecords.break_start.map(time => new Date(`${date} ${time}`));
            const breakEndTimes = punchRecords.break_end.map(time => new Date(`${date} ${time}`));
            
            // 最初の休憩開始から最後の休憩終了までの時間を計算（簡易版）
            if (breakStartTimes.length > 0 && breakEndTimes.length > 0) {
              const firstBreakStart = Math.min(...breakStartTimes.map(t => t.getTime()));
              const lastBreakEnd = Math.max(...breakEndTimes.map(t => t.getTime()));
              actualBreakMinutes = Math.round((lastBreakEnd - firstBreakStart) / (1000 * 60));
            }
          } else {
            // 打刻記録がない場合は従来通りの計算（6時間以上なら1時間休憩）
            actualBreakMinutes = totalMinutes >= 360 ? 60 : 0;
          }
          
          dailyRecord.breakTime = actualBreakMinutes;
          
          // 実働時間（拘束時間 - 休憩時間）
          dailyRecord.actualWorkTime = Math.max(0, dailyRecord.totalWorkTime - dailyRecord.breakTime);
          
          // 残業時間（8時間超過分）
          const standardWorkMinutes = 8 * 60; // 8時間
          if (dailyRecord.actualWorkTime > standardWorkMinutes) {
            dailyRecord.overtimeMinutes = dailyRecord.actualWorkTime - standardWorkMinutes;
          }
          
          // 遅刻・早退の計算（シンプル版 - 9:00-18:00を基準）
          const standardStartTime = new Date(`${date} 09:00:00`);
          const standardEndTime = new Date(`${date} 18:00:00`);
          
          // 遅刻計算
          if (clockInTime > standardStartTime) {
            dailyRecord.lateMinutes = Math.round((clockInTime.getTime() - standardStartTime.getTime()) / (1000 * 60));
          }
          
          // 早退計算
          if (clockOutTime < standardEndTime) {
            dailyRecord.earlyLeaveMinutes = Math.round((standardEndTime.getTime() - clockOutTime.getTime()) / (1000 * 60));
          }
        }
      });

      setDailyRecords(dates.map(date => dailyRecordsMap[date]));

    } catch (err) {
      console.error('打刻データ取得エラー:', err);
      const errorMessage = err instanceof Error ? err.message : '打刻データの取得に失敗しました';
      setError(`エラー詳細: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">打刻記録詳細</h1>
              </div>
              <div className="flex items-center space-x-3">
                {user?.picture_url && (
                  <img
                    src={user.picture_url}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900">{userName}</p>
                  <p className="text-sm text-gray-500">#{user?.employee_number || '---'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 月ナビゲーション */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 min-w-[120px] text-center">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* メイン表 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            {/* ヘッダー */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">
                  日付
                </th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">勤怠パターン</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">シフト出勤</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">シフト退勤</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">出勤</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">退勤</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">休憩時間</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">拘束時間</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">実働時間</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">残業時間</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">遅刻時間</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">早退時間</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">出勤打刻</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">退勤打刻</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">休憩開始</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300">休憩終了</th>
              </tr>
            </thead>

            {/* ボディ */}
            <tbody className="bg-white">
              {dailyRecords.map((record) => {
                const date = new Date(record.date + 'T00:00:00');
                const day = date.getDate();
                const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <tr key={record.date} className={`hover:bg-gray-50 ${isWeekend ? 'bg-blue-50' : ''}`}>
                    {/* 日付 */}
                    <td className="px-4 py-2 text-center border border-gray-300">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{day}日</div>
                        <div className="text-xs text-gray-500">({weekday})</div>
                      </div>
                    </td>
                    
                    {/* 勤怠パターン */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">{record.workPattern || '-'}</td>
                    
                    {/* シフト出勤 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">{record.shiftStartTime || '-'}</td>
                    
                    {/* シフト退勤 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">{record.shiftEndTime || '-'}</td>
                    
                    {/* 出勤 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">{record.clockIn || '-'}</td>
                    
                    {/* 退勤 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">{record.clockOut || '-'}</td>
                    
                    {/* 休憩時間 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.breakTime > 0 ? formatTime(record.breakTime) : '-'}
                    </td>
                    
                    {/* 拘束時間 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.totalWorkTime > 0 ? formatTime(record.totalWorkTime) : '-'}
                    </td>
                    
                    {/* 実働時間 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.actualWorkTime > 0 ? formatTime(record.actualWorkTime) : '-'}
                    </td>
                    
                    {/* 残業時間 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.overtimeMinutes > 0 ? (
                        <span className="text-red-600 font-medium">{formatTime(record.overtimeMinutes)}</span>
                      ) : '-'}
                    </td>
                    
                    {/* 遅刻時間 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.lateMinutes > 0 ? (
                        <span className="text-orange-600 font-medium">{formatTime(record.lateMinutes)}</span>
                      ) : '-'}
                    </td>
                    
                    {/* 早退時間 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.earlyLeaveMinutes > 0 ? (
                        <span className="text-orange-600 font-medium">{formatTime(record.earlyLeaveMinutes)}</span>
                      ) : '-'}
                    </td>
                    
                    {/* 出勤打刻 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.records.clockIn || '-'}
                    </td>
                    
                    {/* 退勤打刻 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.records.clockOut || '-'}
                    </td>
                    
                    {/* 休憩開始 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.records.breakStart || '-'}
                    </td>
                    
                    {/* 休憩終了 */}
                    <td className="px-3 py-2 text-center text-sm border border-gray-300">
                      {record.records.breakEnd || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default TimeRecordDetailPage;