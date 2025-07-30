import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import ShiftCalendar from './ShiftCalendar';
import AttendanceCalendar from './AttendanceCalendar';

type TabType = 'schedule' | 'attendance';

const CalendarTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  return (
    <div className="space-y-4">
      {/* タブヘッダー */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'text-white border-b-2 border-transparent'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
            style={activeTab === 'schedule' ? { 
              backgroundColor: '#CB8585',
              borderBottomColor: '#CB8585'
            } : {}}
          >
            <Calendar className="w-4 h-4 mr-2" />
            シフト予定
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'attendance'
                ? 'text-white border-b-2 border-transparent'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
            style={activeTab === 'attendance' ? { 
              backgroundColor: '#CB8585',
              borderBottomColor: '#CB8585'
            } : {}}
          >
            <Clock className="w-4 h-4 mr-2" />
            勤怠実績
          </button>
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="min-h-0">
        {activeTab === 'schedule' && <ShiftCalendar />}
        {activeTab === 'attendance' && <AttendanceCalendar />}
      </div>
    </div>
  );
};

export default CalendarTabs;