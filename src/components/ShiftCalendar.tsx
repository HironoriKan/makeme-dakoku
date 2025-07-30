import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ShiftCalendarProps {
  availableDates?: number[];
}

const ShiftCalendar: React.FC<ShiftCalendarProps> = ({ 
  availableDates = [4, 5, 7, 8, 10, 11, 12, 15, 17, 18, 19, 20, 22, 23, 24, 27, 28] 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 月の最初の日と最後の日を取得
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 月の最初の日の曜日（0=日曜日）
  const firstDayOfWeek = firstDay.getDay();
  
  // 月の日数
  const daysInMonth = lastDay.getDate();

  // 前月に移動
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 次月に移動
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // カレンダーのグリッドを生成（現在月用）
  const generateCalendarDays = (targetYear: number, targetMonth: number, availableDatesForMonth: number[]) => {
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
      const isAvailable = availableDatesForMonth.includes(day);
      days.push(
        <div
          key={day}
          className="aspect-square flex items-center justify-center text-sm font-medium relative"
        >
          {isAvailable ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: '#CB8585' }}
            >
              {day}
            </div>
          ) : (
            <span className="text-gray-800">{day}</span>
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

  // 次月の情報を計算
  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const adjustedNextMonth = nextMonth > 11 ? 0 : nextMonth;

  // 次月の利用可能日（現在は空配列として初期化）
  const nextMonthAvailableDates: number[] = [];

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
          {generateCalendarDays(year, month, availableDates)}
        </div>

        {/* 凡例 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: '#CB8585' }}
            />
            <span className="text-gray-600">入店日</span>
          </div>
          <span className="text-gray-500">
            合計入店日：{availableDates.length}日
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
          {generateCalendarDays(nextYear, adjustedNextMonth, nextMonthAvailableDates)}
        </div>

        {/* 凡例 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: '#CB8585' }}
            />
            <span className="text-gray-600">入店日</span>
          </div>
          <span className="text-gray-500">
            合計入店日：{nextMonthAvailableDates.length}日
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShiftCalendar;