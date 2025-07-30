import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User, Coffee, LogIn, LogOut, Menu } from 'lucide-react';
import ShiftCalendar from './components/ShiftCalendar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LineLogin from './components/LineLogin';
import AuthCallback from './components/AuthCallback';
import TimeRecordDashboard from './components/TimeRecordDashboard';

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

  // 認証済みの場合は新しいダッシュボードを表示
  return <TimeRecordDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <TimeTrackingApp />
    </AuthProvider>
  );
}

export default App;