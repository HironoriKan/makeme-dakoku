import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type DailyReport = Database['public']['Tables']['daily_reports']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

export interface DashboardStats {
  // 基本統計
  totalActiveUsers: number;
  totalActiveLocations: number;
  totalActivePermanentStores: number;
  totalActiveEvents: number;
  
  // 今月のアクティブ数
  monthlyActiveUsers: number;
  monthlyActivePermanentStores: number;
  monthlyActiveEvents: number;
  
  // 出勤率データ
  attendanceRate: {
    currentMonth: number; // 今月の出勤率（パーセンテージ）
    totalScheduledShifts: number; // 予定シフト数
    totalActualAttendance: number; // 実際の出勤数
    absenteeCount: number; // 欠勤数
  };
  
  // 売上データ（前月・今月）
  lastMonthSales: {
    totalSales: number;
    customerUnitPrice: number;
    customerPurchaseCount: number;
    itemsPerCustomer: number;
  };
  
  currentMonthSales: {
    totalSales: number;
    customerUnitPrice: number;
    customerPurchaseCount: number;
    itemsPerCustomer: number;
  };
  
  // 前月比
  monthOverMonthComparison: {
    salesGrowth: number; // パーセンテージ
    unitPriceGrowth: number;
    purchaseCountGrowth: number;
    itemsPerCustomerGrowth: number;
  };
}

export interface TimeSeriesData {
  period: string; // YYYY-MM-DD, YYYY-MM, YYYY-WW 形式
  label: string; // 表示用ラベル
  totalSales: number;
  customerCount: number;
  itemsSold: number;
  customerUnitPrice: number;
  itemsPerCustomer: number;
}

export interface ComparisonTimeSeriesData {
  current: TimeSeriesData[];
  comparison: TimeSeriesData[];
  comparisonLabel: string;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly';
export type MetricType = 'totalSales' | 'customerCount' | 'itemsSold' | 'customerUnitPrice' | 'itemsPerCustomer';

export interface LocationSalesData {
  locationId: string;
  locationName: string;
  currentMonthSales: number;
  lastMonthSales: number;
  monthOverMonthGrowth: number; // パーセンテージ
  customerCount: number;
  isGrowing: boolean; // 前月比で成長しているか
}

export class DashboardService {
  // 有効ユーザー数を取得
  static async getActiveUsersCount(): Promise<number> {
    const { data, error } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    if (error) throw new Error(`有効ユーザー数の取得に失敗: ${error.message}`);
    return data?.length || 0;
  }

  // 有効拠点数を取得
  static async getActiveLocationsCount(): Promise<number> {
    const { data, error } = await supabase
      .from('locations')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    if (error) throw new Error(`有効拠点数の取得に失敗: ${error.message}`);
    return data?.length || 0;
  }

  // 有効常設店数を取得
  static async getActivePermanentStoresCount(): Promise<number> {
    const { data, error } = await supabase
      .from('locations')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
      .eq('location_type', 'permanent');

    if (error) throw new Error(`有効常設店数の取得に失敗: ${error.message}`);
    return data?.length || 0;
  }

  // 有効イベント数を取得
  static async getActiveEventsCount(): Promise<number> {
    const { data, error } = await supabase
      .from('locations')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
      .eq('location_type', 'popup');

    if (error) throw new Error(`有効イベント数の取得に失敗: ${error.message}`);
    return data?.length || 0;
  }

  // 今月のアクティブユーザー数（今月のシフトが登録されている人）
  static async getMonthlyActiveUsers(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('shifts')
      .select('user_id')
      .gte('shift_date', startOfMonth.toISOString().split('T')[0])
      .lte('shift_date', endOfMonth.toISOString().split('T')[0])
      .neq('shift_type', 'off');

    if (error) throw new Error(`月間アクティブユーザー数の取得に失敗: ${error.message}`);
    
    // ユニークなユーザーIDの数をカウント
    const uniqueUsers = new Set(data?.map(shift => shift.user_id) || []);
    return uniqueUsers.size;
  }

  // 今月のアクティブ常設店数
  static async getMonthlyActivePermanentStores(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // user_location_accessテーブルを使用してユーザーと拠点の関係を取得
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        user_id,
        users!inner(
          user_location_access!inner(
            locations!inner(id, location_type)
          )
        )
      `)
      .gte('shift_date', startOfMonth.toISOString().split('T')[0])
      .lte('shift_date', endOfMonth.toISOString().split('T')[0])
      .neq('shift_type', 'off');

    if (error) {
      console.warn('user_location_accessを使った取得に失敗、代替手段を使用:', error.message);
      // フォールバック: 全ての常設店を返す
      return this.getActivePermanentStoresCount();
    }

    const activeLocations = new Set<string>();
    
    data?.forEach((shift: any) => {
      shift.users?.user_location_access?.forEach((userLocationAccess: any) => {
        if (userLocationAccess.locations?.location_type === 'permanent') {
          activeLocations.add(userLocationAccess.locations.id);
        }
      });
    });

    return activeLocations.size;
  }

  // 今月のアクティブイベント数
  static async getMonthlyActiveEvents(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // user_location_accessテーブルを使用してユーザーと拠点の関係を取得
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        user_id,
        users!inner(
          user_location_access!inner(
            locations!inner(id, location_type)
          )
        )
      `)
      .gte('shift_date', startOfMonth.toISOString().split('T')[0])
      .lte('shift_date', endOfMonth.toISOString().split('T')[0])
      .neq('shift_type', 'off');

    if (error) {
      console.warn('user_location_accessを使った取得に失敗、代替手段を使用:', error.message);
      // フォールバック: 全てのイベントを返す
      return this.getActiveEventsCount();
    }

    const activeLocations = new Set<string>();
    
    data?.forEach((shift: any) => {
      shift.users?.user_location_access?.forEach((userLocationAccess: any) => {
        if (userLocationAccess.locations?.location_type === 'popup') {
          activeLocations.add(userLocationAccess.locations.id);
        }
      });
    });

    return activeLocations.size;
  }

  // 今月の出勤率を計算（シフト予定に対する実際の出勤率）
  static async getMonthlyAttendanceRate(year: number, month: number) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    try {
      // 今月のシフト予定を取得（off以外のシフト）
      const { data: scheduledShifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, user_id, shift_date, shift_type')
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .neq('shift_type', 'off');

      if (shiftsError) throw new Error(`シフトデータ取得エラー: ${shiftsError.message}`);

      // 実際の出勤記録を取得（clock_inがあるかどうかで判定）
      const { data: timeRecords, error: timeError } = await supabase
        .from('time_records')
        .select('user_id, recorded_at, record_type')
        .gte('recorded_at', startDate + 'T00:00:00Z')
        .lte('recorded_at', endDate + 'T23:59:59Z')
        .eq('record_type', 'clock_in');

      if (timeError) throw new Error(`打刻データ取得エラー: ${timeError.message}`);

      const totalScheduledShifts = scheduledShifts?.length || 0;
      
      if (totalScheduledShifts === 0) {
        return {
          currentMonth: 100, // シフトがない場合は100%
          totalScheduledShifts: 0,
          totalActualAttendance: 0,
          absenteeCount: 0
        };
      }

      // シフト予定日と実際の出勤日をマッピング
      const scheduledShiftMap = new Map<string, boolean>(); // key: "userId-date", value: attended
      scheduledShifts?.forEach(shift => {
        const key = `${shift.user_id}-${shift.shift_date}`;
        scheduledShiftMap.set(key, false); // 初期値は未出勤
      });

      // 実際の出勤記録をマーク
      timeRecords?.forEach(record => {
        const recordDate = record.recorded_at.split('T')[0]; // YYYY-MM-DD部分を取得
        const key = `${record.user_id}-${recordDate}`;
        if (scheduledShiftMap.has(key)) {
          scheduledShiftMap.set(key, true); // 出勤済みとマーク
        }
      });

      // 出勤率を計算
      const actualAttendance = Array.from(scheduledShiftMap.values()).filter(attended => attended).length;
      const absenteeCount = totalScheduledShifts - actualAttendance;
      const attendanceRate = (actualAttendance / totalScheduledShifts) * 100;

      return {
        currentMonth: Math.round(attendanceRate * 10) / 10, // 小数点第1位まで
        totalScheduledShifts,
        totalActualAttendance: actualAttendance,
        absenteeCount
      };

    } catch (error) {
      console.error('出勤率計算エラー:', error);
      // エラー時はデフォルト値を返す
      return {
        currentMonth: 0,
        totalScheduledShifts: 0,
        totalActualAttendance: 0,
        absenteeCount: 0
      };
    }
  }

  // 月間売上データを取得（スタッフ日報データから算出）
  static async getMonthlySalesData(year: number, month: number) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_reports')
      .select('user_id, report_date, sales_amount, customer_count, customer_unit_price, items_sold')
      .gte('report_date', startDate)
      .lte('report_date', endDate);

    if (error) throw new Error(`月間売上データの取得に失敗: ${error.message}`);

    // スタッフ個人の日報を日別に集計
    const dailyTotals = new Map<string, {
      totalSales: number;
      totalCustomers: number;
      totalItems: number;
      staffCount: number;
    }>();

    data?.forEach(report => {
      const dateKey = report.report_date;
      if (!dailyTotals.has(dateKey)) {
        dailyTotals.set(dateKey, {
          totalSales: 0,
          totalCustomers: 0,
          totalItems: 0,
          staffCount: 0
        });
      }

      const daily = dailyTotals.get(dateKey)!;
      daily.totalSales += report.sales_amount || 0;
      daily.totalCustomers += report.customer_count || 0;
      daily.totalItems += report.items_sold || 0;
      daily.staffCount += 1;
    });

    // 月間合計を算出
    let monthlyTotalSales = 0;
    let monthlyTotalCustomers = 0;
    let monthlyTotalItems = 0;
    let activeDaysCount = 0;

    dailyTotals.forEach(daily => {
      monthlyTotalSales += daily.totalSales;
      monthlyTotalCustomers += daily.totalCustomers;
      monthlyTotalItems += daily.totalItems;
      activeDaysCount += 1;
    });

    return {
      totalSales: monthlyTotalSales,
      customerUnitPrice: monthlyTotalCustomers > 0 ? monthlyTotalSales / monthlyTotalCustomers : 0,
      customerPurchaseCount: monthlyTotalCustomers,
      itemsPerCustomer: monthlyTotalCustomers > 0 ? monthlyTotalItems / monthlyTotalCustomers : 0
    };
  }

  // 前月比を計算
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // 完全なダッシュボード統計を取得
  static async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    try {
      // 並列で基本統計を取得
      const [
        totalActiveUsers,
        totalActiveLocations,
        totalActivePermanentStores,
        totalActiveEvents,
        monthlyActiveUsers,
        monthlyActivePermanentStores,
        monthlyActiveEvents,
        attendanceRate,
        currentMonthSales,
        lastMonthSales
      ] = await Promise.all([
        this.getActiveUsersCount(),
        this.getActiveLocationsCount(),
        this.getActivePermanentStoresCount(),
        this.getActiveEventsCount(),
        this.getMonthlyActiveUsers(),
        this.getMonthlyActivePermanentStores(),
        this.getMonthlyActiveEvents(),
        this.getMonthlyAttendanceRate(currentYear, currentMonth),
        this.getMonthlySalesData(currentYear, currentMonth),
        this.getMonthlySalesData(lastMonthYear, lastMonth)
      ]);

      // 前月比を計算
      const monthOverMonthComparison = {
        salesGrowth: this.calculateGrowthRate(
          currentMonthSales.totalSales,
          lastMonthSales.totalSales
        ),
        unitPriceGrowth: this.calculateGrowthRate(
          currentMonthSales.customerUnitPrice,
          lastMonthSales.customerUnitPrice
        ),
        purchaseCountGrowth: this.calculateGrowthRate(
          currentMonthSales.customerPurchaseCount,
          lastMonthSales.customerPurchaseCount
        )
      };

      return {
        totalActiveUsers,
        totalActiveLocations,
        totalActivePermanentStores,
        totalActiveEvents,
        monthlyActiveUsers,
        monthlyActivePermanentStores,
        monthlyActiveEvents,
        attendanceRate,
        currentMonthSales,
        lastMonthSales,
        monthOverMonthComparison
      };
    } catch (error) {
      console.error('ダッシュボード統計の取得に失敗:', error);
      throw error;
    }
  }

  // 時系列売上データを取得（比較データ付き）
  static async getTimeSeriesDataWithComparison(periodType: PeriodType): Promise<ComparisonTimeSeriesData> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      const comparisonEndDate = new Date();
      const comparisonStartDate = new Date();
      
      // 現在の期間と比較期間を設定
      switch (periodType) {
        case 'daily': // 日単位: 31日分、前31日間と比較
          startDate.setDate(endDate.getDate() - 30);
          comparisonEndDate.setDate(endDate.getDate() - 31);
          comparisonStartDate.setDate(comparisonEndDate.getDate() - 30);
          break;
        case 'weekly': // 週単位: 3ヶ月分、前3ヶ月間と比較
          startDate.setMonth(endDate.getMonth() - 3);
          comparisonEndDate.setMonth(endDate.getMonth() - 3);
          comparisonStartDate.setMonth(comparisonEndDate.getMonth() - 3);
          break;
        case 'monthly': // 月単位: 1年分、前1年間と比較
          startDate.setMonth(endDate.getMonth() - 11); // 過去12ヶ月
          startDate.setDate(1); // 月の初日
          comparisonEndDate.setMonth(endDate.getMonth() - 12);
          comparisonEndDate.setDate(1);
          comparisonStartDate.setMonth(comparisonEndDate.getMonth() - 11);
          comparisonStartDate.setDate(1);
          break;
      }

      // 現在のデータと比較データを並列取得
      const [currentReportsResult, comparisonReportsResult] = await Promise.all([
        supabase
          .from('daily_reports')
          .select('*')
          .gte('report_date', startDate.toISOString().split('T')[0])
          .lte('report_date', endDate.toISOString().split('T')[0])
          .order('report_date'),
        supabase
          .from('daily_reports')
          .select('*')
          .gte('report_date', comparisonStartDate.toISOString().split('T')[0])
          .lte('report_date', comparisonEndDate.toISOString().split('T')[0])
          .order('report_date')
      ]);

      if (currentReportsResult.error) throw new Error(`現在の時系列データの取得に失敗: ${currentReportsResult.error.message}`);
      if (comparisonReportsResult.error) throw new Error(`比較時系列データの取得に失敗: ${comparisonReportsResult.error.message}`);

      const currentData = this.processTimeSeriesData(currentReportsResult.data || [], periodType, startDate, endDate);
      const comparisonData = this.processTimeSeriesData(comparisonReportsResult.data || [], periodType, comparisonStartDate, comparisonEndDate);
      
      // 比較データのラベルを同じにする（表示用）
      const alignedComparisonData = comparisonData.map((item, index) => ({
        ...item,
        label: currentData[index]?.label || item.label
      }));

      const comparisonLabel = this.getComparisonLabel(periodType);

      return {
        current: currentData,
        comparison: alignedComparisonData,
        comparisonLabel
      };
    } catch (error) {
      console.error('時系列データの取得に失敗:', error);
      throw error;
    }
  }

  // 比較ラベルを取得
  private static getComparisonLabel(periodType: PeriodType): string {
    switch (periodType) {
      case 'daily': return '前31日間';
      case 'weekly': return '前3ヶ月間';
      case 'monthly': return '前年同期';
      default: return '比較データ';
    }
  }

  // 既存のgetTimeSeriesDataメソッド（互換性のため保持）
  static async getTimeSeriesData(periodType: PeriodType): Promise<TimeSeriesData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // 期間タイプに応じて開始日を設定
      switch (periodType) {
        case 'daily': // 日単位: 31日分
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'weekly': // 週単位: 3ヶ月分
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'monthly': // 月単位: 13ヶ月分（2024年8月〜2025年8月）
          startDate.setFullYear(2024, 7, 1); // 2024年8月1日から
          break;
      }

      // データベースから売上データを取得
      const { data: dailyReports, error } = await supabase
        .from('daily_reports')
        .select('*')
        .gte('report_date', startDate.toISOString().split('T')[0])
        .lte('report_date', endDate.toISOString().split('T')[0])
        .order('report_date');

      if (error) throw new Error(`時系列データの取得に失敗: ${error.message}`);

      return this.processTimeSeriesData(dailyReports || [], periodType, startDate, endDate);
    } catch (error) {
      console.error('時系列データの取得に失敗:', error);
      throw error;
    }
  }

  // 時系列データを処理（日次データから週単位・月単位を算出）
  private static processTimeSeriesData(
    reports: DailyReport[], 
    periodType: PeriodType,
    startDate: Date,
    endDate: Date
  ): TimeSeriesData[] {
    // 日次データをまず日付でグループ化
    const dailyDataMap = new Map<string, {
      totalSales: number;
      totalItems: number;
      totalCustomers: number;
      staffCount: number; // 働いたスタッフ数
      dailyReportCount: number;
    }>();

    // 日次レポートデータを集計（スタッフ単位の日報を日単位に集約）
    reports.forEach(report => {
      const dateKey = report.report_date; // YYYY-MM-DD
      
      if (!dailyDataMap.has(dateKey)) {
        dailyDataMap.set(dateKey, {
          totalSales: 0,
          totalItems: 0,
          totalCustomers: 0,
          staffCount: 0,
          dailyReportCount: 0
        });
      }

      const dailyData = dailyDataMap.get(dateKey)!;
      dailyData.totalSales += report.sales_amount || 0;
      dailyData.totalItems += report.items_sold || 0;
      dailyData.totalCustomers += report.customer_count || 0;
      dailyData.staffCount += 1; // スタッフ数をカウント
      dailyData.dailyReportCount += 1;
    });

    // 日次データから期間別データを算出
    const periodDataMap = new Map<string, {
      totalSales: number;
      totalItems: number;
      totalCustomers: number;
      activeDays: number; // アクティブな日数
      totalStaffDays: number; // 延べスタッフ日数
    }>();

    // 日次データを期間単位でグループ化
    dailyDataMap.forEach((dailyData, dateKey) => {
      const reportDate = new Date(dateKey);
      const periodKey = this.getPeriodKey(reportDate, periodType);
      
      if (!periodDataMap.has(periodKey)) {
        periodDataMap.set(periodKey, {
          totalSales: 0,
          totalItems: 0,
          totalCustomers: 0,
          activeDays: 0,
          totalStaffDays: 0
        });
      }

      const periodData = periodDataMap.get(periodKey)!;
      periodData.totalSales += dailyData.totalSales;
      periodData.totalItems += dailyData.totalItems;
      periodData.totalCustomers += dailyData.totalCustomers;
      periodData.activeDays += 1;
      periodData.totalStaffDays += dailyData.staffCount;
    });

    // 期間の全範囲を生成（データがない期間も含む）
    const periods = this.generatePeriods(startDate, endDate, periodType);
    
    return periods.map(period => {
      const data = periodDataMap.get(period.key) || {
        totalSales: 0,
        totalItems: 0,
        totalCustomers: 0,
        activeDays: 0,
        totalStaffDays: 0
      };

      // 期間別の指標を算出
      const customerUnitPrice = data.totalCustomers > 0 ? data.totalSales / data.totalCustomers : 0;
      const itemsPerCustomer = data.totalCustomers > 0 ? data.totalItems / data.totalCustomers : 0;

      return {
        period: period.key,
        label: period.label,
        totalSales: data.totalSales,
        customerCount: data.totalCustomers,
        itemsSold: data.totalItems,
        customerUnitPrice,
        itemsPerCustomer
      };
    });
  }

  // 期間キーを生成
  private static getPeriodKey(date: Date, periodType: PeriodType): string {
    switch (periodType) {
      case 'daily':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'weekly':
        // 月曜日を開始日とした週の開始日をキーとする
        const weekStart = this.getWeekStart(date);
        return weekStart.toISOString().split('T')[0]; // YYYY-MM-DD（その週の月曜日）
      case 'monthly':
        return date.toISOString().substring(0, 7); // YYYY-MM
      default:
        throw new Error(`未対応の期間タイプ: ${periodType}`);
    }
  }

  // 月曜日を開始日とした週の開始日を取得
  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を開始日とする
    return new Date(d.setDate(diff));
  }

  // 週番号を取得（月曜日始まりのISO週番号）
  private static getWeekOfYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  // 期間範囲を生成
  private static generatePeriods(startDate: Date, endDate: Date, periodType: PeriodType): Array<{key: string, label: string}> {
    const periods: Array<{key: string, label: string}> = [];
    const current = new Date(startDate);
    
    if (periodType === 'daily') {
      // 日単位: 31日分のデータ
      for (let i = 0; i < 31; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - 30 + i);
        const key = this.getPeriodKey(date, periodType);
        const label = this.getPeriodLabel(date, periodType);
        periods.push({ key, label });
      }
    } else if (periodType === 'weekly') {
      // 週単位: 3ヶ月分（約12-13週間）
      const weeksToShow = 13;
      for (let i = weeksToShow - 1; i >= 0; i--) {
        const weekDate = new Date(endDate);
        weekDate.setDate(weekDate.getDate() - (i * 7));
        const weekStart = this.getWeekStart(weekDate);
        const key = this.getPeriodKey(weekStart, periodType);
        const label = this.getPeriodLabel(weekStart, periodType);
        
        if (!periods.find(p => p.key === key)) {
          periods.push({ key, label });
        }
      }
    } else if (periodType === 'monthly') {
      // 月単位: 1年分（12ヶ月）
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(endDate);
        monthDate.setMonth(monthDate.getMonth() - i);
        monthDate.setDate(1); // 月の初日に設定
        const key = this.getPeriodKey(monthDate, periodType);
        const label = this.getPeriodLabel(monthDate, periodType);
        periods.push({ key, label });
      }
    }

    return periods;
  }

  // 期間ラベルを生成
  private static getPeriodLabel(date: Date, periodType: PeriodType): string {
    switch (periodType) {
      case 'daily':
        return `${date.getMonth() + 1}/${date.getDate()}`;
      case 'weekly':
        const weekStart = this.getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
      case 'monthly':
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  // 拠点別売上データを取得（スタッフ日報から拠点別に集計）
  static async getLocationSalesData(): Promise<LocationSalesData[]> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // 今月と先月の開始・終了日を計算
      const currentMonthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const currentMonthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      const lastMonthStart = `${lastMonthYear}-${lastMonth.toString().padStart(2, '0')}-01`;
      const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0).toISOString().split('T')[0];

      // 今月と先月のデータを並列取得
      const [currentMonthResult, lastMonthResult, locationsResult] = await Promise.all([
        // 今月のデータ
        supabase
          .from('daily_reports')
          .select(`
            user_id,
            report_date,
            sales_amount,
            customer_count,
            users!inner(
              user_location_access!inner(
                locations!inner(id, name, location_type)
              )
            )
          `)
          .gte('report_date', currentMonthStart)
          .lte('report_date', currentMonthEnd),
        
        // 先月のデータ
        supabase
          .from('daily_reports')
          .select(`
            user_id,
            report_date,
            sales_amount,
            customer_count,
            users!inner(
              user_location_access!inner(
                locations!inner(id, name, location_type)
              )
            )
          `)
          .gte('report_date', lastMonthStart)
          .lte('report_date', lastMonthEnd),

        // 全拠点リスト
        supabase
          .from('locations')
          .select('id, name, location_type')
          .eq('is_active', true)
      ]);

      if (currentMonthResult.error) throw new Error(`今月データ取得エラー: ${currentMonthResult.error.message}`);
      if (lastMonthResult.error) throw new Error(`先月データ取得エラー: ${lastMonthResult.error.message}`);
      if (locationsResult.error) throw new Error(`拠点データ取得エラー: ${locationsResult.error.message}`);

      const locations = locationsResult.data || [];
      
      // 拠点別の日別データを集計
      const locationDailyMap = new Map<string, Map<string, {
        totalSales: number;
        totalCustomers: number;
        staffCount: number;
      }>>();

      // データ処理関数
      const processMonthData = (monthData: any[], isCurrentMonth: boolean) => {
        monthData?.forEach((report: any) => {
          report.users?.user_location_access?.forEach((access: any) => {
            const locationId = access.locations?.id;
            const dateKey = `${locationId}-${report.report_date}`;
            
            if (locationId) {
              if (!locationDailyMap.has(locationId)) {
                locationDailyMap.set(locationId, new Map());
              }
              
              const locationMap = locationDailyMap.get(locationId)!;
              if (!locationMap.has(dateKey)) {
                locationMap.set(dateKey, {
                  totalSales: 0,
                  totalCustomers: 0,
                  staffCount: 0
                });
              }
              
              const dailyData = locationMap.get(dateKey)!;
              dailyData.totalSales += report.sales_amount || 0;
              dailyData.totalCustomers += report.customer_count || 0;
              dailyData.staffCount += 1;
            }
          });
        });
      };

      // 今月と先月のデータを処理
      processMonthData(currentMonthResult.data, true);
      processMonthData(lastMonthResult.data, false);

      // 拠点別月間売上を算出
      const locationSalesMap = new Map<string, {
        name: string;
        currentSales: number;
        lastSales: number;
        currentCustomers: number;
      }>();

      // 全拠点を初期化
      locations.forEach(location => {
        locationSalesMap.set(location.id, {
          name: location.name,
          currentSales: 0,
          lastSales: 0,
          currentCustomers: 0
        });

        // 拠点の日別データから月間合計を算出
        const locationDailyData = locationDailyMap.get(location.id);
        if (locationDailyData) {
          locationDailyData.forEach((dailyData, dateKey) => {
            const reportDate = dateKey.split('-').slice(1).join('-'); // locationId部分を除去
            const data = locationSalesMap.get(location.id)!;
            
            if (reportDate >= currentMonthStart && reportDate <= currentMonthEnd) {
              data.currentSales += dailyData.totalSales;
              data.currentCustomers += dailyData.totalCustomers;
            } else if (reportDate >= lastMonthStart && reportDate <= lastMonthEnd) {
              data.lastSales += dailyData.totalSales;
            }
          });
        }
      });

      // 結果を整形
      const result: LocationSalesData[] = [];
      locationSalesMap.forEach((data, locationId) => {
        const growth = this.calculateGrowthRate(data.currentSales, data.lastSales);
        result.push({
          locationId,
          locationName: data.name,
          currentMonthSales: data.currentSales,
          lastMonthSales: data.lastSales,
          monthOverMonthGrowth: growth,
          customerCount: data.currentCustomers,
          isGrowing: growth > 0
        });
      });

      // 売上高順にソート
      return result.sort((a, b) => b.currentMonthSales - a.currentMonthSales);

    } catch (error) {
      console.error('拠点別売上データ取得エラー:', error);
      throw error;
    }
  }
}