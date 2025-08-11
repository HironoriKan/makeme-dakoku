import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LocationService, Location } from '../../services/locationService';
import { Tables } from '../../types/supabase';
import { Users, MapPin, Calendar, Clock } from 'lucide-react';

type User = Tables<'users'>;
type TimeRecord = Tables<'time_records'>;

interface UserAttendance {
  user: User;
  timeRecords: TimeRecord[];
  workPeriods: WorkPeriod[];
}

interface WorkPeriod {
  start: Date;
  end: Date | null;
  type: 'work' | 'break';
  location?: string;
}

const AttendanceGanttChart: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendance[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time constants
  const START_HOUR = 8;
  const END_HOUR = 23;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const MINUTES_PER_HOUR = 60;
  const MINUTE_INTERVAL = 15;

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedLocationId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch locations
      const locationsData = await LocationService.getAllLocations();
      setLocations(locationsData);

      // Fetch users based on location filter
      let usersQuery = supabase.from('users').select('*');
      
      if (selectedLocationId !== 'all') {
        // Filter users by location access
        const { data: userLocationAccess } = await supabase
          .from('user_location_access')
          .select('user_id')
          .eq('location_id', selectedLocationId);
        
        if (userLocationAccess && userLocationAccess.length > 0) {
          const userIds = userLocationAccess.map(access => access.user_id);
          usersQuery = usersQuery.in('id', userIds);
        } else {
          // No users have access to this location
          setUsers([]);
          setAttendanceData([]);
          setLoading(false);
          return;
        }
      }

      const { data: usersData, error: usersError } = await usersQuery.order('display_name');
      if (usersError) throw usersError;

      setUsers(usersData || []);

      // Fetch time records for the selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: timeRecordsData, error: timeRecordsError } = await supabase
        .from('time_records')
        .select('*')
        .gte('recorded_at', startOfDay.toISOString())
        .lte('recorded_at', endOfDay.toISOString())
        .order('recorded_at');

      if (timeRecordsError) throw timeRecordsError;

      // Process attendance data
      const attendanceMap: Record<string, UserAttendance> = {};
      
      (usersData || []).forEach(user => {
        attendanceMap[user.id] = {
          user,
          timeRecords: [],
          workPeriods: []
        };
      });

      // Group time records by user
      (timeRecordsData || []).forEach(record => {
        if (attendanceMap[record.user_id]) {
          attendanceMap[record.user_id].timeRecords.push(record);
        }
      });

      // Calculate work periods for each user
      Object.values(attendanceMap).forEach(userAttendance => {
        userAttendance.workPeriods = calculateWorkPeriods(userAttendance.timeRecords);
      });

      setAttendanceData(Object.values(attendanceMap));
    } catch (err) {
      setError(err instanceof Error ? err.message : '出勤情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkPeriods = (timeRecords: TimeRecord[]): WorkPeriod[] => {
    const periods: WorkPeriod[] = [];
    let currentWorkStart: Date | null = null;
    let currentBreakStart: Date | null = null;

    timeRecords.forEach(record => {
      const recordTime = new Date(record.recorded_at);

      switch (record.record_type) {
        case 'clock_in':
          if (!currentWorkStart) {
            currentWorkStart = recordTime;
          }
          break;

        case 'break_start':
          if (currentWorkStart && !currentBreakStart) {
            // Add work period before break
            periods.push({
              start: currentWorkStart,
              end: recordTime,
              type: 'work',
              location: record.location_name || undefined
            });
            currentBreakStart = recordTime;
          }
          break;

        case 'break_end':
          if (currentBreakStart) {
            // Add break period
            periods.push({
              start: currentBreakStart,
              end: recordTime,
              type: 'break',
              location: record.location_name || undefined
            });
            currentBreakStart = null;
            currentWorkStart = recordTime; // Resume work
          }
          break;

        case 'clock_out':
          if (currentWorkStart) {
            periods.push({
              start: currentWorkStart,
              end: recordTime,
              type: 'work',
              location: record.location_name || undefined
            });
            currentWorkStart = null;
          }
          if (currentBreakStart) {
            // Handle case where user forgot to end break
            periods.push({
              start: currentBreakStart,
              end: recordTime,
              type: 'break',
              location: record.location_name || undefined
            });
            currentBreakStart = null;
          }
          break;
      }
    });

    // Handle ongoing work (no clock_out yet)
    if (currentWorkStart) {
      periods.push({
        start: currentWorkStart,
        end: null, // Still working
        type: 'work'
      });
    }

    return periods;
  };

  const generateTimeHeaders = () => {
    const headers = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      headers.push(
        <div key={hour} className="flex-none w-24 text-center">
          <div className="text-xs font-medium text-gray-700 border-r border-gray-200 py-2">
            {hour.toString().padStart(2, '0')}:00
          </div>
        </div>
      );
    }
    return headers;
  };

  const generateTimeGrid = () => {
    const gridLines = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      for (let minute = 0; minute < MINUTES_PER_HOUR; minute += MINUTE_INTERVAL) {
        const isHourLine = minute === 0;
        gridLines.push(
          <div
            key={`${hour}-${minute}`}
            className={`absolute top-0 bottom-0 w-px ${
              isHourLine ? 'bg-gray-300' : 'bg-gray-100'
            }`}
            style={{
              left: `${((hour - START_HOUR) * MINUTES_PER_HOUR + minute) * (96 / MINUTES_PER_HOUR)}px`
            }}
          />
        );
      }
    }
    return gridLines;
  };

  const timeToPosition = (time: Date): number => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = (hours - START_HOUR) * MINUTES_PER_HOUR + minutes;
    return Math.max(0, (totalMinutes / MINUTES_PER_HOUR) * 96); // 96px per hour
  };

  const renderWorkPeriod = (period: WorkPeriod, userIndex: number): JSX.Element | null => {
    const startPos = timeToPosition(period.start);
    const endPos = period.end ? timeToPosition(period.end) : (TOTAL_HOURS * 96); // Full width if ongoing
    const width = Math.max(8, endPos - startPos); // Minimum 8px width

    if (startPos < 0 && endPos < 0) return null; // Outside visible range

    return (
      <div
        key={`${period.start.getTime()}-${period.type}`}
        className={`absolute h-6 rounded-sm shadow-sm border ${
          period.type === 'work' 
            ? 'bg-green-100 border-green-300 text-green-800' 
            : 'bg-orange-100 border-orange-300 text-orange-800'
        } ${!period.end ? 'animate-pulse' : ''}`}
        style={{
          left: `${Math.max(0, startPos)}px`,
          width: `${width}px`,
          top: `${userIndex * 48 + 12}px`
        }}
        title={`${period.type === 'work' ? '勤務' : '休憩'}: ${period.start.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        })} - ${period.end ? period.end.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        }) : '継続中'}${period.location ? ` (${period.location})` : ''}`}
      >
        <div className="text-xs px-1 truncate">
          {period.type === 'work' ? '勤務' : '休憩'}
          {!period.end && ' (継続中)'}
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">出勤状況</h3>
              <p className="text-sm text-gray-600">{formatDate(selectedDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Date Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Location Filter */}
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-6 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Gantt Chart */}
      <div className="p-6">
        {attendanceData.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedLocationId === 'all' 
                ? 'この日の出勤情報がありません' 
                : '選択した拠点にアクセス権のあるユーザーがいません'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Time Header */}
            <div className="flex items-center mb-4 pl-32">
              <div className="flex overflow-x-auto" style={{ width: `${TOTAL_HOURS * 96 + 96}px` }}>
                {generateTimeHeaders()}
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative overflow-x-auto">
              <div className="flex">
                {/* User Names */}
                <div className="flex-none w-32">
                  {attendanceData.map((userAttendance, index) => (
                    <div
                      key={userAttendance.user.id}
                      className="h-12 flex items-center px-4 border-b border-gray-100 bg-gray-50"
                    >
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {userAttendance.user.display_name}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div 
                  className="relative bg-white border-l border-gray-200"
                  style={{ width: `${TOTAL_HOURS * 96 + 96}px`, height: `${attendanceData.length * 48}px` }}
                >
                  {/* Grid Lines */}
                  {generateTimeGrid()}

                  {/* User Rows */}
                  {attendanceData.map((userAttendance, index) => (
                    <div key={userAttendance.user.id}>
                      <div
                        className="absolute left-0 right-0 h-px bg-gray-100"
                        style={{ top: `${(index + 1) * 48}px` }}
                      />
                      {/* Work Periods */}
                      {userAttendance.workPeriods.map((period) =>
                        renderWorkPeriod(period, index)
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded-sm"></div>
                <span className="text-gray-600">勤務時間</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded-sm"></div>
                <span className="text-gray-600">休憩時間</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded-sm animate-pulse"></div>
                <span className="text-gray-600">継続中</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceGanttChart;