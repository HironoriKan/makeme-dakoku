import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User, Coffee, LogIn, LogOut, Menu } from 'lucide-react';
import CalendarTabs from './components/CalendarTabs';
import CheckoutReportModal from './components/CheckoutReportModal';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LineLogin from './components/LineLogin';
import AuthCallback from './components/AuthCallback';
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
  const [dbRecords, setDbRecords] = useState<any[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutTime, setCheckoutTime] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // DBから今日の打刻記録を取得してローカル状態と同期
  useEffect(() => {
    const loadTodayRecords = async () => {
      if (!user) return;

      try {
        const records = await TimeRecordService.getTodayTimeRecords(user);
        setDbRecords(records);

        // 最新の記録に基づいて勤務状態を更新
        if (records.length > 0) {
          const lastRecord = records[records.length - 1];
          switch (lastRecord.record_type) {
            case 'clock_in':
              setWorkStatus('in');
              break;
            case 'clock_out':
              setWorkStatus('out');
              break;
            case 'break_start':
              setWorkStatus('break');
              break;
            case 'break_end':
              setWorkStatus('in');
              break;
          }

          // ローカルのtimeEntriesも同期
          const localEntries: TimeEntry[] = records.map(record => ({
            id: record.id,
            type: record.record_type === 'clock_in' ? 'check-in' :
                  record.record_type === 'clock_out' ? 'check-out' :
                  record.record_type === 'break_start' ? 'break-start' : 'break-end',
            timestamp: new Date(record.recorded_at),
            location: record.note?.replace('からの打刻', '') || '不明'
          })).reverse(); // 新しい順に並び替え

          setTimeEntries(localEntries);
        }
      } catch (error) {
        console.error('今日の記録取得エラー:', error);
      }
    };

    loadTodayRecords();
  }, [user]);

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

  const handleTimeAction = async (action: 'check-in' | 'check-out' | 'break-start' | 'break-end') => {
    if (!user) {
      alert('ユーザー情報が見つかりません');
      return;
    }

    try {
      // Supabaseに記録
      const recordTypeMap = {
        'check-in': 'clock_in' as const,
        'check-out': 'clock_out' as const,
        'break-start': 'break_start' as const,
        'break-end': 'break_end' as const
      };

      await TimeRecordService.createTimeRecord(user, {
        recordType: recordTypeMap[action],
        note: `${selectedLocation}からの打刻`
      });

      // ローカル状態も更新
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
          // 退勤時にモーダルを表示（退勤時刻を記録）
          setCheckoutTime(new Date().toISOString());
          setShowCheckoutModal(true);
          break;
        case 'break-start':
          setWorkStatus('break');
          break;
        case 'break-end':
          setWorkStatus('in');
          break;
      }

      // 成功メッセージ
      const actionLabels = {
        'check-in': '出勤',
        'check-out': '退勤',
        'break-start': '休憩開始',
        'break-end': '休憩終了'
      };
      
      // 一時的な成功表示
      const originalText = document.querySelector(`button[data-action="${action}"] span`)?.textContent;
      const buttonSpan = document.querySelector(`button[data-action="${action}"] span`);
      if (buttonSpan) {
        buttonSpan.textContent = '✓ 記録済み';
        setTimeout(() => {
          if (buttonSpan) buttonSpan.textContent = originalText || actionLabels[action];
        }, 2000);
      }

    } catch (error) {
      console.error('打刻エラー:', error);
      const message = error instanceof Error ? error.message : '打刻に失敗しました';
      alert(`エラー: ${message}`);
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
            data-action="check-in"
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
            data-action="check-out"
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
            data-action="break-start"
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
            data-action="break-end"
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

        {/* Recent Entries */}
        {timeEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
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
        {/* Calendar Tabs */}
        <div className="max-w-md mx-auto px-4 mt-8">
          <CalendarTabs />
        </div>

        {/* Checkout Report Modal */}
        <CheckoutReportModal
          isOpen={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false);
            setCheckoutTime(null);
          }}
          checkoutTime={checkoutTime}
        />

        {/* Footer */}
        <Footer />
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