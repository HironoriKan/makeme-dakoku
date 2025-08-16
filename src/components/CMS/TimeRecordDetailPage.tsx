import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  ArrowLeft,
  Coffee,
  Timer,
  AlertCircle,
  Save
} from 'lucide-react';
import { sanitizeUserName } from '../../utils/textUtils';

type UserType = Tables<'users'>;
type TimeRecord = Tables<'time_records'>;
type WorkPattern = Tables<'work_patterns'>;

interface TimeRecordWithDetails extends TimeRecord {
  work_pattern?: WorkPattern;
}

type WorkStatus = '出勤' | '残業' | '遅刻' | '早退' | '早出' | '欠勤' | '要確認' | '';

interface DailyAttendanceRecord {
  date: string;
  workPattern?: string;
  shiftStartTime?: string; // シフト出勤時間
  shiftEndTime?: string; // シフト退勤時間
  clockIn?: string;
  clockOut?: string;
  breakTime: number; // 分
  totalWorkTime: number; // 分（拘束時間）
  actualWorkTime: number; // 分（実働時間）
  overtimeMinutes: number; // 残業時間（分）
  lateMinutes: number; // 遅刻時間（分）
  earlyLeaveMinutes: number; // 早退時間（分）
  workStatus: WorkStatus; // 稼働ステータス
  
  // 打刻記録
  records: {
    clockIn?: string;
    clockOut?: string;
    breakStart?: string;
    breakEnd?: string;
    clockInId?: string;
    clockOutId?: string;
    breakStartId?: string;
    breakEndId?: string;
  };
}

interface TimeRecordDetailPageProps {
  userId: string;
  userName: string;
  year: number;
  month: number;
  onBack: () => void;
}

const TimeRecordDetailPage: React.FC<TimeRecordDetailPageProps> = ({
  userId,
  userName,
  year,
  month,
  onBack
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyAttendanceRecord[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(year, month - 1, 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{date: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalRecords, setOriginalRecords] = useState<DailyAttendanceRecord[]>([]);
  const [editedFields, setEditedFields] = useState<{[date: string]: string[]}>({});

  useEffect(() => {
    fetchUserAndRecords();
  }, [userId, currentDate]);

  const fetchUserAndRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      // ユーザー情報を取得
      console.log('ユーザー情報取得開始:', userId);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('ユーザー情報取得エラー:', userError);
        throw new Error(`ユーザー情報の取得に失敗: ${userError.message}`);
      }
      console.log('ユーザー情報取得成功:', userData);
      setUser(userData);

      // 月の日数を取得
      const targetYear = currentDate.getFullYear();
      const targetMonth = currentDate.getMonth() + 1;
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);
      
      // その月のすべての日付を生成
      const dates: string[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      // 打刻記録を取得（勤務パターンとシフト情報も含む）
      console.log('打刻記録取得開始:', {
        userId,
        startDate: startDate.toISOString(),
        endDate: new Date(targetYear, targetMonth, 1).toISOString()
      });
      const { data: timeRecords, error: recordsError } = await supabase
        .from('time_records')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .lt('recorded_at', new Date(targetYear, targetMonth, 1).toISOString())
        .order('recorded_at');

      if (recordsError) {
        console.error('打刻記録取得エラー:', recordsError);
        throw new Error(`打刻記録の取得に失敗: ${recordsError.message}`);
      }
      console.log('打刻記録取得成功:', timeRecords?.length, '件');

      // シフト情報を取得
      console.log('シフト情報取得開始:', {
        userId,
        startDate: dates[0],
        endDate: dates[dates.length - 1]
      });
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId)
        .gte('shift_date', dates[0])
        .lte('shift_date', dates[dates.length - 1]);

      if (shiftsError) {
        console.error('シフト情報取得エラー:', shiftsError);
        throw new Error(`シフト情報の取得に失敗: ${shiftsError.message}`);
      }
      console.log('シフト情報取得成功:', shifts?.length, '件');

      // 日別にデータを整理
      const dailyRecordsMap: { [date: string]: DailyAttendanceRecord } = {};

      dates.forEach(date => {
        dailyRecordsMap[date] = {
          date,
          breakTime: 0,
          totalWorkTime: 0,
          actualWorkTime: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          workStatus: '',
          records: {}
        };
      });

      // 時刻をHH:MM形式にフォーマットする関数
      const formatTimeToHHMM = (timeString: string | null): string => {
        if (!timeString) return '-';
        // HH:MM:SS形式からHH:MM形式に変換
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2) {
          return `${timeParts[0]}:${timeParts[1]}`;
        }
        return timeString;
      };

      // 勤怠ロジック設定を取得
      const { data: logicSettings, error: logicError } = await supabase
        .from('attendance_logic_settings')
        .select('*')
        .eq('setting_key', 'attendance_status_logic')
        .single();
      
      // 休憩時間設定を取得（全体設定と拠点別設定）
      const { data: breakTimeSettings, error: breakError } = await supabase
        .from('break_time_settings')
        .select('*')
        .eq('is_active', true)
        .order('location_id', { ascending: true, nullsFirst: true });
      
      let config: any = {
        early_arrival_status: '出勤',
        late_arrival_status: '遅刻',
        early_departure_status: '早退',
        normal_work_status: '出勤',
        absence_status: '欠勤',
        conflict_status: '要確認',
        auto_adjust_clock_in: true,
        auto_adjust_clock_out: false
      };
      
      if (logicSettings && !logicError) {
        config = logicSettings.setting_value;
      }

      // 勤怠ステータス自動判定の関数（設定適用日時以降のみ適用）
      const determineWorkStatus = (recordDate: string, shiftStart: string | null, shiftEnd: string | null, 
                                 clockInTime: string | null, clockOutTime: string | null): {
        status: WorkStatus;
        clockIn?: string;
        clockOut?: string;
      } => {
        // 設定適用日時以降のデータのみ自動判定を適用
        const recordDateTime = new Date(recordDate);
        const appliedFromDate = logicSettings ? new Date(logicSettings.applied_from) : new Date();
        
        // 設定適用日時より前のデータは既存のステータスを保持（空の場合のみデフォルトロジック適用）
        if (recordDateTime < appliedFromDate) {
          // 既存データ保護: 簡易的な判定のみ
          if (shiftStart && !clockInTime) {
            return { status: '欠勤', clockIn: undefined, clockOut: undefined };
          }
          if (!shiftStart && clockInTime) {
            return { status: '出勤', clockIn: clockInTime, clockOut: clockOutTime };
          }
          if (!shiftStart && !clockInTime) {
            return { status: '', clockIn: undefined, clockOut: undefined };
          }
          return { status: '出勤', clockIn: clockInTime, clockOut: clockOutTime };
        }
        
        const statuses: WorkStatus[] = [];
        const finalClockIn = clockInTime;
        const finalClockOut = clockOutTime;
        
        // シフトあり・打刻なしの場合は欠勤
        if (shiftStart && !clockInTime) {
          return { status: config.absence_status as WorkStatus, clockIn: undefined, clockOut: undefined };
        }
        
        // シフトなし・打刻ありの場合は出勤
        if (!shiftStart && clockInTime) {
          return { status: config.normal_work_status as WorkStatus, clockIn: clockInTime, clockOut: clockOutTime };
        }
        
        // シフトも打刻もない場合は空
        if (!shiftStart && !clockInTime) {
          return { status: '', clockIn: undefined, clockOut: undefined };
        }
        
        if (shiftStart && clockInTime) {
          const shiftStartTime = new Date(`1970-01-01 ${shiftStart}:00`);
          const punchInTime = new Date(`1970-01-01 ${clockInTime}:00`);
          
          if (punchInTime < shiftStartTime) {
            // シフトより早い打刻: 通常勤務として扱う
            statuses.push(config.normal_work_status as WorkStatus);
          } else if (punchInTime > shiftStartTime) {
            // シフトより遅い打刻: 遅刻
            statuses.push(config.late_arrival_status as WorkStatus);
          } else {
            // 同時刻: 出勤
            statuses.push(config.normal_work_status as WorkStatus);
          }
        }
        
        if (shiftEnd && clockOutTime) {
          const shiftEndTime = new Date(`1970-01-01 ${shiftEnd}:00`);
          const punchOutTime = new Date(`1970-01-01 ${clockOutTime}:00`);
          
          if (punchOutTime < shiftEndTime) {
            // シフトより早い退勤: 早退
            statuses.push(config.early_departure_status as WorkStatus);
          } else if (punchOutTime > shiftEndTime) {
            // シフトより遅い退勤: 通常勤務として扱う
            // 出勤（通常勤務）
            if (!statuses.includes(config.late_arrival_status as WorkStatus) && !statuses.includes(config.normal_work_status as WorkStatus)) {
              statuses.push(config.normal_work_status as WorkStatus);
            }
          }
        }
        
        // ステータスが複数ある場合は要確認
        if (statuses.length > 1) {
          return { status: config.conflict_status as WorkStatus, clockIn: finalClockIn, clockOut: finalClockOut };
        }
        
        return {
          status: statuses.length > 0 ? statuses[0] : (config.normal_work_status as WorkStatus),
          clockIn: finalClockIn,
          clockOut: finalClockOut
        };
      };
      
      // 休憩時間設定から休憩時間を計算する関数
      const calculateBreakTimeFromSettings = (workHours: number, settings: any[], locationPattern?: string): number => {
        // 拠点別設定を優先して適用
        let applicableSetting = null;
        
        // 拠点パターンから拠点IDを抽出し、該当する設定を探す
        for (const setting of settings) {
          if (setting.location_id) {
            // 拠点別設定の場合、パターンマッチングで確認
            // ここでは簡易的に拠点IDが含まれているかをチェック
            if (locationPattern && locationPattern.includes(setting.location_id)) {
              applicableSetting = setting;
              break;
            }
          }
        }
        
        // 拠点別設定がない場合は全体設定を使用
        if (!applicableSetting) {
          applicableSetting = settings.find(s => s.location_id === null);
        }
        
        if (!applicableSetting || !applicableSetting.break_rules) {
          // 設定がない場合はデフォルトロジック（6時間以上で1時間）
          return workHours >= 6 ? 60 : 0;
        }
        
        // 休憩ルールを適用
        for (const rule of applicableSetting.break_rules) {
          if (workHours >= rule.min_work_hours && workHours < rule.max_work_hours) {
            return rule.break_minutes;
          }
          // 最大拘束時間が高いルールは以上の場合も含む
          if (rule.max_work_hours >= 12 && workHours >= rule.min_work_hours) {
            return rule.break_minutes;
          }
        }
        
        // マッチしない場合はデフォルト
        return workHours >= 6 ? 60 : 0;
      };

      // シフト情報を各日に設定
      shifts?.forEach(shift => {
        const shiftDate = shift.shift_date;
        if (dailyRecordsMap[shiftDate]) {
          // 拠点IDとタイプを組み合わせた勤務パターンを作成（拠点名は後で取得）
          const locationId = shift.location_id || 'なし';
          const shiftType = shift.shift_type || 'なし';
          dailyRecordsMap[shiftDate].workPattern = `拠点${locationId} / ${shiftType}`;
          dailyRecordsMap[shiftDate].shiftStartTime = formatTimeToHHMM(shift.start_time);
          dailyRecordsMap[shiftDate].shiftEndTime = formatTimeToHHMM(shift.end_time);
        }
      });

      // 日別の打刻記録を整理
      const dailyPunchRecordsMap: { [date: string]: { [type: string]: string[] } } = {};
      
      // 初期化
      dates.forEach(date => {
        dailyPunchRecordsMap[date] = {
          clock_in: [],
          clock_out: [],
          break_start: [],
          break_end: []
        };
      });

      // 打刻データを日別に分類
      timeRecords?.forEach(record => {
        const recordDate = new Date(record.recorded_at).toISOString().split('T')[0];
        const recordTime = new Date(record.recorded_at).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        if (dailyRecordsMap[recordDate] && dailyPunchRecordsMap[recordDate]) {
          const dailyRecord = dailyRecordsMap[recordDate];
          
          switch (record.record_type) {
            case 'clock_in':
              dailyRecord.clockIn = recordTime;
              dailyRecord.records.clockIn = recordTime;
              dailyRecord.records.clockInId = record.id;
              dailyPunchRecordsMap[recordDate].clock_in.push(recordTime);
              break;
            case 'clock_out':
              dailyRecord.clockOut = recordTime;
              dailyRecord.records.clockOut = recordTime;
              dailyRecord.records.clockOutId = record.id;
              dailyPunchRecordsMap[recordDate].clock_out.push(recordTime);
              break;
            case 'break_start':
              dailyRecord.records.breakStart = recordTime;
              dailyRecord.records.breakStartId = record.id;
              dailyPunchRecordsMap[recordDate].break_start.push(recordTime);
              break;
            case 'break_end':
              dailyRecord.records.breakEnd = recordTime;
              dailyRecord.records.breakEndId = record.id;
              dailyPunchRecordsMap[recordDate].break_end.push(recordTime);
              break;
          }

          // 勤務パターンを設定（シフトタイプから取得）
          // work_patternsテーブルの参照は一旦削除
        }
      });

      // 各日の拘束時間を計算と勤怠ステータス判定
      Object.keys(dailyRecordsMap).forEach(date => {
        const dailyRecord = dailyRecordsMap[date];
        const punchRecords = dailyPunchRecordsMap[date];
        
        // 勤怠ステータスを自動判定（日付も渡す）
        const statusResult = determineWorkStatus(
          date,
          dailyRecord.shiftStartTime?.replace(':', '') ? dailyRecord.shiftStartTime : null,
          dailyRecord.shiftEndTime?.replace(':', '') ? dailyRecord.shiftEndTime : null,
          dailyRecord.clockIn,
          dailyRecord.clockOut
        );
        
        // ステータス判定結果を適用
        dailyRecord.workStatus = statusResult.status;
        if (statusResult.clockIn) {
          dailyRecord.clockIn = statusResult.clockIn;
        }
        if (statusResult.clockOut) {
          dailyRecord.clockOut = statusResult.clockOut;
        }
        
        if (dailyRecord.clockIn && dailyRecord.clockOut) {
          // ===== 勤怠管理の情報計算（勤怠の出勤・退勤時刻から計算） =====
          const managementClockInTime = new Date(`${dailyRecord.date} ${dailyRecord.clockIn}`);
          const managementClockOutTime = new Date(`${dailyRecord.date} ${dailyRecord.clockOut}`);
          
          // 1. 拘束時間 = 勤怠管理の出勤時刻 - 勤怠管理の退勤時刻
          const totalMinutes = (managementClockOutTime.getTime() - managementClockInTime.getTime()) / (1000 * 60);
          dailyRecord.totalWorkTime = Math.round(totalMinutes);
          
          // 2. 休憩時間の計算（常に設定ベース、打刻は記録のみ）
          let actualBreakMinutes = 0;
          
          // 休憩打刻がある場合でも、勤怠管理情報には設定ベースの休憩時間を使用
          // （打刻記録は「打刻時刻の情報」セクションに表示されるのみ）
          actualBreakMinutes = calculateBreakTimeFromSettings(
            totalMinutes / 60, // 拘束時間（時間単位）
            breakTimeSettings || [],
            dailyRecord.workPattern // 拠点情報から拠点を特定
          );
          
          dailyRecord.breakTime = actualBreakMinutes;
          
          // 3. 実働時間 = 拘束時間 - 休憩時間
          dailyRecord.actualWorkTime = Math.max(0, dailyRecord.totalWorkTime - dailyRecord.breakTime);
          
          // 残業時間（8時間超過分）
          const standardWorkMinutes = 8 * 60; // 8時間
          if (dailyRecord.actualWorkTime > standardWorkMinutes) {
            dailyRecord.overtimeMinutes = dailyRecord.actualWorkTime - standardWorkMinutes;
          }
          
          // シフト時刻がある場合はシフト基準で遅刻・早退を計算
          if (dailyRecord.shiftStartTime && dailyRecord.shiftEndTime) {
            const shiftStartTime = new Date(`${date} ${dailyRecord.shiftStartTime}:00`);
            const shiftEndTime = new Date(`${date} ${dailyRecord.shiftEndTime}:00`);
            const actualClockInTime = new Date(`${date} ${dailyRecord.records.clockIn || dailyRecord.clockIn}:00`);
            const actualClockOutTime = new Date(`${date} ${dailyRecord.records.clockOut || dailyRecord.clockOut}:00`);
            
            // 遅刻計算（実際の打刻時刻がシフトより遅い場合）
            if (actualClockInTime > shiftStartTime) {
              dailyRecord.lateMinutes = Math.round((actualClockInTime.getTime() - shiftStartTime.getTime()) / (1000 * 60));
            }
            
            // 早退計算（実際の打刻時刻がシフトより早い場合）
            if (actualClockOutTime < shiftEndTime) {
              dailyRecord.earlyLeaveMinutes = Math.round((shiftEndTime.getTime() - actualClockOutTime.getTime()) / (1000 * 60));
            }
          } else {
            // シフトがない場合は標準時間（9:00-18:00）で計算
            const standardStartTime = new Date(`${date} 09:00:00`);
            const standardEndTime = new Date(`${date} 18:00:00`);
            const clockInTime = dailyRecord.records.clockIn || dailyRecord.clockIn;
            const clockOutTime = dailyRecord.records.clockOut || dailyRecord.clockOut;
            
            // 遅刻計算
            if (clockInTime) {
              const actualClockInTime = new Date(`${date} ${clockInTime}:00`);
              if (actualClockInTime > standardStartTime) {
                dailyRecord.lateMinutes = Math.round((actualClockInTime.getTime() - standardStartTime.getTime()) / (1000 * 60));
              }
            }
            
            // 早退計算
            if (clockOutTime) {
              const actualClockOutTime = new Date(`${date} ${clockOutTime}:00`);
              if (actualClockOutTime < standardEndTime) {
                dailyRecord.earlyLeaveMinutes = Math.round((standardEndTime.getTime() - actualClockOutTime.getTime()) / (1000 * 60));
              }
            }
          }
        }
      });

      const finalRecords = dates.map(date => dailyRecordsMap[date]);
      setDailyRecords(finalRecords);
      setOriginalRecords(JSON.parse(JSON.stringify(finalRecords))); // Deep copy
      setHasChanges(false);

    } catch (err) {
      console.error('打刻データ取得エラー:', err);
      const errorMessage = err instanceof Error ? err.message : '打刻データの取得に失敗しました';
      setError(`エラー詳細: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const workStatusOptions: WorkStatus[] = ['', '出勤', '残業', '遅刻', '早退', '早出', '欠勤', '要確認'];

  const handleCellEdit = (date: string, field: string, currentValue: string) => {
    setEditingCell({ date, field });
    setEditValue(currentValue);
  };

  const handleEditSave = () => {
    if (!editingCell) return;
    
    // 元の値を取得
    const originalRecord = originalRecords.find(r => r.date === editingCell.date);
    if (!originalRecord) return;
    
    let originalValue: string | number = '';
    let newValue: string | number = '';
    
    // フィールドに応じて元の値と新しい値を取得
    if (editingCell.field.includes('Record')) {
      switch (editingCell.field) {
        case 'clockInRecord':
          originalValue = originalRecord.records.clockIn || '';
          newValue = editValue;
          break;
        case 'clockOutRecord':
          originalValue = originalRecord.records.clockOut || '';
          newValue = editValue;
          break;
        case 'breakStartRecord':
          originalValue = originalRecord.records.breakStart || '';
          newValue = editValue;
          break;
        case 'breakEndRecord':
          originalValue = originalRecord.records.breakEnd || '';
          newValue = editValue;
          break;
      }
    } else {
      originalValue = (originalRecord as any)[editingCell.field] || '';
      if (editingCell.field.includes('Time') || editingCell.field.includes('Minutes')) {
        // 時刻形式の場合は分数に変換
        if (validateTimeFormat(editValue)) {
          newValue = timeFormatToMinutes(editValue);
        } else {
          // 数字のみの場合はそのまま分数として扱う
          newValue = parseInt(editValue) || 0;
        }
      } else {
        newValue = editValue;
      }
    }
    
    // 値が実際に変更された場合のみ編集フィールドとして記録
    const isValueChanged = originalValue !== newValue;
    
    if (isValueChanged) {
      setEditedFields(prev => {
        const dateFields = prev[editingCell.date] || [];
        if (!dateFields.includes(editingCell.field)) {
          const newEditedFields = {
            ...prev,
            [editingCell.date]: [...dateFields, editingCell.field]
          };
          // 編集されたフィールドがある場合はhasChangesをtrue
          setHasChanges(Object.values(newEditedFields).some(fields => fields.length > 0));
          return newEditedFields;
        }
        return prev;
      });
    } else {
      // 値が変更されていない場合は編集フィールドから削除
      setEditedFields(prev => {
        const dateFields = prev[editingCell.date] || [];
        const updatedFields = dateFields.filter(field => field !== editingCell.field);
        let newEditedFields;
        if (updatedFields.length === 0) {
          const { [editingCell.date]: removed, ...rest } = prev;
          newEditedFields = rest;
        } else {
          newEditedFields = {
            ...prev,
            [editingCell.date]: updatedFields
          };
        }
        // 編集されたフィールドがない場合はhasChangesをfalse
        setHasChanges(Object.values(newEditedFields).some(fields => fields.length > 0));
        return newEditedFields;
      });
    }
    
    setDailyRecords(prev => prev.map(record => {
      if (record.date === editingCell.date) {
        // 打刻記録の更新処理
        if (editingCell.field.includes('Record')) {
          const newRecords = { ...record.records };
          switch (editingCell.field) {
            case 'clockInRecord':
              newRecords.clockIn = editValue;
              break;
            case 'clockOutRecord':
              newRecords.clockOut = editValue;
              break;
            case 'breakStartRecord':
              newRecords.breakStart = editValue;
              break;
            case 'breakEndRecord':
              newRecords.breakEnd = editValue;
              break;
          }
          return { ...record, records: newRecords };
        }
        
        // その他のフィールドの更新処理
        return {
          ...record,
          [editingCell.field]: newValue
        };
      }
      return record;
    }));
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };
  
  // 編集済みフィールドかどうかを判定する関数
  const isFieldEdited = (date: string, field: string) => {
    return editedFields[date]?.includes(field) || false;
  };

  // 編集インジケーターの表示
  const EditIndicator = () => (
    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-1" title="編集済み" />
  );

  // 時刻フォーマットのバリデーション
  const validateTimeFormat = (timeString: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(timeString);
  };

  // 分数から時刻形式への変換
  const minutesToTimeFormat = (minutes: number): string => {
    if (minutes === 0) return '00:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // 時刻形式から分数への変換
  const timeFormatToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 入力値の柔軟な処理（分数またはHH:MM形式）
  const parseFlexibleInput = (input: string): string => {
    // 空の場合
    if (!input.trim()) return '';
    
    // 数字のみの場合（分数として扱う）
    const digitsOnly = input.replace(/\D/g, '');
    if (input === digitsOnly && digitsOnly.length > 0) {
      const minutes = parseInt(digitsOnly, 10);
      // 分数が1440分（24時間）未満の場合のみ変換
      if (minutes < 1440) {
        return minutesToTimeFormat(minutes);
      }
    }
    
    // コロンが含まれている場合（時刻形式として扱う）
    if (input.includes(':')) {
      return input;
    }
    
    // その他の場合は自動フォーマット
    return formatTimeInput(input);
  };

  // 時刻フォーマットの自動補完
  const formatTimeInput = (input: string): string => {
    // 数字のみを抽出
    const digits = input.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    if (digits.length === 1) return digits;
    if (digits.length === 2) return digits;
    if (digits.length === 3) return `${digits[0]}:${digits.slice(1)}`;
    if (digits.length >= 4) return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    
    return input;
  };

  // 洗練された入力コンポーネント
  const EditableCell = ({ 
    value, 
    type, 
    field, 
    date, 
    isEditing, 
    options = null,
    onEdit,
    className = "",
    displayValue = null
  }: {
    value: string | number;
    type: 'time' | 'number' | 'select';
    field: string;
    date: string;
    isEditing: boolean;
    options?: string[] | null;
    onEdit: (date: string, field: string, value: string) => void;
    className?: string;
    displayValue?: string | null;
  }) => {
    const isEdited = isFieldEdited(date, field);
    
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setEditValue(input);
    };

    const handleBlur = () => {
      if (!editValue.trim()) {
        handleEditSave();
        return;
      }

      // 時刻形式のフィールドまたは分数フィールドの場合は柔軟な入力形式を処理
      if (type === 'time' || type === 'number') {
        const formatted = parseFlexibleInput(editValue);
        
        if (formatted && validateTimeFormat(formatted)) {
          setEditValue(formatted);
          handleEditSave();
        } else {
          // 無効な形式の場合は元の値に戻す
          const originalDisplayValue = type === 'number' && typeof value === 'number' && value > 0 
            ? minutesToTimeFormat(value) 
            : value?.toString() || '';
          setEditValue(originalDisplayValue);
          handleEditSave();
        }
      } else {
        handleEditSave();
      }
    };
    
    if (isEditing) {
      if (type === 'select' && options) {
        return (
          <div className="relative">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSave}
              onKeyPress={(e) => e.key === 'Enter' && handleEditSave()}
              className="w-full h-8 text-xs text-center bg-white border-2 border-blue-400 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
              autoFocus
            >
              {options.map(option => (
                <option key={option} value={option}>
                  {option || '未設定'}
                </option>
              ))}
            </select>
          </div>
        );
      }
      
      return (
        <div className="relative">
          <input
            type="text"
            value={editValue}
            onChange={handleInput}
            onBlur={handleBlur}
            onKeyPress={(e) => e.key === 'Enter' && handleBlur()}
            className={`w-full h-8 text-xs text-center bg-white border-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 ${
              editValue && !validateTimeFormat(parseFlexibleInput(editValue)) 
                ? 'border-red-400 focus:border-red-500' 
                : 'border-blue-400 focus:border-blue-500'
            }`}
            placeholder="HH:MM"
            maxLength={type === 'number' ? 10 : 5}
            autoFocus
          />
          {editValue && !validateTimeFormat(parseFlexibleInput(editValue)) && (
            <div className="absolute -bottom-5 left-0 text-xs text-red-500">
              HH:MM形式で入力
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div
        onClick={() => onEdit(date, field, value?.toString() || '')}
        className={`relative h-8 flex items-center justify-center cursor-pointer rounded-md transition-all duration-200 ${className}`}
      >
        <span className="text-xs select-none">
          {displayValue || value || '-'}
        </span>
        {isEdited && <EditIndicator />}
      </div>
    );
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError(null);

    try {
      // 変更されたレコードを実際にSupabaseに保存
      const promises = dailyRecords.map(async (record) => {
        const original = originalRecords.find(o => o.date === record.date);
        
        // 変更があったレコードのみ処理
        if (original && (
          original.clockIn !== record.clockIn ||
          original.clockOut !== record.clockOut ||
          original.breakTime !== record.breakTime ||
          original.workStatus !== record.workStatus
        )) {
          // 出勤記録の更新
          if (original.clockIn !== record.clockIn && record.clockIn && record.records.clockInId) {
            const clockInTime = new Date(`${record.date}T${record.clockIn}:00`);
            
            const { error: clockInError } = await supabase
              .from('time_records')
              .update({
                recorded_at: clockInTime.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', record.records.clockInId);

            if (clockInError) throw clockInError;
          }

          // 退勤記録の更新
          if (original.clockOut !== record.clockOut && record.clockOut && record.records.clockOutId) {
            const clockOutTime = new Date(`${record.date}T${record.clockOut}:00`);
            
            const { error: clockOutError } = await supabase
              .from('time_records')
              .update({
                recorded_at: clockOutTime.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', record.records.clockOutId);

            if (clockOutError) throw clockOutError;
          }
        }
      });

      await Promise.all(promises);
      
      // 状態を更新
      setOriginalRecords(JSON.parse(JSON.stringify(dailyRecords)));
      setHasChanges(false);
      setEditedFields({}); // 編集済みフィールドをリセット
      
      // データを再取得して同期
      await fetchUserAndRecords();
      
      // 成功メッセージを表示
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      successDiv.textContent = '変更内容をデータベースに保存しました';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
      
    } catch (err) {
      console.error('保存エラー:', err);
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleResetChanges = () => {
    setDailyRecords(JSON.parse(JSON.stringify(originalRecords)));
    setHasChanges(false);
    setEditedFields({}); // 編集済みフィールドをリセット
    setEditingCell(null);
    setEditValue('');
  };

  const getStatusColor = (status: WorkStatus) => {
    switch (status) {
      case '出勤': return 'text-green-600 bg-green-100';
      case '残業': return 'text-blue-600 bg-blue-100';
      case '遅刻': return 'text-yellow-600 bg-yellow-100';
      case '早退': return 'text-orange-600 bg-orange-100';
      case '早出': return 'text-purple-600 bg-purple-100';
      case '欠勤': return 'text-red-600 bg-red-100';
      case '要確認': return 'text-gray-800 bg-gray-200';
      default: return 'text-gray-600 bg-gray-100';
    }
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">打刻記録詳細</h1>
              </div>
              <div className="flex items-center space-x-3">
                {user?.picture_url && (
                  <img
                    src={user.picture_url}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900">{userName}</p>
                  <p className="text-sm text-gray-500">#{user?.employee_number || '---'}</p>
                </div>
              </div>
            </div>
            
            {/* 保存ボタン */}
            {hasChanges && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleResetChanges}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  リセット
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>保存</span>
                    </>
                  )}
                </button>
              </div>
            )}
        </div>

        {/* 月ナビゲーション */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 min-w-[120px] text-center">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* メイン表 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse table-fixed">
            {/* 列幅の定義 */}
            <colgroup>
              <col className="w-20" /> {/* 日付 */}
              <col className="w-24" /> {/* シフト出勤 */}
              <col className="w-24" /> {/* シフト退勤 */}
              <col className="w-20" /> {/* 出勤 */}
              <col className="w-20" /> {/* 退勤 */}
              <col className="w-20" /> {/* 休憩時間 */}
              <col className="w-20" /> {/* 拘束時間 */}
              <col className="w-20" /> {/* 実働時間 */}
              <col className="w-20" /> {/* 残業時間 */}
              <col className="w-20" /> {/* 遅刻時間 */}
              <col className="w-20" /> {/* 早退時間 */}
              <col className="w-24" /> {/* 稼働ステータス */}
              <col className="w-20" /> {/* 出勤打刻 */}
              <col className="w-20" /> {/* 退勤打刻 */}
              <col className="w-20" /> {/* 休憩開始 */}
              <col className="w-20" /> {/* 休憩終了 */}
            </colgroup>
            
            {/* ヘッダー */}
            <thead className="bg-gray-50">
              {/* 上段：分類ヘッダー */}
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-300 align-middle">
                  日付
                </th>
                
                {/* シフトの情報 */}
                <th colSpan={2} className="px-3 py-2 text-center text-sm font-medium text-white bg-blue-600 border border-gray-300">
                  シフトの情報
                </th>
                
                {/* 勤怠管理の情報 */}
                <th colSpan={9} className="px-3 py-2 text-center text-sm font-medium text-white bg-green-600 border border-gray-300">
                  勤怠管理の情報
                </th>
                
                {/* 打刻時刻の情報 */}
                <th colSpan={4} className="px-3 py-2 text-center text-sm font-medium text-white bg-orange-600 border border-gray-300">
                  打刻時刻の情報
                </th>
              </tr>
              
              {/* 下段：詳細項目ヘッダー */}
              <tr>
                {/* シフトの情報 */}
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-blue-50 border border-gray-300">シフト出勤</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-blue-50 border border-gray-300">シフト退勤</th>
                
                {/* 勤怠管理の情報 */}
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-green-50 border border-gray-300">出勤</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-green-50 border border-gray-300">退勤</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-green-50 border border-gray-300">休憩時間</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-green-50 border border-gray-300">拘束時間</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-green-50 border border-gray-300">実働時間</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-green-50 border border-gray-300">残業時間</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-green-50 border border-gray-300">遅刻時間</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-green-50 border border-gray-300">早退時間</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-green-50 border border-gray-300">稼働ステータス</th>
                
                {/* 打刻時刻の情報 */}
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-orange-50 border border-gray-300">出勤打刻</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-orange-50 border border-gray-300">退勤打刻</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-orange-50 border border-gray-300">休憩開始</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 bg-orange-50 border border-gray-300">休憩終了</th>
              </tr>
            </thead>

            {/* ボディ */}
            <tbody className="bg-white">
              {dailyRecords.map((record) => {
                const date = new Date(record.date + 'T00:00:00');
                const day = date.getDate();
                const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <tr key={record.date} className={`hover:bg-gray-50 ${isWeekend ? 'bg-blue-50' : ''}`}>
                    {/* 日付 */}
                    <td className="px-4 py-2 text-center border border-gray-300">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{day}日</div>
                        <div className="text-xs text-gray-500">({weekday})</div>
                      </div>
                    </td>
                    
                    {/* シフトの情報 */}
                    {/* シフト出勤 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-blue-25">
                      <EditableCell
                        value={record.shiftStartTime}
                        type="time"
                        field="shiftStartTime"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'shiftStartTime'}
                        onEdit={handleCellEdit}
                        className="hover:bg-blue-100"
                      />
                    </td>
                    
                    {/* シフト退勤 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-blue-25">
                      <EditableCell
                        value={record.shiftEndTime}
                        type="time"
                        field="shiftEndTime"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'shiftEndTime'}
                        onEdit={handleCellEdit}
                        className="hover:bg-blue-100"
                      />
                    </td>
                    
                    {/* 勤怠管理の情報 */}
                    {/* 出勤 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-green-25">
                      <EditableCell
                        value={record.clockIn}
                        type="time"
                        field="clockIn"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'clockIn'}
                        onEdit={handleCellEdit}
                        className="hover:bg-green-100"
                      />
                    </td>
                    
                    {/* 退勤 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-green-25">
                      <EditableCell
                        value={record.clockOut}
                        type="time"
                        field="clockOut"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'clockOut'}
                        onEdit={handleCellEdit}
                        className="hover:bg-green-100"
                      />
                    </td>
                    
                    {/* 休憩時間 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-green-25">
                      <EditableCell
                        value={record.breakTime || 0}
                        type="number"
                        field="breakTime"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'breakTime'}
                        onEdit={handleCellEdit}
                        className="hover:bg-green-100"
                        displayValue={record.breakTime > 0 ? formatTime(record.breakTime) : '-'}
                      />
                    </td>
                    {/* 拘束時間 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-green-25">
                      <EditableCell
                        value={record.totalWorkTime || 0}
                        type="number"
                        field="totalWorkTime"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'totalWorkTime'}
                        onEdit={handleCellEdit}
                        className="hover:bg-green-100"
                        displayValue={record.totalWorkTime > 0 ? formatTime(record.totalWorkTime) : '-'}
                      />
                    </td>
                    
                    {/* 実働時間 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-green-25">
                      <EditableCell
                        value={record.actualWorkTime || 0}
                        type="number"
                        field="actualWorkTime"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'actualWorkTime'}
                        onEdit={handleCellEdit}
                        className="hover:bg-green-100"
                        displayValue={record.actualWorkTime > 0 ? formatTime(record.actualWorkTime) : '-'}
                      />
                    </td>
                    
                    {/* 残業時間 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-green-25">
                      <EditableCell
                        value={record.overtimeMinutes || 0}
                        type="number"
                        field="overtimeMinutes"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'overtimeMinutes'}
                        onEdit={handleCellEdit}
                        className="hover:bg-green-100"
                        displayValue={record.overtimeMinutes > 0 ? formatTime(record.overtimeMinutes) : '-'}
                      />
                    </td>
                    
                    {/* 遅刻時間 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-green-25">
                      <EditableCell
                        value={record.lateMinutes || 0}
                        type="number"
                        field="lateMinutes"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'lateMinutes'}
                        onEdit={handleCellEdit}
                        className="hover:bg-green-100"
                        displayValue={record.lateMinutes > 0 ? formatTime(record.lateMinutes) : '-'}
                      />
                    </td>
                    
                    {/* 早退時間 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-green-25">
                      <EditableCell
                        value={record.earlyLeaveMinutes || 0}
                        type="number"
                        field="earlyLeaveMinutes"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'earlyLeaveMinutes'}
                        onEdit={handleCellEdit}
                        className="hover:bg-green-100"
                        displayValue={record.earlyLeaveMinutes > 0 ? formatTime(record.earlyLeaveMinutes) : '-'}
                      />
                    </td>
                    
                    {/* 稼働ステータス - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-green-25">
                      <EditableCell
                        value={record.workStatus}
                        type="select"
                        field="workStatus"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'workStatus'}
                        onEdit={handleCellEdit}
                        options={workStatusOptions}
                        className="hover:bg-green-100"
                        displayValue={record.workStatus || '未設定'}
                      />
                    </td>
                    
                    {/* 打刻時刻の情報 */}
                    {/* 出勤打刻 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-orange-25">
                      <EditableCell
                        value={record.records.clockIn}
                        type="time"
                        field="clockInRecord"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'clockInRecord'}
                        onEdit={handleCellEdit}
                        className="hover:bg-orange-100"
                      />
                    </td>
                    
                    {/* 退勤打刻 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-orange-25">
                      <EditableCell
                        value={record.records.clockOut}
                        type="time"
                        field="clockOutRecord"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'clockOutRecord'}
                        onEdit={handleCellEdit}
                        className="hover:bg-orange-100"
                      />
                    </td>
                    
                    {/* 休憩開始 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-orange-25">
                      <EditableCell
                        value={record.records.breakStart}
                        type="time"
                        field="breakStartRecord"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'breakStartRecord'}
                        onEdit={handleCellEdit}
                        className="hover:bg-orange-100"
                      />
                    </td>
                    
                    {/* 休憩終了 - 編集可能 */}
                    <td className="px-1 py-1 text-center text-sm border border-gray-300 bg-orange-25">
                      <EditableCell
                        value={record.records.breakEnd}
                        type="time"
                        field="breakEndRecord"
                        date={record.date}
                        isEditing={editingCell?.date === record.date && editingCell?.field === 'breakEndRecord'}
                        onEdit={handleCellEdit}
                        className="hover:bg-orange-100"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
    </div>
  );
};

export default TimeRecordDetailPage;