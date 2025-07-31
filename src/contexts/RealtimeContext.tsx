import React, { createContext, useContext, useEffect, useState } from 'react';

interface RealtimeContextType {
  // 打刻記録の更新を通知
  notifyTimeRecordUpdate: () => void;
  // 打刻記録更新のリスナー登録
  onTimeRecordUpdate: (callback: () => void) => () => void;
  // 勤怠カレンダーの更新を通知
  notifyAttendanceUpdate: () => void;
  // 勤怠カレンダー更新のリスナー登録
  onAttendanceUpdate: (callback: () => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [timeRecordListeners, setTimeRecordListeners] = useState<Set<() => void>>(new Set());
  const [attendanceListeners, setAttendanceListeners] = useState<Set<() => void>>(new Set());

  const notifyTimeRecordUpdate = () => {
    console.log('🔄 打刻記録更新を通知:', timeRecordListeners.size, 'リスナー');
    timeRecordListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('打刻記録更新リスナーエラー:', error);
      }
    });
  };

  const onTimeRecordUpdate = (callback: () => void) => {
    setTimeRecordListeners(prev => new Set(prev).add(callback));
    
    // クリーンアップ関数を返す
    return () => {
      setTimeRecordListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  };

  const notifyAttendanceUpdate = () => {
    console.log('🔄 勤怠カレンダー更新を通知:', attendanceListeners.size, 'リスナー');
    attendanceListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('勤怠カレンダー更新リスナーエラー:', error);
      }
    });
  };

  const onAttendanceUpdate = (callback: () => void) => {
    setAttendanceListeners(prev => new Set(prev).add(callback));
    
    // クリーンアップ関数を返す
    return () => {
      setAttendanceListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  };

  const value: RealtimeContextType = {
    notifyTimeRecordUpdate,
    onTimeRecordUpdate,
    notifyAttendanceUpdate,
    onAttendanceUpdate,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};