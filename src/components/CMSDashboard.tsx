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
  ComparisonTimeSeriesData, 
  PeriodType, 
  MetricType 
} from '../services/dashboardService';

const CMSDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<ComparisonTimeSeriesData | null>(null);
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
      const timeSeriesStats = await DashboardService.getTimeSeriesDataWithComparison(selectedPeriod);
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
      case 'customerCount': return data.customerCount;
      case 'itemsSold': return data.itemsSold;
      case 'customerUnitPrice': return data.customerUnitPrice;
      case 'itemsPerCustomer': return data.itemsPerCustomer;
    }
  };

  const getMetricLabel = (metric: MetricType): string => {
    switch (metric) {
      case 'totalSales': return '売上';
      case 'customerCount': return '購入お客様数';
      case 'itemsSold': return '販売アイテム数';
      case 'customerUnitPrice': return '顧客単価';
      case 'itemsPerCustomer': return '顧客販売個数';
    }
  };

  const getMetricUnit = (metric: MetricType): string => {
    switch (metric) {
      case 'totalSales': return '円';
      case 'customerCount': return '人';
      case 'itemsSold': return '個';
      case 'customerUnitPrice': return '円';
      case 'itemsPerCustomer': return '個';
    }
  };

  const getPeriodLabel = (period: PeriodType): string => {
    switch (period) {
      case 'daily': return '日単位（31日間）';
      case 'weekly': return '週単位（3ヶ月間、月曜開始）';
      case 'monthly': return '月単位（1年間）';
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

  // 比較折れ線グラフコンポーネント
  const ComparisonLineChart: React.FC<{
    data: ComparisonTimeSeriesData | null;
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

    if (!data || data.current.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p className="text-sm">データがありません</p>
        </div>
      );
    }

    const currentValues = data.current.map(d => getMetricValue(d, metric));
    const comparisonValues = data.comparison.map(d => getMetricValue(d, metric));
    const allValues = [...currentValues, ...comparisonValues];
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue || 1;

    const chartWidth = Math.max(1000, data.current.length * 40); // PC用に拡張
    const chartHeight = 200;
    const padding = 50;

    // 現在のSVGパスを生成（実線）
    const currentPathData = data.current.map((d, index) => {
      const x = padding + (index * (chartWidth - 2 * padding)) / (data.current.length - 1);
      const value = getMetricValue(d, metric);
      const y = chartHeight - padding - ((value - minValue) / range) * (chartHeight - 2 * padding);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // 比較のSVGパスを生成（波線）
    const comparisonPathData = data.comparison.map((d, index) => {
      const x = padding + (index * (chartWidth - 2 * padding)) / (data.comparison.length - 1);
      const value = getMetricValue(d, metric);
      const y = chartHeight - padding - ((value - minValue) / range) * (chartHeight - 2 * padding);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <div className="relative overflow-x-auto">
        <div style={{ width: `${chartWidth}px`, minWidth: '100%' }}>
          <svg width={chartWidth} height={chartHeight} className="h-52">
          {/* グリッドライン */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y軸ラベル */}
          <text x="10" y="25" fontSize="12" fill="#666" textAnchor="middle">
            {(metric === 'totalSales' || metric === 'customerUnitPrice') ? formatCurrency(maxValue) : formatNumber(maxValue)}
          </text>
          <text x="10" y={chartHeight - 10} fontSize="12" fill="#666" textAnchor="middle">
            {(metric === 'totalSales' || metric === 'customerUnitPrice') ? formatCurrency(minValue) : formatNumber(minValue)}
          </text>
          
          {/* 現在の折れ線（実線） */}
          <path
            d={currentPathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            className="drop-shadow-sm"
          />
          
          {/* 比較の折れ線（波線） */}
          <path
            d={comparisonPathData}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="8,4"
            className="drop-shadow-sm"
          />
          
          {/* 現在のデータポイント */}
          {data.current.map((d, index) => {
            const x = padding + (index * (chartWidth - 2 * padding)) / (data.current.length - 1);
            const value = getMetricValue(d, metric);
            const y = chartHeight - padding - ((value - minValue) / range) * (chartHeight - 2 * padding);
            
            return (
              <g key={`current-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3b82f6"
                  className="hover:fill-blue-700 cursor-pointer"
                />
                <title>
                  現在: {d.label}: {(metric === 'totalSales' || metric === 'customerUnitPrice') ? formatCurrency(value) : formatNumber(value)}
                </title>
              </g>
            );
          })}
          
          {/* 比較のデータポイント */}
          {data.comparison.map((d, index) => {
            const x = padding + (index * (chartWidth - 2 * padding)) / (data.comparison.length - 1);
            const value = getMetricValue(d, metric);
            const y = chartHeight - padding - ((value - minValue) / range) * (chartHeight - 2 * padding);
            
            return (
              <g key={`comparison-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#f59e0b"
                  className="hover:fill-amber-600 cursor-pointer"
                />
                <title>
                  {data.comparisonLabel}: {d.label}: {(metric === 'totalSales' || metric === 'customerUnitPrice') ? formatCurrency(value) : formatNumber(value)}
                </title>
              </g>
            );
          })}
          </svg>
        </div>
        
        {/* 凡例 */}
        <div className="mt-4 flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-blue-500"></div>
            <span className="text-sm text-gray-600">現在</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-amber-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #f59e0b 0, #f59e0b 6px, transparent 6px, transparent 10px)' }}></div>
            <span className="text-sm text-gray-600">{data.comparisonLabel}</span>
          </div>
        </div>
        
        {/* X軸ラベル */}
        <div className="mt-2 overflow-x-auto" style={{ width: '100%' }}>
          <div className="relative" style={{ width: `${chartWidth}px`, height: '20px' }}>
            {data.current.map((point, index) => {
              const x = padding + (index * (chartWidth - 2 * padding)) / (data.current.length - 1);
              return (
                <div 
                  key={index}
                  className="absolute text-xs text-gray-600 text-center"
                  style={{ 
                    left: `${x}px`, 
                    transform: 'translateX(-50%)',
                    width: '50px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {point.label}
                </div>
              );
            })}
          </div>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">今月の売上KPI</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatsCard
              title="売上"
              value={formatCurrency(stats.currentMonthSales.totalSales)}
              icon={<DollarSign className="w-4 h-4 text-blue-600" />}
              trend={stats.monthOverMonthComparison.salesGrowth}
            />
            <StatsCard
              title="購入お客様数"
              value={stats.currentMonthSales.customerPurchaseCount}
              icon={<Users className="w-4 h-4 text-green-600" />}
              trend={stats.monthOverMonthComparison.purchaseCountGrowth}
              subtitle="人"
            />
            <StatsCard
              title="販売アイテム数"
              value={Math.round(stats.currentMonthSales.customerPurchaseCount * stats.currentMonthSales.itemsPerCustomer)}
              icon={<ShoppingCart className="w-4 h-4 text-purple-600" />}
              subtitle="個"
            />
            <StatsCard
              title="顧客単価"
              value={formatCurrency(stats.currentMonthSales.customerUnitPrice)}
              icon={<BarChart3 className="w-4 h-4 text-orange-600" />}
              trend={stats.monthOverMonthComparison.unitPriceGrowth}
            />
            <StatsCard
              title="顧客販売個数"
              value={(stats.currentMonthSales.itemsPerCustomer || 0).toFixed(1)}
              icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
              subtitle="個/人"
            />
          </div>
        </div>

        {/* 売上トレンド分析 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 w-full">
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
                  <option value="monthly">月単位（1年間）</option>
                  <option value="weekly">週単位（3ヶ月間）</option>
                  <option value="daily">日単位（31日間）</option>
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
                  <option value="totalSales">売上</option>
                  <option value="customerCount">購入お客様数</option>
                  <option value="itemsSold">販売アイテム数</option>
                  <option value="customerUnitPrice">顧客単価</option>
                  <option value="itemsPerCustomer">顧客販売個数</option>
                </select>
              </div>
            </div>
          </div>

          {/* グラフエリア（横幅いっぱい使用） */}
          <div className="border rounded-lg p-3 bg-gray-50 w-full overflow-hidden">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-900">
                {getMetricLabel(selectedMetric)}の推移
              </h3>
              <p className="text-xs text-gray-600">
                期間: {getPeriodLabel(selectedPeriod)} | 単位: {getMetricUnit(selectedMetric)}
              </p>
            </div>
            
            <ComparisonLineChart 
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