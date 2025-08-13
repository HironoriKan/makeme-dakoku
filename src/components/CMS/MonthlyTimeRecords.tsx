import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LocationService, Location } from '../../services/locationService';
import { Tables } from '../../types/supabase';
import { 
  Calendar, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  User,
  FileText
} from 'lucide-react';
import { sanitizeUserName } from '../../utils/textUtils';
import TimeRecordDetailPage from './TimeRecordDetailPage';

type User = Tables<'users'>;
type TimeRecord = Tables<'time_records'>;

interface TimeRecordWithUser extends TimeRecord {
  user?: User;
  location?: Location;
}

interface DailyUserRecord {
  clockIn?: string;
  clockOut?: string;
  workingHours?: number;
  location?: string;
}

interface MonthlyData {
  users: User[];
  records: { [userId: string]: { [date: string]: DailyUserRecord } };
  dates: string[];
}

const MonthlyTimeRecords: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    users: [],
    records: {},
    dates: []
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 詳細ページ表示状態
  const [showDetailPage, setShowDetailPage] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

  // 詳細ページへ遷移する関数
  const handleUserDetail = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowDetailPage(true);
  };

  // 詳細ページから戻る関数
  const handleBackFromDetail = () => {
    setShowDetailPage(false);
    setSelectedUserId(null);
    setSelectedUserName('');
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchMonthlyData();
  }, [currentDate, selectedLocationId]);

  const fetchLocations = async () => {
    try {
      const locationsData = await LocationService.getAllLocations();
      setLocations(locationsData);
    } catch (err) {
      console.error('拠点データの取得に失敗:', err);
    }
  };

  const fetchMonthlyData = async () => {
    setLoading(true);
    setError(null);

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // その月の開始日と終了日を計算
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // 日付配列を生成
      const dates: string[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      // ユーザー一覧を取得
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('display_name');

      if (usersError) throw usersError;

      // 打刻記録を取得
      let timeRecordsQuery = supabase
        .from('time_records')
        .select(`
          *,
          users(*)
        `)
        .gte('recorded_at', startDate.toISOString())
        .lt('recorded_at', new Date(year, month, 1).toISOString())
        .in('record_type', ['clock_in', 'clock_out'])
        .order('recorded_at');

      // 拠点フィルタリング
      if (selectedLocationId !== 'all') {
        timeRecordsQuery = timeRecordsQuery.eq('location_id', selectedLocationId);
      }

      const { data: timeRecords, error: recordsError } = await timeRecordsQuery;

      if (recordsError) throw recordsError;

      // データを整理
      const recordsMap: { [userId: string]: { [date: string]: DailyUserRecord } } = {};

      users?.forEach(user => {
        recordsMap[user.id] = {};
        dates.forEach(date => {
          recordsMap[user.id][date] = {};
        });
      });

      timeRecords?.forEach(record => {
        if (!record.users) return;
        
        const userId = record.user_id;
        const recordDate = new Date(record.recorded_at).toISOString().split('T')[0];
        const recordTime = new Date(record.recorded_at).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        if (!recordsMap[userId]) {
          recordsMap[userId] = {};
        }
        if (!recordsMap[userId][recordDate]) {
          recordsMap[userId][recordDate] = {};
        }

        if (record.record_type === 'clock_in') {
          recordsMap[userId][recordDate].clockIn = recordTime;
        } else if (record.record_type === 'clock_out') {
          recordsMap[userId][recordDate].clockOut = recordTime;
        }

        // 拠点名を設定
        if (record.location_name) {
          recordsMap[userId][recordDate].location = record.location_name;
        }
      });

      // 勤務時間を計算
      Object.keys(recordsMap).forEach(userId => {
        Object.keys(recordsMap[userId]).forEach(date => {
          const dayRecord = recordsMap[userId][date];
          if (dayRecord.clockIn && dayRecord.clockOut) {
            const clockInTime = new Date(`${date} ${dayRecord.clockIn}`);
            const clockOutTime = new Date(`${date} ${dayRecord.clockOut}`);
            const diffMs = clockOutTime.getTime() - clockInTime.getTime();
            dayRecord.workingHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // 小数点1桁
          }
        });
      });

      setMonthlyData({
        users: users || [],
        records: recordsMap,
        dates
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '打刻データの取得に失敗しました');
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

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate();
    const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });
    return { day, weekday };
  };

  const getWeekendClass = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDay();
    if (day === 0) return 'bg-red-50'; // 日曜日
    if (day === 6) return 'bg-blue-50'; // 土曜日
    return '';
  };

  const exportToCSV = () => {
    // CSV出力機能（将来的に実装）
    console.log('CSV出力機能');
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

  // 詳細ページを表示する場合
  if (showDetailPage && selectedUserId) {
    return (
      <TimeRecordDetailPage
        userId={selectedUserId}
        userName={selectedUserName}
        year={currentDate.getFullYear()}
        month={currentDate.getMonth() + 1}
        onBack={handleBackFromDetail}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">月次打刻記録</h1>
            </div>
            <p className="text-gray-600">月単位でユーザーの出退勤時間を確認できます</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV出力
          </button>
        </div>

        {/* 月ナビゲーションと拠点フィルター */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
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

          {/* 拠点フィルター */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全拠点</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.brand_name && location.store_name
                    ? `${location.brand_name} ${location.store_name}`
                    : location.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* メイン表 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {/* ヘッダー */}
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>ユーザー</span>
                  </div>
                </th>
                {monthlyData.dates.map((date) => {
                  const { day, weekday } = formatDateHeader(date);
                  return (
                    <th
                      key={date}
                      className={`px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] ${getWeekendClass(date)}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900">{day}</span>
                        <span className="text-xs">{weekday}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* ボディ */}
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  {/* ユーザー名（固定列） */}
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-gray-200 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {user.picture_url ? (
                          <img
                            src={user.picture_url}
                            alt={sanitizeUserName(user.display_name)}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {sanitizeUserName(user.display_name)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            #{user.employee_number || '---'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUserDetail(user.id, sanitizeUserName(user.display_name))}
                        className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={`${sanitizeUserName(user.display_name)}の詳細を表示`}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                  {/* 各日の打刻データ */}
                  {monthlyData.dates.map((date) => {
                    const dayRecord = monthlyData.records[user.id]?.[date];
                    return (
                      <td
                        key={date}
                        className={`px-2 py-3 text-center text-xs ${getWeekendClass(date)} border-l border-gray-100`}
                      >
                        {dayRecord?.clockIn || dayRecord?.clockOut ? (
                          <div className="space-y-1">
                            {/* 出勤時間 */}
                            {dayRecord.clockIn && (
                              <div className="flex items-center justify-center space-x-1 text-green-700">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">{dayRecord.clockIn}</span>
                              </div>
                            )}
                            
                            {/* 退勤時間 */}
                            {dayRecord.clockOut && (
                              <div className="flex items-center justify-center space-x-1 text-red-700">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">{dayRecord.clockOut}</span>
                              </div>
                            )}
                            
                            {/* 勤務時間 */}
                            {dayRecord.workingHours && (
                              <div className="text-blue-600 font-medium">
                                {dayRecord.workingHours}h
                              </div>
                            )}
                            
                            {/* 拠点名 */}
                            {dayRecord.location && (
                              <div className="flex items-center justify-center space-x-1 text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[80px]" title={dayRecord.location}>
                                  {dayRecord.location}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 凡例 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">凡例</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3 text-green-700" />
            <span>出勤時間</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3 text-red-700" />
            <span>退勤時間</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-blue-600 rounded"></span>
            <span>勤務時間</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span>勤務拠点</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTimeRecords;