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
  };
  
  currentMonthSales: {
    totalSales: number;
    customerUnitPrice: number;
    customerPurchaseCount: number;
  };
  
  // 前月比
  monthOverMonthComparison: {
    salesGrowth: number; // パーセンテージ
    unitPriceGrowth: number;
    purchaseCountGrowth: number;
  };
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

  // 月間売上データを取得
  static async getMonthlySalesData(year: number, month: number) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_reports')
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
}