import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User, Coffee, LogIn, LogOut, Menu } from 'lucide-react';
import ShiftCalendar from './components/ShiftCalendar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LineLogin from './components/LineLogin';
import AuthCallback from './components/AuthCallback';
import TimeRecordDashboard from './components/TimeRecordDashboard';
import { TimeRecordService } from './services/timeRecordService';

interface TimeEntry {
  id: string;
  type: 'check-in' | 'check-out' | 'break-start' | 'break-end';
  timestamp: Date;
  location: string;
}

const TimeTrackingApp: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workStatus, setWorkStatus] = useState<'out' | 'in' | 'break'>('out');
  const [selectedLocation, setSelectedLocation] = useState('本社');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getWorkStatusText = () => {
    switch (workStatus) {
      case 'out': return '勤務外';
      case 'in': return '勤務中';
      case 'break': return '休憩中';
      default: return '勤務外';
    }
  };

  const getWorkStatusColor = () => {
    switch (workStatus) {
      case 'out': return 'bg-gray-100 text-gray-600';
      case 'in': return 'bg-blue-100 text-blue-600';
      case 'break': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleTimeAction = (action: 'check-in' | 'check-out' | 'break-start' | 'break-end') => {
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      type: action,
      timestamp: new Date(),
      location: selectedLocation
    };

    setTimeEntries(prev => [newEntry, ...prev]);

    switch (action) {
      case 'check-in':
        setWorkStatus('in');
        break;
      case 'check-out':
        setWorkStatus('out');
        break;
      case 'break-start':
        setWorkStatus('break');
        break;
      case 'break-end':
        setWorkStatus('in');
        break;
    }
  };

  const isButtonDisabled = (action: 'check-in' | 'check-out' | 'break-start' | 'break-end') => {
    switch (action) {
      case 'check-in':
        return workStatus !== 'out';
      case 'check-out':
        return workStatus === 'out';
      case 'break-start':
        return workStatus !== 'in';
      case 'break-end':
        return workStatus !== 'break';
      default:
        return false;
    }
  };

  // 認証コールバックページの場合
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#CB8585' }}>
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合
  if (!isAuthenticated) {
    return <LineLogin />;
  }

  // 新しいダッシュボードを表示する場合（URLパラメータで切り替え）
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dashboard') === 'new') {
    return <TimeRecordDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#CB8585'}}>
                  <Clock className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">メイクミー勤怠</h1>
                <p className="text-xs text-gray-500">Time Tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.displayName}さん</p>
                <p className="text-xs text-gray-500">おつかれさまです</p>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          window.location.href = '/?dashboard=new';
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        新しいダッシュボード
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Login Status */}
        <div className="text-white text-center py-3 rounded-lg mb-6" style={{backgroundColor: '#CB8585'}}>
          <p className="text-sm font-medium">ログインしました</p>
        </div>

        {/* Date and Status */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <p className="text-lg font-medium text-gray-800">
              {formatDate(currentTime)}
            </p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getWorkStatusColor()}`}>
              {getWorkStatusText()}
            </span>
          </div>

          {/* Location Selector */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <MapPin className="w-4 h-4 text-gray-400" />
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#CB8585'} as React.CSSProperties}
            >
              <option value="本社">本社</option>
              <option value="支社">支社</option>
              <option value="在宅">在宅</option>
            </select>
          </div>
        </div>

        {/* Time Display */}
        <div className="text-center mb-12">
          <div className="text-7xl font-light text-gray-800 mb-2">
            {formatTime(currentTime)}
            <span className="text-3xl text-gray-500 ml-2">
              {currentTime.getSeconds().toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => handleTimeAction('check-in')}
            disabled={isButtonDisabled('check-in')}
            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
              isButtonDisabled('check-in')
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'text-white active:scale-95'
            }`}
            style={!isButtonDisabled('check-in') ? {
              backgroundColor: '#CB8585',
              borderColor: '#CB8585'
            } : {}}
            onMouseEnter={(e) => {
              if (!isButtonDisabled('check-in')) {
                e.currentTarget.style.backgroundColor = '#B87575';
                e.currentTarget.style.borderColor = '#B87575';
              }
            }}
            onMouseLeave={(e) => {
              if (!isButtonDisabled('check-in')) {
                e.currentTarget.style.backgroundColor = '#CB8585';
                e.currentTarget.style.borderColor = '#CB8585';
              }
            }}
          >
            <LogIn className="w-8 h-8 mb-2" />
            <span className="text-lg font-medium">出勤</span>
          </button>

          <button
            onClick={() => handleTimeAction('check-out')}
            disabled={isButtonDisabled('check-out')}
            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
              isButtonDisabled('check-out')
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white active:scale-95'
            }`}
            style={!isButtonDisabled('check-out') ? {
              borderColor: '#CB8585',
              color: '#CB8585'
            } : {}}
            onMouseEnter={(e) => {
              if (!isButtonDisabled('check-out')) {
                e.currentTarget.style.backgroundColor = '#FDF2F2';
              }
            }}
            onMouseLeave={(e) => {
              if (!isButtonDisabled('check-out')) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <LogOut className="w-8 h-8 mb-2" />
            <span className="text-lg font-medium">退勤</span>
          </button>

          <button
            onClick={() => handleTimeAction('break-start')}
            disabled={isButtonDisabled('break-start')}
            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
              isButtonDisabled('break-start')
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white active:scale-95'
            }`}
            style={!isButtonDisabled('break-start') ? {
              borderColor: '#CB8585',
              color: '#CB8585'
            } : {}}
            onMouseEnter={(e) => {
              if (!isButtonDisabled('break-start')) {
                e.currentTarget.style.backgroundColor = '#FDF2F2';
              }
            }}
            onMouseLeave={(e) => {
              if (!isButtonDisabled('break-start')) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <Coffee className="w-8 h-8 mb-2" />
            <span className="text-lg font-medium">休憩開始</span>
          </button>

          <button
            onClick={() => handleTimeAction('break-end')}
            disabled={isButtonDisabled('break-end')}
            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
              isButtonDisabled('break-end')
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white active:scale-95'
            }`}
            style={!isButtonDisabled('break-end') ? {
              borderColor: '#CB8585',
              color: '#CB8585'
            } : {}}
            onMouseEnter={(e) => {
              if (!isButtonDisabled('break-end')) {
                e.currentTarget.style.backgroundColor = '#FDF2F2';
              }
            }}
            onMouseLeave={(e) => {
              if (!isButtonDisabled('break-end')) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <Coffee className="w-8 h-8 mb-2" />
            <span className="text-lg font-medium">休憩終了</span>
          </button>
        </div>

        {/* Action Buttons with DB Integration */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <h3 className="text-sm font-medium text-gray-900 mb-3 text-center">Supabase連携打刻</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                try {
                  await TimeRecordService.createTimeRecord(user!, {
                    recordType: 'clock_in'
                  });
                  alert('出勤を記録しました！');
                } catch (error) {
                  alert('エラー: ' + (error instanceof Error ? error.message : '打刻に失敗しました'));
                }
              }}
              className="flex items-center justify-center px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
            >
              <LogIn className="w-4 h-4 mr-1" />
              出勤
            </button>
            <button
              onClick={async () => {
                try {
                  await TimeRecordService.createTimeRecord(user!, {
                    recordType: 'clock_out'
                  });
                  alert('退勤を記録しました！');
                } catch (error) {
                  alert('エラー: ' + (error instanceof Error ? error.message : '打刻に失敗しました'));
                }
              }}
              className="flex items-center justify-center px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1" />
              退勤
            </button>
            <button
              onClick={async () => {
                try {
                  await TimeRecordService.createTimeRecord(user!, {
                    recordType: 'break_start'
                  });
                  alert('休憩開始を記録しました！');
                } catch (error) {
                  alert('エラー: ' + (error instanceof Error ? error.message : '打刻に失敗しました'));
                }
              }}
              className="flex items-center justify-center px-3 py-2 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition-colors"
            >
              <Coffee className="w-4 h-4 mr-1" />
              休憩開始
            </button>
            <button
              onClick={async () => {
                try {
                  await TimeRecordService.createTimeRecord(user!, {
                    recordType: 'break_end'
                  });
                  alert('休憩終了を記録しました！');
                } catch (error) {
                  alert('エラー: ' + (error instanceof Error ? error.message : '打刻に失敗しました'));
                }
              }}
              className="flex items-center justify-center px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              <Coffee className="w-4 h-4 mr-1" />
              休憩終了
            </button>
          </div>
        </div>

        {/* Recent Entries */}
        {timeEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">本日の打刻履歴</h3>
            <div className="space-y-2">
              {timeEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      entry.type === 'check-in' ? 'bg-[#CB8585]' :
                      entry.type === 'check-out' ? 'bg-gray-500' :
                      'bg-orange-500'
                    }`} />
                    <span className="text-gray-600">
                      {entry.type === 'check-in' ? '出勤' :
                       entry.type === 'check-out' ? '退勤' :
                       entry.type === 'break-start' ? '休憩開始' : '休憩終了'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 font-medium">
                      {formatTime(entry.timestamp)}
                    </p>
                    <p className="text-gray-500 text-xs">{entry.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
        {/* Shift Calendar */}
        <div className="max-w-md mx-auto px-4 mt-8">
          <ShiftCalendar />
        </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <TimeTrackingApp />
    </AuthProvider>
  );
}

export default App;