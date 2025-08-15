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
  LocationSalesData,
  PeriodType, 
  MetricType
} from '../services/dashboardService';

const CMSDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [locationSalesData, setLocationSalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('totalSales');

  useEffect(() => {
    loadDashboardData();
    loadLocationSalesData();
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
      setTimeSeriesData([]);
    } finally {
      setIsChartLoading(false);
    }
  };

  const loadLocationSalesData = async () => {
    try {
      setIsLocationLoading(true);
      const locationStats = await DashboardService.getLocationSalesData();
      setLocationSalesData(locationStats.slice(0, 10)); // 上位10拠点
    } catch (err) {
      console.error('拠点別売上データの取得に失敗:', err);
    } finally {
      setIsLocationLoading(false);
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

  // 線グラフコンポーネント
  const SalesChart: React.FC<{
    data: TimeSeriesData[];
    metric: MetricType;
    isLoading: boolean;
  }> = ({ data, metric, isLoading }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">データがありません</p>
        </div>
      );
    }

    // チャートの設定
    const chartWidth = 800;
    const chartHeight = 300;
    const padding = { top: 40, right: 60, bottom: 80, left: 80 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    // データの値を取得
    const values = data.map(d => getMetricValue(d, metric));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    const yMin = minValue - valueRange * 0.1;
    const yMax = maxValue + valueRange * 0.1;

    // スケール関数
    const xScale = (index: number) => (index / (data.length - 1)) * plotWidth;
    const yScale = (value: number) => plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;

    // パス文字列を生成
    const pathData = data.map((d, i) => {
      const x = xScale(i);
      const y = yScale(getMetricValue(d, metric));
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <div className="h-80 bg-white rounded-lg flex items-center justify-center overflow-hidden">
        <svg width={chartWidth} height={chartHeight} className="border border-gray-100">
          {/* グリッド線（水平） */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + ratio * plotHeight;
            return (
              <line
                key={`hgrid-${i}`}
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            );
          })}

          {/* メインライン */}
          <g transform={`translate(${padding.left},${padding.top})`}>
            <path
              d={pathData}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            
            {/* データポイント */}
            {data.map((d, i) => {
              const x = xScale(i);
              const y = yScale(getMetricValue(d, metric));
              const value = getMetricValue(d, metric);
              
              return (
                <g key={`point-${i}`}>
                  {/* 点 */}
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* データラベル */}
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-600"
                  >
                    {metric === 'totalSales' || metric === 'customerUnitPrice' 
                      ? `¥${Math.round(value).toLocaleString()}`
                      : metric === 'itemsPerCustomer'
                      ? value.toFixed(1)
                      : Math.round(value).toLocaleString()
                    }
                  </text>
                </g>
              );
            })}
          </g>

          {/* X軸ラベル */}
          <g>
            {data.map((d, i) => {
              const x = padding.left + xScale(i);
              return (
                <text
                  key={`xlabel-${i}`}
                  x={x}
                  y={chartHeight - 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                  transform={`rotate(-45, ${x}, ${chartHeight - 20})`}
                >
                  {d.label}
                </text>
              );
            })}
          </g>

          {/* タイトル */}
          <text
            x={chartWidth / 2}
            y={20}
            textAnchor="middle"
            className="text-sm font-semibold fill-gray-700"
          >
            {getMetricLabel(metric)}の推移
          </text>
        </svg>
      </div>
    );
  };

  // 拠点別売上横棒グラフコンポーネント
  const LocationSalesChart: React.FC<{
    data: LocationSalesData[];
    isLoading: boolean;
  }> = ({ data, isLoading }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 text-xs">データを読み込み中...</p>
          </div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p className="text-sm">データがありません</p>
        </div>
      );
    }

    const maxSales = Math.max(...data.map(d => d.currentMonthSales));

    return (
      <div className="space-y-3">
        {data.map((location, index) => {
          const percentage = (location.currentMonthSales / maxSales) * 100;
          const isGrowing = location.monthOverMonthGrowth > 0;
          
          return (
            <div key={location.locationId} className="relative">
              {/* 拠点名と売上額 */}
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 w-4">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {location.locationName}
                  </span>
                  <div className="flex items-center space-x-1">
                    {isGrowing ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={`text-xs ${isGrowing ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(location.monthOverMonthGrowth)}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(location.currentMonthSales)}
                </span>
              </div>
              
              {/* プログレスバー */}
              <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div 
                  className="h-6 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                >
                  <span className="text-white text-xs font-medium">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              {/* 客数情報 */}
              <div className="mt-1 text-xs text-gray-500">
                客数: {location.customerCount}人
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // GA風KPIメトリクスカード
  const MetricsCard: React.FC<{
    title: string;
    value: string;
    change: number;
    subtitle?: string;
    color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  }> = ({ title, value, change, subtitle, color = 'blue' }) => {
    const colorClasses = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      red: 'border-red-200 bg-red-50',
      purple: 'border-purple-200 bg-purple-50',
      orange: 'border-orange-200 bg-orange-50'
    };

    return (
      <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="ml-3 flex flex-col items-end">
            <div className="flex items-center">
              {change > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : change < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-500" />
              )}
              <span className={`text-sm font-medium ml-1 ${
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {formatPercentage(change)}
              </span>
            </div>
            <span className="text-xs text-gray-500 mt-1">前月比</span>
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

        {/* 今月実績サマリー */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">今月の売上KPI</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* 売上 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">売上</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {formatCurrency(stats.currentMonthSales.totalSales)}
                </div>
                <div className="flex items-center justify-center text-sm">
                  {getTrendIcon(stats.monthOverMonthComparison.salesGrowth)}
                  <span className={`ml-1 font-medium ${getTrendColor(stats.monthOverMonthComparison.salesGrowth)}`}>
                    {formatPercentage(stats.monthOverMonthComparison.salesGrowth)}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">前月比</span>
                </div>
              </div>
            </div>

            {/* 購入お客様数 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">購入お客様数</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatNumber(stats.currentMonthSales.customerPurchaseCount)}
                </div>
                <div className="text-xs text-gray-500 mb-2">人</div>
                <div className="flex items-center justify-center text-sm">
                  {getTrendIcon(stats.monthOverMonthComparison.purchaseCountGrowth)}
                  <span className={`ml-1 font-medium ${getTrendColor(stats.monthOverMonthComparison.purchaseCountGrowth)}`}>
                    {formatPercentage(stats.monthOverMonthComparison.purchaseCountGrowth)}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">前月比</span>
                </div>
              </div>
            </div>

            {/* 販売アイテム数 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">販売アイテム数</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatNumber(Math.round(stats.currentMonthSales.customerPurchaseCount * stats.currentMonthSales.itemsPerCustomer))}
                </div>
                <div className="text-xs text-gray-500">個</div>
              </div>
            </div>

            {/* 顧客単価 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">顧客単価</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {formatCurrency(stats.currentMonthSales.customerUnitPrice)}
                </div>
                <div className="flex items-center justify-center text-sm">
                  {getTrendIcon(stats.monthOverMonthComparison.unitPriceGrowth)}
                  <span className={`ml-1 font-medium ${getTrendColor(stats.monthOverMonthComparison.unitPriceGrowth)}`}>
                    {formatPercentage(stats.monthOverMonthComparison.unitPriceGrowth)}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">前月比</span>
                </div>
              </div>
            </div>

            {/* 顧客販売個数 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">顧客販売個数</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {(stats.currentMonthSales.itemsPerCustomer || 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">個/人</div>
              </div>
            </div>
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
                  <option value="totalSales">売上（円）</option>
                  <option value="customerCount">購入お客様数（人）</option>
                  <option value="itemsSold">販売アイテム数（個）</option>
                  <option value="customerUnitPrice">顧客単価（円）</option>
                  <option value="itemsPerCustomer">顧客販売個数（個/人）</option>
                </select>
              </div>
            </div>
          </div>

          {/* グラフエリア（横幅いっぱい使用） */}
          <div className="border rounded-lg p-3 bg-gray-50 w-full overflow-x-auto">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-900">
                {getMetricLabel(selectedMetric)}の推移
              </h3>
              <p className="text-xs text-gray-600">
                期間: {getPeriodLabel(selectedPeriod)} | 単位: {getMetricUnit(selectedMetric)}
              </p>
            </div>
            
            <SalesChart 
              data={timeSeriesData} 
              metric={selectedMetric}
              isLoading={isChartLoading}
            />
          </div>
        </div>

        {/* GA風KPIメトリクス */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">パフォーマンス指標</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats && (
              <>
                <MetricsCard
                  title="総売上"
                  value={`¥${Math.round(stats.currentMonthSales.totalSales / 10000)}万`}
                  change={stats.monthOverMonthComparison.salesGrowth}
                  subtitle="今月実績"
                  color="blue"
                />
                <MetricsCard
                  title="客単価"
                  value={formatCurrency(stats.currentMonthSales.customerUnitPrice)}
                  change={stats.monthOverMonthComparison.unitPriceGrowth}
                  subtitle="平均単価"
                  color="green"
                />
                <MetricsCard
                  title="購入客数"
                  value={`${formatNumber(stats.currentMonthSales.customerPurchaseCount)}人`}
                  change={stats.monthOverMonthComparison.purchaseCountGrowth}
                  subtitle="今月来店客数"
                  color="purple"
                />
                <MetricsCard
                  title="購入率"
                  value={`${((stats.currentMonthSales.customerPurchaseCount / stats.monthlyActiveUsers) * 100).toFixed(1)}%`}
                  change={stats.monthOverMonthComparison.purchaseCountGrowth - stats.monthOverMonthComparison.salesGrowth}
                  subtitle="アクティブユーザー比"
                  color="orange"
                />
              </>
            )}
          </div>
        </div>

        {/* 3列レイアウト：拠点別売上、基本統計、今月のアクティビティ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* 拠点別売上上位10 */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">拠点別売上</h2>
                  <p className="text-xs text-gray-600">今月の売上上位10拠点</p>
                </div>
              </div>
              <button
                onClick={loadLocationSalesData}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                更新
              </button>
            </div>
            <LocationSalesChart 
              data={locationSalesData} 
              isLoading={isLocationLoading}
            />
          </div>

        {/* 2列レイアウト：基本統計と今月のアクティビティ */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
    </div>
  );
};

export default CMSDashboard;