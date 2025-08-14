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
  customerUnitPrice: number;
  itemsPerCustomer: number;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly';
export type MetricType = 'totalSales' | 'customerUnitPrice' | 'itemsPerCustomer';

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

  // 月間売上データを取得
  static async getMonthlySalesData(year: number, month: number) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_reports_with_metrics')
      .select('sales_amount, customer_count, customer_unit_price')
      .gte('report_date', startDate)
      .lte('report_date', endDate);

    if (error) throw new Error(`月間売上データの取得に失敗: ${error.message}`);

    const totalSales = data?.reduce((sum, report) => sum + report.sales_amount, 0) || 0;
    const totalCustomers = data?.reduce((sum, report) => sum + report.customer_count, 0) || 0;
    const totalUnitPriceSum = data?.reduce((sum, report) => 
      sum + (report.customer_unit_price || 0), 0) || 0;

    return {
      totalSales,
      customerUnitPrice: data?.length ? totalUnitPriceSum / data.length : 0,
      customerPurchaseCount: totalCustomers
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
        currentMonthSales,
        lastMonthSales,
        monthOverMonthComparison
      };
    } catch (error) {
      console.error('ダッシュボード統計の取得に失敗:', error);
      throw error;
    }
  }

  // 時系列売上データを取得
  static async getTimeSeriesData(periodType: PeriodType): Promise<TimeSeriesData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // 期間タイプに応じて開始日を設定
      switch (periodType) {
        case 'daily': // 1日単位の1ヶ月分
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'weekly': // 週単位の3ヶ月分
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'monthly': // 1ヶ月単位の1年分
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // データベースから売上データを取得
      const { data: dailyReports, error } = await supabase
        .from('daily_reports_with_metrics')
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

  // 時系列データを処理
  private static processTimeSeriesData(
    reports: DailyReport[], 
    periodType: PeriodType,
    startDate: Date,
    endDate: Date
  ): TimeSeriesData[] {
    const dataMap = new Map<string, {
      totalSales: number;
      totalItems: number;
      totalCustomers: number;
      reportCount: number;
    }>();

    // レポートデータをグループ化
    reports.forEach(report => {
      const reportDate = new Date(report.report_date);
      const periodKey = this.getPeriodKey(reportDate, periodType);
      
      if (!dataMap.has(periodKey)) {
        dataMap.set(periodKey, {
          totalSales: 0,
          totalItems: 0,
          totalCustomers: 0,
          reportCount: 0
        });
      }

      const data = dataMap.get(periodKey)!;
      data.totalSales += report.sales_amount;
      data.totalItems += report.items_sold;
      data.totalCustomers += report.customer_count;
      data.reportCount += 1;
    });

    // 期間の全範囲を生成（データがない期間も含む）
    const periods = this.generatePeriods(startDate, endDate, periodType);
    
    return periods.map(period => {
      const data = dataMap.get(period.key) || {
        totalSales: 0,
        totalItems: 0,
        totalCustomers: 0,
        reportCount: 0
      };

      const customerUnitPrice = data.totalCustomers > 0 ? data.totalSales / data.totalCustomers : 0;
      const itemsPerCustomer = data.totalCustomers > 0 ? data.totalItems / data.totalCustomers : 0;

      return {
        period: period.key,
        label: period.label,
        totalSales: data.totalSales,
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
        const year = date.getFullYear();
        const week = this.getWeekOfYear(date);
        return `${year}-W${week.toString().padStart(2, '0')}`; // YYYY-WNN
      case 'monthly':
        return date.toISOString().substring(0, 7); // YYYY-MM
      default:
        throw new Error(`未対応の期間タイプ: ${periodType}`);
    }
  }

  // 週番号を取得（ISO週番号）
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
    
    while (current <= endDate) {
      const key = this.getPeriodKey(current, periodType);
      const label = this.getPeriodLabel(current, periodType);
      
      // 重複チェック
      if (!periods.find(p => p.key === key)) {
        periods.push({ key, label });
      }

      // 次の期間へ
      switch (periodType) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
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
        const week = this.getWeekOfYear(date);
        return `${date.getFullYear()}年 第${week}週`;
      case 'monthly':
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
      default:
        return date.toISOString().split('T')[0];
    }
  }
}