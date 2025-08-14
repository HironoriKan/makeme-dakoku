import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables, Enums } from '../../types/supabase';
import { Calendar, ChevronLeft, ChevronRight, Clock, Edit, Check, X, Plus } from 'lucide-react';
import { truncateUserName } from '../../utils/textUtils';
import { ShiftService } from '../../services/shiftService';

type Shift = Tables<'shifts'>;
type ShiftType = Enums<'shift_type'>;
type ShiftStatus = Enums<'shift_status'>;

interface AdminShiftCalendarProps {
  selectedUserId: string | null;
  onShiftEdit: (shift: Shift) => void;
  onAddShift?: (date: Date) => void;
  fullHeight?: boolean;
}

const AdminShiftCalendar: React.FC<AdminShiftCalendarProps> = ({
  selectedUserId,
  onShiftEdit,
  onAddShift,
  fullHeight = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShifts();
  }, [currentDate, selectedUserId]);

  const fetchShifts = async () => {
    setLoading(true);
    setError(null);

    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      let query = supabase
        .from('shifts')
        .select(`
          *,
          users (
            display_name,
            picture_url
          )
        `)
        .gte('shift_date', startDate.toISOString().split('T')[0])
        .lte('shift_date', endDate.toISOString().split('T')[0])
        .order('shift_date', { ascending: true });

      if (selectedUserId) {
        query = query.eq('user_id', selectedUserId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setShifts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'シフトデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveShift = async (shiftId: string) => {
    try {
      const { error } = await supabase
        .from('shifts')
        .update({ shift_status: 'confirmed' })
        .eq('id', shiftId);

      if (error) throw error;

      // Update local state
      setShifts(prev =>
        prev.map(shift =>
          shift.id === shiftId ? { ...shift, shift_status: 'confirmed' } : shift
        )
      );
    } catch (err) {
      console.error('Shift approval error:', err);
      alert('シフトの承認に失敗しました');
    }
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }

    // Next month's days to fill the grid
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  const getShiftsForDate = (date: Date): Shift[] => {
    const dateString = date.toISOString().split('T')[0];
    return shifts.filter(shift => shift.shift_date === dateString);
  };

  const getShiftTypeLabel = (shiftType: ShiftType) => {
    const labels = {
      normal: '通常',
      early: '早番',
      late: '遅番',
      off: '休み'
    };
    return labels[shiftType] || shiftType;
  };

  const getShiftTypeColor = (shiftType: ShiftType) => {
    // 保存時に正しいshift_typeが設定されるため、シンプルに返す
    const colors = {
      normal: 'bg-blue-100 text-blue-800',
      early: 'bg-yellow-100 text-yellow-800',
      late: 'bg-purple-100 text-purple-800',
      off: 'bg-gray-100 text-gray-800'
    };
    return colors[shiftType] || 'bg-gray-100 text-gray-800';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const containerClass = fullHeight 
    ? "h-full flex flex-col bg-white"
    : "bg-white rounded-lg shadow-sm border";
    
  const headerClass = fullHeight
    ? "flex-shrink-0 px-4 py-3 border-b border-gray-200"
    : "p-6 border-b border-gray-200";
    
  const contentClass = fullHeight
    ? "flex-1 p-4 overflow-hidden"
    : "p-6";
    
  const gridClass = fullHeight
    ? "grid grid-cols-7 gap-1 h-full"
    : "grid grid-cols-7 gap-1";
    
  const cellClass = fullHeight
    ? "border border-gray-200 p-2 relative group overflow-hidden"
    : "min-h-[120px] border border-gray-200 p-2 relative group";

  return (
    <div className={containerClass}>
      {/* Compact Header */}
      <div className={headerClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h2 className={`font-semibold text-gray-900 ${fullHeight ? 'text-lg' : 'text-xl'}`}>
              シフト管理カレンダー
            </h2>
            {selectedUserId && (
              <span className="text-sm text-gray-500">（選択中ユーザー表示）</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="px-3 py-1 bg-gray-50 rounded-lg min-w-[100px] text-center">
              <span className="text-sm font-medium text-gray-900">
                {currentDate.getFullYear()}年{monthNames[currentDate.getMonth()]}
              </span>
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className={contentClass}>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        ) : (
          <div className={gridClass}>
            {/* Week day headers */}
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`p-2 text-center text-sm font-medium bg-gray-50 border border-gray-200 ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {getMonthDays().map(({ date, isCurrentMonth }, index) => {
              const dayShifts = getShiftsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`${cellClass} ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  style={fullHeight ? { minHeight: 'calc((100vh - 200px) / 7)' } : {}}
                >
                  <div
                    className={`text-xs font-medium mb-1 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${
                      index % 7 === 0 ? 'text-red-600' : index % 7 === 6 ? 'text-blue-600' : ''
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  <div className="space-y-1 flex-1 overflow-y-auto">
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="relative group"
                      >
                        <div
                          className={`text-xs px-2 py-1 rounded cursor-pointer hover:shadow-sm transition-shadow ${getShiftTypeColor(
                            shift.shift_type
                          )}`}
                          onClick={() => onShiftEdit(shift)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">
                              {!selectedUserId && (shift.users as any)?.display_name && (
                                <span className="font-medium">
                                  {truncateUserName((shift.users as any).display_name, 4)}
                                </span>
                              )}
                            </span>
                            <div className="flex items-center space-x-1">
                              {shift.shift_status === 'adjusting' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveShift(shift.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-green-200 rounded"
                                  title="承認"
                                >
                                  <Check className="w-3 h-3 text-green-600" />
                                </button>
                              )}
                              <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span>{getShiftTypeLabel(shift.shift_type)}</span>
                            <div className="flex items-center space-x-1">
                              {shift.shift_status === 'adjusting' && (
                                <div className="w-2 h-2 bg-orange-400 rounded-full" title="承認待ち" />
                              )}
                              {shift.shift_status === 'confirmed' && (
                                <div className="w-2 h-2 bg-green-400 rounded-full" title="承認済み" />
                              )}
                            </div>
                          </div>
                          {(shift.start_time || shift.end_time) && (
                            <div className="text-xs text-gray-600 mt-1 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {shift.start_time || '--'}～{shift.end_time || '--'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Shift Button - Show when user is selected and for current month dates */}
                    {selectedUserId && onAddShift && isCurrentMonth && (
                      <button
                        onClick={() => onAddShift(date)}
                        className="w-full mt-1 p-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        title="シフトを追加"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        追加
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compact Legend */}
      {!fullHeight && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span className="text-sm text-gray-600">承認待ち</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">承認済み</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">今日</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShiftCalendar;