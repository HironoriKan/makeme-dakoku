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
  UserCheck,
  BarChart3
} from 'lucide-react';
import { 
  DashboardService, 
  DashboardStats, 
  TimeSeriesData, 
  PeriodType, 
  MetricType 
} from '../services/dashboardService';

const CMSDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('totalSales');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadTimeSeriesData();
  }, [selectedPeriod]);

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

  const loadTimeSeriesData = async () => {
    try {
      setIsChartLoading(true);
      const timeSeriesStats = await DashboardService.getTimeSeriesData(selectedPeriod);
      setTimeSeriesData(timeSeriesStats);
    } catch (err) {
      console.error('時系列データの取得に失敗:', err);
      // グラフデータのエラーは全体のエラー状態には影響しない
    } finally {
      setIsChartLoading(false);
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

  const getMetricValue = (data: TimeSeriesData, metric: MetricType): number => {
    switch (metric) {
      case 'totalSales': return data.totalSales;
      case 'customerUnitPrice': return data.customerUnitPrice;
      case 'itemsPerCustomer': return data.itemsPerCustomer;
    }
  };

  const getMetricLabel = (metric: MetricType): string => {
    switch (metric) {
      case 'totalSales': return '売上高';
      case 'customerUnitPrice': return '顧客単価';
      case 'itemsPerCustomer': return '一人当たり購入個数';
    }
  };

  const getMetricUnit = (metric: MetricType): string => {
    switch (metric) {
      case 'totalSales': return '円';
      case 'customerUnitPrice': return '円';
      case 'itemsPerCustomer': return '個';
    }
  };

  const getPeriodLabel = (period: PeriodType): string => {
    switch (period) {
      case 'daily': return '1日単位（1ヶ月）';
      case 'weekly': return '週単位（3ヶ月）';
      case 'monthly': return '月単位（1年）';
    }
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

  // 簡易折れ線グラフコンポーネント
  const LineChart: React.FC<{
    data: TimeSeriesData[];
    metric: MetricType;
    isLoading: boolean;
  }> = ({ data, metric, isLoading }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 text-xs">グラフを読み込み中...</p>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p className="text-sm">データがありません</p>
        </div>
      );
    }

    const values = data.map(d => getMetricValue(d, metric));
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    const chartWidth = 500;
    const chartHeight = 160;
    const padding = 30;

    // SVGパスを生成
    const pathData = data.map((d, index) => {
      const x = padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);
      const value = getMetricValue(d, metric);
      const y = chartHeight - padding - ((value - minValue) / range) * (chartHeight - 2 * padding);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <div className="relative">
        <svg width={chartWidth} height={chartHeight} className="w-full h-48">
          {/* グリッドライン */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y軸ラベル */}
          <text x="10" y="25" fontSize="12" fill="#666" textAnchor="middle">
            {metric === 'totalSales' ? formatCurrency(maxValue) : formatNumber(maxValue)}
          </text>
          <text x="10" y={chartHeight - 10} fontSize="12" fill="#666" textAnchor="middle">
            {metric === 'totalSales' ? formatCurrency(minValue) : formatNumber(minValue)}
          </text>
          
          {/* 折れ線 */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* データポイント */}
          {data.map((d, index) => {
            const x = padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);
            const value = getMetricValue(d, metric);
            const y = chartHeight - padding - ((value - minValue) / range) * (chartHeight - 2 * padding);
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3b82f6"
                  className="hover:fill-blue-700 cursor-pointer"
                />
                {/* ホバー時のツールチップ効果（簡易版） */}
                <title>
                  {d.label}: {metric === 'totalSales' ? formatCurrency(value) : formatNumber(value)}
                </title>
              </g>
            );
          })}
        </svg>
        
        {/* X軸ラベル */}
        <div className="flex justify-between mt-2 px-10 text-xs text-gray-600">
          <span>{data[0]?.label}</span>
          {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.label}</span>}
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
    );
  };

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
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* ヘッダー */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">CMSダッシュボード</h1>
          <p className="text-gray-600 text-sm">システム全体の統計情報とパフォーマンス指標</p>
        </div>

        {/* 今月実績サマリー（売上トレンド分析の上に移動） */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">今月の売上実績</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="今月の売上高"
              value={formatCurrency(stats.currentMonthSales.totalSales)}
              icon={<DollarSign className="w-5 h-5 text-blue-600" />}
              trend={stats.monthOverMonthComparison.salesGrowth}
            />
            <StatsCard
              title="今月の顧客単価"
              value={formatCurrency(stats.currentMonthSales.customerUnitPrice)}
              icon={<ShoppingCart className="w-5 h-5 text-green-600" />}
              trend={stats.monthOverMonthComparison.unitPriceGrowth}
            />
            <StatsCard
              title="今月の顧客購入数"
              value={stats.currentMonthSales.customerPurchaseCount}
              icon={<Users className="w-5 h-5 text-purple-600" />}
              trend={stats.monthOverMonthComparison.purchaseCountGrowth}
              subtitle="人"
            />
          </div>
        </div>

        {/* 売上トレンド分析 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">売上トレンド分析</h2>
                <p className="text-xs text-gray-600">時系列データで売上動向を確認</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* 期間切り替え */}
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-700">期間:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as PeriodType)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="monthly">月単位（1年）</option>
                  <option value="weekly">週単位（3ヶ月）</option>
                  <option value="daily">日単位（1ヶ月）</option>
                </select>
              </div>
              
              {/* 指標切り替え */}
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-700">指標:</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="totalSales">売上高</option>
                  <option value="customerUnitPrice">顧客単価</option>
                  <option value="itemsPerCustomer">一人当たり購入個数</option>
                </select>
              </div>
            </div>
          </div>

          {/* グラフエリア */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-900">
                {getMetricLabel(selectedMetric)}の推移
              </h3>
              <p className="text-xs text-gray-600">
                期間: {getPeriodLabel(selectedPeriod)} | 単位: {getMetricUnit(selectedMetric)}
              </p>
            </div>
            
            <LineChart 
              data={timeSeriesData} 
              metric={selectedMetric}
              isLoading={isChartLoading}
            />
          </div>
        </div>

        {/* 2列レイアウト：基本統計と今月のアクティビティ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* 基本統計 */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">基本統計</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">有効ユーザー数</p>
                    <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalActiveUsers)}</p>
                  </div>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">有効拠点数</p>
                    <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalActiveLocations)}</p>
                  </div>
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">有効常設店数</p>
                    <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalActivePermanentStores)}</p>
                  </div>
                  <Store className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">有効イベント数</p>
                    <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalActiveEvents)}</p>
                  </div>
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 今月のアクティビティ */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">今月のアクティビティ</h2>
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">今月のアクティブユーザー数</p>
                    <p className="text-xl font-bold text-gray-900">{formatNumber(stats.monthlyActiveUsers)}</p>
                    <p className="text-xs text-gray-500">今月シフトが登録されている人数</p>
                  </div>
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">今月のアクティブ常設店数</p>
                    <p className="text-xl font-bold text-gray-900">{formatNumber(stats.monthlyActivePermanentStores)}</p>
                    <p className="text-xs text-gray-500">シフトが入っている常設店数</p>
                  </div>
                  <Store className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">今月のアクティブイベント数</p>
                    <p className="text-xl font-bold text-gray-900">{formatNumber(stats.monthlyActiveEvents)}</p>
                    <p className="text-xs text-gray-500">シフトが入っているイベント数</p>
                  </div>
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSDashboard;