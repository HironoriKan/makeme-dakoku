import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import { 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  ArrowLeft,
  Coffee,
  Timer,
  AlertCircle,
  Save,
  Users,
  JapaneseYen,
  Car,
  Calendar,
  Plus,
  UserPlus,
  Trash2
} from 'lucide-react';
import { sanitizeUserName } from '../../utils/textUtils';

type UserType = Tables<'users'>;
type TimeRecord = Tables<'time_records'>;
type WorkPattern = Tables<'work_patterns'>;
type Location = Tables<'locations'>;

interface LocationUser {
  id: string;
  user_id: string;
  location_id: string;
  hourly_wage: number | null;
  transportation_cost: number | null;
  created_at: string;
  updated_at: string;
  user: UserType;
}

interface TimeRecordWithDetails extends TimeRecord {
  work_pattern?: WorkPattern;
}

type WorkStatus = '出勤' | '残業' | '遅刻' | '早退' | '早出' | '欠勤' | '要確認' | '';

interface DailyAttendanceRecord {
  date: string;
  workPattern?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  clockIn?: string;
  clockOut?: string;
  breakTime: number;
  totalWorkTime: number;
  actualWorkTime: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  workStatus: WorkStatus;
  
  records: {
    clockIn?: string;
    clockOut?: string;
    breakStart?: string;
    breakEnd?: string;
  };
}

interface LocationDetailPageProps {
  locationId: string;
  onBack: () => void;
}

const LocationDetailPage: React.FC<LocationDetailPageProps> = ({ locationId, onBack }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [users, setUsers] = useState<LocationUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LocationUser | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyAttendanceRecord[]>([]);
  const [allUsersShiftData, setAllUsersShiftData] = useState<{ [userId: string]: DailyAttendanceRecord[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalUsers, setOriginalUsers] = useState<LocationUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [selectedNewUserId, setSelectedNewUserId] = useState<string>('');

  useEffect(() => {
    fetchLocationDetails();
    fetchAvailableUsers();
  }, [locationId]);

  useEffect(() => {
    if (users.length > 0) {
      fetchAllUsersShiftData();
    }
  }, [users, currentMonth]);

  const fetchAvailableUsers = async () => {
    try {
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('display_name');

      if (usersError) throw usersError;
      setAvailableUsers(allUsers || []);
    } catch (err) {
      console.error('利用可能ユーザー取得エラー:', err);
    }
  };

  const fetchLocationDetails = async () => {
    try {
      setLoading(true);
      
      // 拠点情報を取得
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();

      if (locationError) throw locationError;
      setLocation(locationData);

      // 拠点に配属されたユーザーを取得
      const { data: usersData, error: usersError } = await supabase
        .from('user_locations')
        .select(`
          *,
          user:users(*)
        `)
        .eq('location_id', locationId)
        .eq('is_active', true);

      if (usersError) throw usersError;
      
      const locationUsers = usersData?.map(item => ({
        ...item,
        user: item.user as UserType
      })) || [];
      
      setUsers(locationUsers);
      setOriginalUsers(JSON.parse(JSON.stringify(locationUsers)));
      
      // 最初のユーザーを選択
      if (locationUsers.length > 0) {
        setSelectedUser(locationUsers[0]);
      }
      
    } catch (err) {
      console.error('拠点詳細取得エラー:', err);
      setError(err instanceof Error ? err.message : '拠点詳細の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsersShiftData = async () => {
    if (users.length === 0) return;

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      // 月の範囲を計算
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const allUsersData: { [userId: string]: DailyAttendanceRecord[] } = {};
      
      // 全ユーザーのシフトデータを並行取得
      await Promise.all(users.map(async (user) => {
        try {
          // 打刻記録を取得
          const { data: records, error: recordsError } = await supabase
            .from('time_records')
            .select(`
              *,
              work_pattern:work_patterns(*)
            `)
            .eq('user_id', user.user_id)
            .gte('recorded_at', startDate.toISOString())
            .lte('recorded_at', endDate.toISOString())
            .order('recorded_at');

          if (recordsError) throw recordsError;

          // 日別にデータを整理
          const dailyData: { [key: string]: DailyAttendanceRecord } = {};
          
          // 月の各日を初期化
          for (let day = 1; day <= endDate.getDate(); day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = date.toISOString().split('T')[0];
            
            dailyData[dateStr] = {
              date: dateStr,
              breakTime: 0,
              totalWorkTime: 0,
              actualWorkTime: 0,
              overtimeMinutes: 0,
              lateMinutes: 0,
              earlyLeaveMinutes: 0,
              workStatus: '',
              records: {}
            };
          }

          // 打刻記録を日別に分類
          records?.forEach((record: TimeRecordWithDetails) => {
            const recordDate = new Date(record.recorded_at).toISOString().split('T')[0];
            const timeStr = new Date(record.recorded_at).toTimeString().substring(0, 5);
            
            if (!dailyData[recordDate]) return;
            
            switch (record.record_type) {
              case 'clock_in':
                dailyData[recordDate].clockIn = timeStr;
                dailyData[recordDate].records.clockIn = timeStr;
                break;
              case 'clock_out':
                dailyData[recordDate].clockOut = timeStr;
                dailyData[recordDate].records.clockOut = timeStr;
                break;
              case 'break_start':
                dailyData[recordDate].records.breakStart = timeStr;
                break;
              case 'break_end':
                dailyData[recordDate].records.breakEnd = timeStr;
                break;
            }
            
            if (record.work_pattern) {
              dailyData[recordDate].workPattern = record.work_pattern.name;
              dailyData[recordDate].shiftStartTime = record.work_pattern.start_time;
              dailyData[recordDate].shiftEndTime = record.work_pattern.end_time;
            }
          });

          // 勤務時間を計算
          Object.values(dailyData).forEach(dayData => {
            if (dayData.clockIn && dayData.clockOut) {
              const clockInTime = new Date(`2000-01-01T${dayData.clockIn}:00`);
              const clockOutTime = new Date(`2000-01-01T${dayData.clockOut}:00`);
              
              if (clockOutTime < clockInTime) {
                clockOutTime.setDate(clockOutTime.getDate() + 1);
              }
              
              const totalMinutes = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
              dayData.totalWorkTime = totalMinutes;
              
              // 休憩時間を計算（シンプルな計算）
              if (totalMinutes > 360) { // 6時間超
                dayData.breakTime = 60; // 1時間
              }
              
              dayData.actualWorkTime = totalMinutes - dayData.breakTime;
              
              // ステータス判定
              if (dayData.shiftStartTime && dayData.shiftEndTime) {
                const shiftStart = new Date(`2000-01-01T${dayData.shiftStartTime}:00`);
                const shiftEnd = new Date(`2000-01-01T${dayData.shiftEndTime}:00`);
                
                if (clockInTime > shiftStart) {
                  dayData.lateMinutes = Math.round((clockInTime.getTime() - shiftStart.getTime()) / (1000 * 60));
                  dayData.workStatus = '遅刻';
                } else if (clockOutTime < shiftEnd) {
                  dayData.earlyLeaveMinutes = Math.round((shiftEnd.getTime() - clockOutTime.getTime()) / (1000 * 60));
                  dayData.workStatus = '早退';
                } else if (clockOutTime > shiftEnd) {
                  dayData.overtimeMinutes = Math.round((clockOutTime.getTime() - shiftEnd.getTime()) / (1000 * 60));
                  dayData.workStatus = '残業';
                } else {
                  dayData.workStatus = '出勤';
                }
              } else {
                dayData.workStatus = '出勤';
              }
            } else if (dayData.clockIn) {
              dayData.workStatus = '要確認';
            } else if (dayData.shiftStartTime) {
              dayData.workStatus = '欠勤';
            }
          });

          allUsersData[user.user_id] = Object.values(dailyData);
        } catch (err) {
          console.error(`ユーザー ${user.user_id} のデータ取得エラー:`, err);
          allUsersData[user.user_id] = [];
        }
      }));

      setAllUsersShiftData(allUsersData);
      
    } catch (err) {
      console.error('全ユーザーシフトデータ取得エラー:', err);
      setError(err instanceof Error ? err.message : 'シフトデータの取得に失敗しました');
    }
  };

  const fetchUserAttendanceData = async (userId: string) => {
    if (!userId) return;

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      // 月の範囲を計算
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // 打刻記録を取得
      const { data: records, error: recordsError } = await supabase
        .from('time_records')
        .select(`
          *,
          work_pattern:work_patterns(*)
        `)
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString())
        .order('recorded_at');

      if (recordsError) throw recordsError;

      // 日別にデータを整理
      const dailyData: { [key: string]: DailyAttendanceRecord } = {};
      
      // 月の各日を初期化
      for (let day = 1; day <= endDate.getDate(); day++) {
        const date = new Date(year, month - 1, day);
        const dateStr = date.toISOString().split('T')[0];
        
        dailyData[dateStr] = {
          date: dateStr,
          breakTime: 0,
          totalWorkTime: 0,
          actualWorkTime: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          workStatus: '',
          records: {}
        };
      }

      // 打刻記録を日別に分類
      records?.forEach((record: TimeRecordWithDetails) => {
        const recordDate = new Date(record.recorded_at).toISOString().split('T')[0];
        const timeStr = new Date(record.recorded_at).toTimeString().substring(0, 5);
        
        if (!dailyData[recordDate]) return;
        
        switch (record.record_type) {
          case 'clock_in':
            dailyData[recordDate].clockIn = timeStr;
            dailyData[recordDate].records.clockIn = timeStr;
            break;
          case 'clock_out':
            dailyData[recordDate].clockOut = timeStr;
            dailyData[recordDate].records.clockOut = timeStr;
            break;
          case 'break_start':
            dailyData[recordDate].records.breakStart = timeStr;
            break;
          case 'break_end':
            dailyData[recordDate].records.breakEnd = timeStr;
            break;
        }
        
        if (record.work_pattern) {
          dailyData[recordDate].workPattern = record.work_pattern.name;
          dailyData[recordDate].shiftStartTime = record.work_pattern.start_time;
          dailyData[recordDate].shiftEndTime = record.work_pattern.end_time;
        }
      });

      // 勤務時間を計算
      Object.values(dailyData).forEach(dayData => {
        if (dayData.clockIn && dayData.clockOut) {
          const clockInTime = new Date(`2000-01-01T${dayData.clockIn}:00`);
          const clockOutTime = new Date(`2000-01-01T${dayData.clockOut}:00`);
          
          if (clockOutTime < clockInTime) {
            clockOutTime.setDate(clockOutTime.getDate() + 1);
          }
          
          const totalMinutes = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
          dayData.totalWorkTime = totalMinutes;
          
          // 休憩時間を計算（シンプルな計算）
          if (totalMinutes > 360) { // 6時間超
            dayData.breakTime = 60; // 1時間
          }
          
          dayData.actualWorkTime = totalMinutes - dayData.breakTime;
          
          // ステータス判定
          if (dayData.shiftStartTime && dayData.shiftEndTime) {
            const shiftStart = new Date(`2000-01-01T${dayData.shiftStartTime}:00`);
            const shiftEnd = new Date(`2000-01-01T${dayData.shiftEndTime}:00`);
            
            if (clockInTime > shiftStart) {
              dayData.lateMinutes = Math.round((clockInTime.getTime() - shiftStart.getTime()) / (1000 * 60));
              dayData.workStatus = '遅刻';
            } else if (clockOutTime < shiftEnd) {
              dayData.earlyLeaveMinutes = Math.round((shiftEnd.getTime() - clockOutTime.getTime()) / (1000 * 60));
              dayData.workStatus = '早退';
            } else if (clockOutTime > shiftEnd) {
              dayData.overtimeMinutes = Math.round((clockOutTime.getTime() - shiftEnd.getTime()) / (1000 * 60));
              dayData.workStatus = '残業';
            } else {
              dayData.workStatus = '出勤';
            }
          } else {
            dayData.workStatus = '出勤';
          }
        } else if (dayData.clockIn) {
          dayData.workStatus = '要確認';
        } else if (dayData.shiftStartTime) {
          dayData.workStatus = '欠勤';
        }
      });

      setDailyRecords(Object.values(dailyData));
      
    } catch (err) {
      console.error('勤怠データ取得エラー:', err);
      setError(err instanceof Error ? err.message : '勤怠データの取得に失敗しました');
    }
  };

  const handleUserWageChange = (userId: string, wage: string) => {
    const updatedUsers = users.map(user => 
      user.user_id === userId 
        ? { ...user, hourly_wage: wage ? parseFloat(wage) : null }
        : user
    );
    setUsers(updatedUsers);
    setHasChanges(true);
  };

  const handleTransportationCostChange = (userId: string, cost: string) => {
    const updatedUsers = users.map(user => 
      user.user_id === userId 
        ? { ...user, transportation_cost: cost ? parseFloat(cost) : null }
        : user
    );
    setUsers(updatedUsers);
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // 変更されたユーザーのみ更新
      const promises = users.map(async (user) => {
        const original = originalUsers.find(ou => ou.user_id === user.user_id);
        if (!original || 
            original.hourly_wage !== user.hourly_wage || 
            original.transportation_cost !== user.transportation_cost) {
          
          const { error } = await supabase
            .from('user_locations')
            .update({
              hourly_wage: user.hourly_wage,
              transportation_cost: user.transportation_cost,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.user_id)
            .eq('location_id', locationId);
          
          if (error) throw error;
        }
      });

      await Promise.all(promises);
      
      setOriginalUsers(JSON.parse(JSON.stringify(users)));
      setHasChanges(false);
      
      // 成功メッセージを表示
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
      successDiv.textContent = '設定を保存しました';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
      
    } catch (err) {
      console.error('保存エラー:', err);
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleResetChanges = () => {
    setUsers(JSON.parse(JSON.stringify(originalUsers)));
    setHasChanges(false);
  };

  const handleAddUser = async () => {
    if (!selectedNewUserId) return;
    
    try {
      const { error } = await supabase
        .from('user_locations')
        .insert({
          user_id: selectedNewUserId,
          location_id: locationId,
          is_active: true,
          hourly_wage: null,
          transportation_cost: null
        });

      if (error) throw error;

      // データを再取得
      await fetchLocationDetails();
      await fetchAvailableUsers();
      
      setSelectedNewUserId('');
      setShowUserSelect(false);
      
      // 成功メッセージを表示
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
      successDiv.textContent = 'ユーザーを追加しました';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
      
    } catch (err) {
      console.error('ユーザー追加エラー:', err);
      setError(err instanceof Error ? err.message : 'ユーザーの追加に失敗しました');
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!window.confirm(`${userName}をこの拠点から削除しますか？`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_locations')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('location_id', locationId);

      if (error) throw error;

      // データを再取得
      await fetchLocationDetails();
      await fetchAvailableUsers();
      
      // 成功メッセージを表示
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
      successDiv.textContent = 'ユーザーを削除しました';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
      
    } catch (err) {
      console.error('ユーザー削除エラー:', err);
      setError(err instanceof Error ? err.message : 'ユーザーの削除に失敗しました');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getUnassignedUsers = () => {
    const assignedUserIds = users.map(u => u.user_id);
    return availableUsers.filter(user => !assignedUserIds.includes(user.id));
  };

  const getStatusColor = (status: WorkStatus) => {
    switch (status) {
      case '出勤': return 'bg-green-100 text-green-800';
      case '残業': return 'bg-blue-100 text-blue-800';
      case '遅刻': return 'bg-yellow-100 text-yellow-800';
      case '早退': return 'bg-orange-100 text-orange-800';
      case '早出': return 'bg-purple-100 text-purple-800';
      case '欠勤': return 'bg-red-100 text-red-800';
      case '要確認': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMonthDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      dates.push({
        day,
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.getDay(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    return dates;
  };

  const getUserShiftDataForDate = (userId: string, dateStr: string) => {
    const userShifts = allUsersShiftData[userId] || [];
    return userShifts.find(shift => shift.date === dateStr);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MapPin className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {location?.name || '拠点詳細'}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>拠点コード: {location?.code || '-'}</span>
              <span>作成日: {location?.created_at ? new Date(location.created_at).toLocaleDateString('ja-JP') : '-'}</span>
              {location?.address && <span>住所: {location.address}</span>}
            </div>
          </div>
        </div>
        
        {hasChanges && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetChanges}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              リセット
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? '保存中...' : '保存'}</span>
            </button>
          </div>
        )}
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* ユーザー一覧 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">配属ユーザー</h2>
            <span className="text-sm text-gray-500">({users.length}名)</span>
          </div>
          <button
            onClick={() => setShowUserSelect(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>ユーザー追加</span>
          </button>
        </div>

        {/* ユーザー追加UI */}
        {showUserSelect && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-3">新しいユーザーを追加</h3>
            <div className="flex items-center space-x-3">
              <select
                value={selectedNewUserId}
                onChange={(e) => setSelectedNewUserId(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">ユーザーを選択...</option>
                {getUnassignedUsers().map(user => (
                  <option key={user.id} value={user.id}>
                    {sanitizeUserName(user.display_name || user.line_user_id)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddUser}
                disabled={!selectedNewUserId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setShowUserSelect(false);
                  setSelectedNewUserId('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
            </div>
            {getUnassignedUsers().length === 0 && (
              <p className="text-sm text-blue-700 mt-2">すべてのユーザーが既に配属されています。</p>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  時給（税抜）
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  交通費
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((locationUser) => (
                <tr key={locationUser.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {sanitizeUserName(locationUser.user.display_name || locationUser.user.line_user_id)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <JapaneseYen className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={locationUser.hourly_wage || ''}
                        onChange={(e) => handleUserWageChange(locationUser.user_id, e.target.value)}
                        placeholder="時給"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">円</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={locationUser.transportation_cost || ''}
                        onChange={(e) => handleTransportationCostChange(locationUser.user_id, e.target.value)}
                        placeholder="片道費用"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">円</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleRemoveUser(
                        locationUser.user_id, 
                        sanitizeUserName(locationUser.user.display_name || locationUser.user.line_user_id)
                      )}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="ユーザーを削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 全ユーザーシフトグリッド表示 */}
      {users.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                配属ユーザーのシフト表
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-medium text-gray-900">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* シフトグリッド */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* ヘッダー（日付） */}
              <div className="flex border-b-2 border-gray-200">
                <div className="w-32 px-4 py-3 bg-gray-50 font-medium text-sm text-gray-900 border-r border-gray-200 sticky left-0 z-10">
                  ユーザー名
                </div>
                {getMonthDates().map((dateInfo) => (
                  <div
                    key={dateInfo.date}
                    className={`min-w-20 px-2 py-3 text-center text-xs font-medium border-r border-gray-200 ${
                      dateInfo.isWeekend 
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div>{dateInfo.day}</div>
                    <div className="text-xs opacity-75">
                      {['日', '月', '火', '水', '木', '金', '土'][dateInfo.dayOfWeek]}
                    </div>
                  </div>
                ))}
              </div>

              {/* ユーザー行 */}
              {users.map((user) => (
                <div key={user.user_id} className="flex border-b border-gray-200 hover:bg-gray-50">
                  <div className="w-32 px-4 py-3 font-medium text-sm text-gray-900 border-r border-gray-200 sticky left-0 z-10 bg-white">
                    <div className="truncate" title={sanitizeUserName(user.user.display_name || user.user.line_user_id)}>
                      {sanitizeUserName(user.user.display_name || user.user.line_user_id)}
                    </div>
                  </div>
                  {getMonthDates().map((dateInfo) => {
                    const shiftData = getUserShiftDataForDate(user.user_id, dateInfo.date);
                    return (
                      <div
                        key={`${user.user_id}-${dateInfo.date}`}
                        className={`min-w-20 px-1 py-2 text-center text-xs border-r border-gray-200 ${
                          dateInfo.isWeekend ? 'bg-red-50' : 'bg-white'
                        }`}
                      >
                        {shiftData && (
                          <div className="space-y-1">
                            {/* シフト時間 */}
                            {shiftData.shiftStartTime && shiftData.shiftEndTime && (
                              <div className="text-blue-600 font-medium">
                                {shiftData.shiftStartTime.substring(0, 5)}-{shiftData.shiftEndTime.substring(0, 5)}
                              </div>
                            )}
                            
                            {/* 出退勤時間 */}
                            {(shiftData.clockIn || shiftData.clockOut) && (
                              <div className="text-gray-600">
                                <div>{shiftData.clockIn || '-'}</div>
                                <div>{shiftData.clockOut || '-'}</div>
                              </div>
                            )}
                            
                            {/* ステータス */}
                            {shiftData.workStatus && (
                              <div className={`inline-block px-1 py-0.5 rounded text-xs font-medium ${getStatusColor(shiftData.workStatus)}`}>
                                {shiftData.workStatus === '出勤' ? '出' :
                                 shiftData.workStatus === '残業' ? '残' :
                                 shiftData.workStatus === '遅刻' ? '遅' :
                                 shiftData.workStatus === '早退' ? '早' :
                                 shiftData.workStatus === '欠勤' ? '欠' :
                                 shiftData.workStatus === '要確認' ? '要' : 
                                 shiftData.workStatus}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 凡例 */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">ステータス凡例:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">出: 出勤</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">残: 残業</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">遅: 遅刻</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">早: 早退</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">欠: 欠勤</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">要: 要確認</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationDetailPage;