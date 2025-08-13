import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Store, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ShoppingCart,
  UserCheck
} from 'lucide-react';
import { DashboardService, DashboardStats } from '../services/dashboardService';

const CMSDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dashboardStats = await DashboardService.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('ダッシュボードデータの取得に失敗:', err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(num));
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (percentage < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (percentage: number) => {
    if (percentage > 0) return 'text-green-600';
    if (percentage < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadDashboardData}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                再読み込み
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const StatsCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
    subtitle?: string;
  }> = ({ title, value, icon, trend, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {getTrendIcon(trend)}
              <span className={`text-sm font-medium ml-1 ${getTrendColor(trend)}`}>
                {formatPercentage(trend)}
              </span>
              <span className="text-xs text-gray-500 ml-1">前月比</span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CMSダッシュボード</h1>
          <p className="text-gray-600 mt-2">システム全体の統計情報とパフォーマンス指標</p>
        </div>

        {/* 基本統計 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">基本統計</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="有効ユーザー数"
              value={stats.totalActiveUsers}
              icon={<Users className="w-6 h-6 text-blue-600" />}
            />
            <StatsCard
              title="有効拠点数"
              value={stats.totalActiveLocations}
              icon={<MapPin className="w-6 h-6 text-blue-600" />}
            />
            <StatsCard
              title="有効常設店数"
              value={stats.totalActivePermanentStores}
              icon={<Store className="w-6 h-6 text-blue-600" />}
            />
            <StatsCard
              title="有効イベント数"
              value={stats.totalActiveEvents}
              icon={<Calendar className="w-6 h-6 text-blue-600" />}
            />
          </div>
        </div>

        {/* 今月のアクティビティ */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">今月のアクティビティ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="今月のアクティブユーザー数"
              value={stats.monthlyActiveUsers}
              icon={<UserCheck className="w-6 h-6 text-green-600" />}
              subtitle="今月シフトが登録されている人数"
            />
            <StatsCard
              title="今月のアクティブ常設店数"
              value={stats.monthlyActivePermanentStores}
              icon={<Store className="w-6 h-6 text-green-600" />}
              subtitle="シフトが入っている常設店数"
            />
            <StatsCard
              title="今月のアクティブイベント数"
              value={stats.monthlyActiveEvents}
              icon={<Calendar className="w-6 h-6 text-green-600" />}
              subtitle="シフトが入っているイベント数"
            />
          </div>
        </div>

        {/* 売上データ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 先月の売上 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">先月の売上</h2>
            <div className="space-y-4">
              <StatsCard
                title="売上高"
                value={formatCurrency(stats.lastMonthSales.totalSales)}
                icon={<DollarSign className="w-6 h-6 text-purple-600" />}
              />
              <StatsCard
                title="顧客単価"
                value={formatCurrency(stats.lastMonthSales.customerUnitPrice)}
                icon={<ShoppingCart className="w-6 h-6 text-purple-600" />}
              />
              <StatsCard
                title="顧客購入数"
                value={stats.lastMonthSales.customerPurchaseCount}
                icon={<Users className="w-6 h-6 text-purple-600" />}
                subtitle="人"
              />
            </div>
          </div>

          {/* 今月の売上 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">今月の売上</h2>
            <div className="space-y-4">
              <StatsCard
                title="売上高"
                value={formatCurrency(stats.currentMonthSales.totalSales)}
                icon={<DollarSign className="w-6 h-6 text-orange-600" />}
                trend={stats.monthOverMonthComparison.salesGrowth}
              />
              <StatsCard
                title="顧客単価"
                value={formatCurrency(stats.currentMonthSales.customerUnitPrice)}
                icon={<ShoppingCart className="w-6 h-6 text-orange-600" />}
                trend={stats.monthOverMonthComparison.unitPriceGrowth}
              />
              <StatsCard
                title="顧客購入数"
                value={stats.currentMonthSales.customerPurchaseCount}
                icon={<Users className="w-6 h-6 text-orange-600" />}
                trend={stats.monthOverMonthComparison.purchaseCountGrowth}
                subtitle="人"
              />
            </div>
          </div>
        </div>

        {/* リフレッシュボタン */}
        <div className="mt-8 text-center">
          <button
            onClick={loadDashboardData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            データを更新
          </button>
        </div>
      </div>
    </div>
  );
};

export default CMSDashboard;