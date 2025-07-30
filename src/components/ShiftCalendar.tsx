import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ShiftService, ShiftData } from '../services/shiftService';
import { Database } from '../types/supabase';

type Shift = Database['public']['Tables']['shifts']['Row'];
type ShiftType = Database['public']['Enums']['shift_type'];

interface ShiftCalendarProps {
  availableDates?: number[];
}

const ShiftCalendar: React.FC<ShiftCalendarProps> = ({ 
  availableDates = [] 
}) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonthShifts, setCurrentMonthShifts] = useState<Shift[]>([]);
  const [nextMonthShifts, setNextMonthShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftData | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 月の最初の日と最後の日を取得
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 月の最初の日の曜日（0=日曜日）
  const firstDayOfWeek = firstDay.getDay();
  
  // 月の日数
  const daysInMonth = lastDay.getDate();

  // シフトデータを読み込み
  const loadShifts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // 現在月のシフトを取得
      const currentShifts = await ShiftService.getMonthlyShifts(user, year, month + 1);
      setCurrentMonthShifts(currentShifts);

      // 次月のシフトを取得
      const nextMonth = month + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const adjustedNextMonth = nextMonth > 11 ? 0 : nextMonth;
      
      const nextShifts = await ShiftService.getMonthlyShifts(user, nextYear, adjustedNextMonth + 1);
      setNextMonthShifts(nextShifts);

      console.log('✅ シフト読み込み完了:', { 
        current: currentShifts.length, 
        next: nextShifts.length 
      });
    } catch (error) {
      console.error('❌ シフト読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [user, currentDate]);

  // 指定日のシフトを取得
  const getShiftForDate = (shifts: Shift[], date: string): Shift | undefined => {
    return shifts.find(shift => shift.shift_date === date);
  };

  // 前月に移動
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 次月に移動
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // カレンダーのグリッドを生成
  const generateCalendarDays = (targetYear: number, targetMonth: number, shifts: Shift[], isCurrentMonth: boolean = false) => {
    const firstDay = new Date(targetYear, targetMonth, 1);
    const lastDay = new Date(targetYear, targetMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
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
      const dateString = `${targetYear}-${(targetMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const shift = getShiftForDate(shifts, dateString);
      // シフトデータのみでマークアップを決定
      
      days.push(
        <div
          key={day}
          className="aspect-square flex items-center justify-center text-sm font-medium relative cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => isCurrentMonth && handleDateClick(dateString, shift)}
        >
          {shift ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
              style={{ backgroundColor: ShiftService.getShiftTypeColor(shift.shift_type) }}
            >
              {day}
            </div>
          ) : (
            <span className="text-gray-800 hover:text-gray-600">{day}</span>
          )}
          
          {/* 編集可能な現在月にプラスアイコンを表示 */}
          {isCurrentMonth && !shift && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-gray-300 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Plus className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  // 日付クリック処理
  const handleDateClick = (dateString: string, existingShift?: Shift) => {
    if (!user) return;

    setSelectedDate(dateString);
    
    if (existingShift) {
      // 既存シフトの編集
      setEditingShift({
        date: dateString,
        shiftType: existingShift.shift_type,
        shiftStatus: existingShift.shift_status,
        startTime: existingShift.start_time ? ShiftService.formatTime(existingShift.start_time) : '',
        endTime: existingShift.end_time ? ShiftService.formatTime(existingShift.end_time) : '',
        note: existingShift.note || ''
      });
    } else {
      // 新規シフト作成
      setEditingShift({
        date: dateString,
        shiftType: '',
        shiftStatus: 'adjusting',
        startTime: '09:00',
        endTime: '17:00',
        note: ''
      });
    }
  };

  // シフト保存
  const handleSaveShift = async () => {
    if (!user || !editingShift) return;

    try {
      await ShiftService.createOrUpdateShift(user, editingShift);
      setEditingShift(null);
      setSelectedDate(null);
      await loadShifts(); // データを再読み込み
      console.log('✅ シフト保存成功');
    } catch (error) {
      console.error('❌ シフト保存エラー:', error);
      alert('シフトの保存に失敗しました: ' + (error instanceof Error ? error.message : ''));
    }
  };

  // シフト削除
  const handleDeleteShift = async () => {
    if (!user || !selectedDate) return;

    try {
      await ShiftService.deleteShift(user, selectedDate);
      setEditingShift(null);
      setSelectedDate(null);
      await loadShifts(); // データを再読み込み
      console.log('✅ シフト削除成功');
    } catch (error) {
      console.error('❌ シフト削除エラー:', error);
      alert('シフトの削除に失敗しました: ' + (error instanceof Error ? error.message : ''));
    }
  };

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

  // 次月の情報を計算
  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const adjustedNextMonth = nextMonth > 11 ? 0 : nextMonth;

  return (
    <div className="space-y-4">
      {/* 現在月のカレンダー */}
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
            {year}年 {monthNames[month]}
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
          {generateCalendarDays(year, month, currentMonthShifts, true)}
        </div>

        {/* 凡例 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: ShiftService.getShiftTypeColor('early') }}
              />
              <span className="text-gray-600 text-xs">早番</span>
            </div>
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: ShiftService.getShiftTypeColor('late') }}
              />
              <span className="text-gray-600 text-xs">遅番</span>
            </div>
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: ShiftService.getShiftTypeColor('normal') }}
              />
              <span className="text-gray-600 text-xs">通常</span>
            </div>
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: ShiftService.getShiftTypeColor('off') }}
              />
              <span className="text-gray-600 text-xs">休み希望</span>
            </div>
          </div>
          <span className="text-gray-500">
            {isLoading ? '読み込み中...' : `シフト登録：${currentMonthShifts.length}日`}
          </span>
        </div>
      </div>

      {/* 次月のカレンダー */}
      <div className="bg-white rounded-lg shadow-sm p-4 aspect-square">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-6 h-6"></div> {/* 空のスペース */}
          
          <h3 className="text-lg font-medium text-gray-900">
            {nextYear}年 {monthNames[adjustedNextMonth]}
          </h3>
          
          <div className="w-6 h-6"></div> {/* 空のスペース */}
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
          {generateCalendarDays(nextYear, adjustedNextMonth, nextMonthShifts)}
        </div>

        {/* 凡例 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: ShiftService.getShiftTypeColor('early') }}
              />
              <span className="text-gray-600 text-xs">早番</span>
            </div>
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: ShiftService.getShiftTypeColor('late') }}
              />
              <span className="text-gray-600 text-xs">遅番</span>
            </div>
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: ShiftService.getShiftTypeColor('normal') }}
              />
              <span className="text-gray-600 text-xs">通常</span>
            </div>
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: ShiftService.getShiftTypeColor('off') }}
              />
              <span className="text-gray-600 text-xs">休み希望</span>
            </div>
          </div>
          <span className="text-gray-500">
            シフト登録：{nextMonthShifts.length}日
          </span>
        </div>
      </div>

      {/* シフト編集モーダル */}
      {editingShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                シフト編集 - {new Date(editingShift.date).toLocaleDateString('ja-JP')}
              </h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                editingShift.shiftStatus === 'confirmed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {ShiftService.getShiftStatusLabel(editingShift.shiftStatus || 'adjusting')}
              </div>
            </div>
            
            <div className="space-y-4">
              {/* シフトタイプ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  シフトタイプ
                </label>
                <select
                  value={editingShift.shiftType}
                  onChange={(e) => setEditingShift({
                    ...editingShift,
                    shiftType: e.target.value as ShiftType
                  })}
                  disabled={editingShift.shiftStatus === 'confirmed'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editingShift.shiftStatus === 'confirmed' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">シフト未設定</option>
                  <option value="early">早番(オープン)</option>
                  <option value="late">遅番(締め)</option>
                  <option value="normal">通常入店</option>
                  <option value="off">休み希望</option>
                </select>
              </div>

              {/* 開始時間 */}
              {editingShift.shiftType && editingShift.shiftType !== 'off' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始時間
                  </label>
                  <input
                    type="time"
                    value={editingShift.startTime || ''}
                    onChange={(e) => setEditingShift({
                      ...editingShift,
                      startTime: e.target.value
                    })}
                    disabled={editingShift.shiftStatus === 'confirmed'}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editingShift.shiftStatus === 'confirmed' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              )}

              {/* 終了時間 */}
              {editingShift.shiftType && editingShift.shiftType !== 'off' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    終了時間
                  </label>
                  <input
                    type="time"
                    value={editingShift.endTime || ''}
                    onChange={(e) => setEditingShift({
                      ...editingShift,
                      endTime: e.target.value
                    })}
                    disabled={editingShift.shiftStatus === 'confirmed'}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editingShift.shiftStatus === 'confirmed' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              )}

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ
                </label>
                <textarea
                  value={editingShift.note || ''}
                  onChange={(e) => setEditingShift({
                    ...editingShift,
                    note: e.target.value
                  })}
                  disabled={editingShift.shiftStatus === 'confirmed'}
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editingShift.shiftStatus === 'confirmed' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="メモを入力（任意）"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div>
                {selectedDate && getShiftForDate(currentMonthShifts, selectedDate) && editingShift.shiftStatus === 'adjusting' && (
                  <button
                    onClick={handleDeleteShift}
                    className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setEditingShift(null);
                    setSelectedDate(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {editingShift.shiftStatus === 'confirmed' ? '閉じる' : 'キャンセル'}
                </button>
                {editingShift.shiftStatus === 'adjusting' && (
                  <button
                    onClick={handleSaveShift}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    保存
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftCalendar;