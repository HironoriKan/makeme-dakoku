import { supabase } from '../lib/supabase';

export interface KPIData {
  totalUsers: number;
  todayAttendance: number;
  currentlyWorking: number;
  todaySales: number;
  avgSalesPerUser: number;
  totalShifts: number;
  completedShifts: number;
  monthlyAttendanceRate: number;
  avgWorkingHours: number;
  recentActivity: Array<{
    user_display_name: string;
    action: string;
    timestamp: string;
  }>;
}

export class KPIService {
  // 総ユーザー数を取得
  static async getTotalUsers(): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }

  // 本日の出勤者数を取得
  static async getTodayAttendance(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('time_records')
      .select('user_id')
      .eq('record_type', 'clock_in')
      .gte('recorded_at', `${today}T00:00:00`)
      .lt('recorded_at', `${today}T23:59:59`);
    
    if (error) throw error;
    
    // ユニークなユーザー数をカウント
    const uniqueUsers = new Set(data?.map(record => record.user_id));
    return uniqueUsers.size;
  }

  // 現在勤務中の人数を取得
  static async getCurrentlyWorking(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    // 今日の全ての打刻記録を取得
    const { data, error } = await supabase
      .from('time_records')
      .select('user_id, record_type, recorded_at')
      .gte('recorded_at', `${today}T00:00:00`)
      .lt('recorded_at', `${today}T23:59:59`)
      .order('recorded_at', { ascending: true });
    
    if (error) throw error;
    
    // ユーザーごとの最新状態を計算
    const userStatus = new Map();
    data?.forEach(record => {
      userStatus.set(record.user_id, record.record_type);
    });
    
    // 現在勤務中（clock_inまたはbreak_end後）のユーザー数をカウント
    let workingCount = 0;
    userStatus.forEach(status => {
      if (status === 'clock_in' || status === 'break_end') {
        workingCount++;
      }
    });
    
    return workingCount;
  }

  // 本日の売上合計を取得
  static async getTodaySales(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_reports')
      .select('sales_amount')
      .eq('report_date', today);
    
    if (error) throw error;
    
    const totalSales = data?.reduce((sum, report) => sum + report.sales_amount, 0) || 0;
    return totalSales;
  }

  // ユーザー平均売上を取得
  static async getAvgSalesPerUser(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_reports')
      .select('sales_amount')
      .eq('report_date', today);
    
    if (error) throw error;
    
    if (!data || data.length === 0) return 0;
    
    const totalSales = data.reduce((sum, report) => sum + report.sales_amount, 0);
    return Math.round(totalSales / data.length);
  }

  // 今月のシフト統計を取得
  static async getMonthlyShifts(): Promise<{ total: number; completed: number }> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('shifts')
      .select('shift_status')
      .gte('shift_date', firstDay)
      .lte('shift_date', lastDay);
    
    if (error) throw error;
    
    const total = data?.length || 0;
    const completed = data?.filter(shift => shift.shift_status === 'confirmed').length || 0;
    
    return { total, completed };
  }

  // 月次出勤率を取得
  static async getMonthlyAttendanceRate(): Promise<number> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // 今月のシフト数
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id')
      .gte('shift_date', firstDay)
      .lte('shift_date', lastDay)
      .neq('shift_type', 'off');
    
    if (shiftsError) throw shiftsError;
    
    // 今月の実際の出勤記録数
    const { data: attendance, error: attendanceError } = await supabase
      .from('time_records')
      .select('id')
      .eq('record_type', 'clock_in')
      .gte('recorded_at', `${firstDay}T00:00:00`)
      .lt('recorded_at', `${lastDay}T23:59:59`);
    
    if (attendanceError) throw attendanceError;
    
    const totalShifts = shifts?.length || 0;
    const actualAttendance = attendance?.length || 0;
    
    return totalShifts > 0 ? Math.round((actualAttendance / totalShifts) * 100) : 0;
  }

  // 平均労働時間を取得（今週）
  static async getAvgWorkingHours(): Promise<number> {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6)).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('time_records')
      .select('user_id, record_type, recorded_at')
      .gte('recorded_at', `${weekStart}T00:00:00`)
      .lt('recorded_at', `${weekEnd}T23:59:59`)
      .order('recorded_at', { ascending: true });
    
    if (error) throw error;
    
    // ユーザーごとの労働時間を計算
    const userWorkHours = new Map();
    const userCurrentStatus = new Map();
    
    data?.forEach(record => {
      const userId = record.user_id;
      const recordTime = new Date(record.recorded_at);
      
      if (!userWorkHours.has(userId)) {
        userWorkHours.set(userId, 0);
      }
      
      if (record.record_type === 'clock_in') {
        userCurrentStatus.set(userId, { type: 'work', startTime: recordTime });
      } else if (record.record_type === 'clock_out') {
        const status = userCurrentStatus.get(userId);
        if (status && status.type === 'work') {
          const workHours = (recordTime.getTime() - status.startTime.getTime()) / (1000 * 60 * 60);
          userWorkHours.set(userId, userWorkHours.get(userId) + workHours);
        }
        userCurrentStatus.set(userId, { type: 'off' });
      }
    });
    
    const totalHours = Array.from(userWorkHours.values()).reduce((sum, hours) => sum + hours, 0);
    const userCount = userWorkHours.size;
    
    return userCount > 0 ? Math.round((totalHours / userCount) * 10) / 10 : 0;
  }

  // 最近のアクティビティを取得
  static async getRecentActivity(): Promise<Array<{
    user_display_name: string;
    action: string;
    timestamp: string;
  }>> {
    const { data, error } = await supabase
      .from('time_records')
      .select(`
        record_type,
        recorded_at,
        users (
          display_name
        )
      `)
      .order('recorded_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    const actionLabels = {
      'clock_in': '出勤しました',
      'clock_out': '退勤しました',
      'break_start': '休憩を開始しました',
      'break_end': '休憩を終了しました'
    };
    
    return data?.map(record => ({
      user_display_name: (record.users as any)?.display_name || '不明',
      action: actionLabels[record.record_type as keyof typeof actionLabels] || record.record_type,
      timestamp: record.recorded_at
    })) || [];
  }

  // 全KPIデータを一括取得
  static async getAllKPIData(): Promise<KPIData> {
    try {
      const [
        totalUsers,
        todayAttendance,
        currentlyWorking,
        todaySales,
        avgSalesPerUser,
        monthlyShifts,
        monthlyAttendanceRate,
        avgWorkingHours,
        recentActivity
      ] = await Promise.all([
        this.getTotalUsers(),
        this.getTodayAttendance(),
        this.getCurrentlyWorking(),
        this.getTodaySales(),
        this.getAvgSalesPerUser(),
        this.getMonthlyShifts(),
        this.getMonthlyAttendanceRate(),
        this.getAvgWorkingHours(),
        this.getRecentActivity()
      ]);

      return {
        totalUsers,
        todayAttendance,
        currentlyWorking,
        todaySales,
        avgSalesPerUser,
        totalShifts: monthlyShifts.total,
        completedShifts: monthlyShifts.completed,
        monthlyAttendanceRate,
        avgWorkingHours,
        recentActivity
      };
    } catch (error) {
      console.error('KPI data fetch error:', error);
      throw error;
    }
  }
}