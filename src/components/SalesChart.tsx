import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DailyReportService, DailyReport } from '../services/dailyReportService';

type PeriodType = 'day' | 'week' | 'month';

interface ChartDataPoint {
  label: string;
  value: number;
  date: string;
}

interface SalesChartProps {}

const SalesChart: React.FC<SalesChartProps> = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('day');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [maxSales, setMaxSales] = useState(0);
  const [avgSales, setAvgSales] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // データ取得
  const fetchChartData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const now = new Date();
      const data: ChartDataPoint[] = [];

      if (selectedPeriod === 'day') {
        // 過去31日間のデータを取得
        const currentMonth = await DailyReportService.getMonthlyReports(user, now.getFullYear(), now.getMonth() + 1);
        const previousMonth = await DailyReportService.getMonthlyReports(user, now.getFullYear(), now.getMonth());
        const allReports = [...currentMonth, ...previousMonth];
        
        // 過去31日分のデータを作成
        for (let i = 30; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          
          const dayReport = allReports.find(r => r.report_date === dateString);
          data.push({
            label: date.getDate().toString(),
            value: dayReport?.sales_amount || 0,
            date: dateString
          });
        }
      } else if (selectedPeriod === 'week') {
        // 過去3ヶ月分の週単位データを取得（約12-13週間）
        const weeksToShow = 12; // 3ヶ月分の週数
        
        // 過去3ヶ月分の全データを取得
        const allReports: any[] = [];
        for (let i = 2; i >= 0; i--) {
          const monthDate = new Date(now);
          monthDate.setMonth(monthDate.getMonth() - i);
          
          const monthReports = await DailyReportService.getMonthlyReports(
            user, 
            monthDate.getFullYear(), 
            monthDate.getMonth() + 1
          );
          allReports.push(...monthReports);
        }
        
        // 週単位でグループ化
        for (let weekIndex = weeksToShow - 1; weekIndex >= 0; weekIndex--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (weekIndex * 7) - (now.getDay() || 7) + 1);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          // その週の売上を集計
          const weekSales = allReports
            .filter(r => {
              const reportDate = new Date(r.report_date);
              return reportDate >= weekStart && reportDate <= weekEnd;
            })
            .reduce((sum, r) => sum + r.sales_amount, 0);

          data.push({
            label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            value: weekSales,
            date: weekStart.toISOString().split('T')[0]
          });
        }
      } else if (selectedPeriod === 'month') {
        // 過去12ヶ月（1年）のデータを取得
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(now);
          monthDate.setMonth(monthDate.getMonth() - i);
          
          const monthReports = await DailyReportService.getMonthlyReports(
            user, 
            monthDate.getFullYear(), 
            monthDate.getMonth() + 1
          );
          
          const monthSales = monthReports.reduce((sum, r) => sum + r.sales_amount, 0);
          
          data.push({
            label: `${monthDate.getFullYear()}/${monthDate.getMonth() + 1}`,
            value: monthSales,
            date: monthDate.toISOString().split('T')[0]
          });
        }
      }

      setChartData(data);
      const total = data.reduce((sum, d) => sum + d.value, 0);
      const max = Math.max(...data.map(d => d.value));
      const avg = data.length > 0 ? total / data.length : 0;
      
      setTotalSales(total);
      setMaxSales(max);
      setAvgSales(avg);

      // データが更新されたら最新日付にスクロール
      setTimeout(() => {
        scrollToLatest();
      }, 100);
    } catch (error) {
      console.error('売上データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [user, selectedPeriod]);

  // 最新日付（右端）にスクロールする関数
  const scrollToLatest = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  };

  // チャート描画
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-40 flex items-center justify-center text-gray-500">
          <span className="text-sm">データがありません</span>
        </div>
      );
    }

    const maxValue = Math.max(...chartData.map(d => d.value));
    const chartHeight = 120;
    const minBarWidth = 40; // 最小バー幅
    const barSpacing = 12; // バー間のスペース
    const containerWidth = 280; // コンテナ幅
    const totalBarsWidth = chartData.length * (minBarWidth + barSpacing);
    const chartWidth = Math.max(containerWidth, totalBarsWidth);
    const barWidth = Math.max(minBarWidth, (chartWidth - (chartData.length * barSpacing)) / chartData.length);
    
    // マージン設定（縦軸ラベルは非表示）
    const yAxisWidth = 0; // 縦軸ラベル非表示のため0に変更
    const topMargin = 25; // 上部マージン（値ラベル用）
    const bottomMargin = 25; // 下部マージン（日付ラベル用）
    const svgHeight = chartHeight + topMargin + bottomMargin;
    const svgWidth = chartWidth + yAxisWidth;
    
    // 縦軸の目盛り値を計算（5段階）
    const getYAxisTicks = (maxVal: number) => {
      if (maxVal === 0) return [0];
      
      // 最大値を基に適切な間隔を計算
      const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
      const normalized = maxVal / magnitude;
      
      let stepSize;
      if (normalized <= 1) stepSize = 0.2 * magnitude;
      else if (normalized <= 2) stepSize = 0.4 * magnitude;
      else if (normalized <= 5) stepSize = magnitude;
      else stepSize = 2 * magnitude;
      
      const ticks = [];
      for (let i = 0; i <= Math.ceil(maxVal / stepSize); i++) {
        ticks.push(i * stepSize);
      }
      return ticks;
    };
    
    const yAxisTicks = getYAxisTicks(maxValue);
    const adjustedMaxValue = Math.max(...yAxisTicks);

    return (
      <div ref={scrollContainerRef} className="relative overflow-x-auto">
        <div style={{ width: `${Math.max(containerWidth, svgWidth)}px` }}>
          <svg width={svgWidth} height={svgHeight}>
            {/* グリッドライン（縦軸ラベルは非表示） */}
            {yAxisTicks.map((tick, i) => {
              const y = topMargin + chartHeight * (1 - tick / adjustedMaxValue);
              return (
                <g key={i}>
                  {/* グリッドライン */}
                  <line
                    x1={0}
                    y1={y}
                    x2={svgWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </g>
              );
            })}

            {/* バーチャート */}
            {chartData.map((point, index) => {
              const barHeight = adjustedMaxValue > 0 ? (point.value / adjustedMaxValue) * chartHeight : 0;
              // バーの正確な位置計算: yAxisWidth + 各バーの開始位置
              const barX = yAxisWidth + index * (barWidth + barSpacing);
              const barCenterX = barX + barWidth / 2;
              const y = topMargin + chartHeight - barHeight;

              return (
                <g key={index}>
                  {/* バー */}
                  <rect
                    x={barX}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="#CB8585"
                    rx="2"
                    opacity="0.8"
                  />
                  {/* 値ラベル（バーの上部） */}
                  {point.value > 0 && (
                    <text
                      x={barCenterX}
                      y={y - 5}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#6b7280"
                    >
                      ¥{point.value.toLocaleString()}
                    </text>
                  )}
                  {/* 日付ラベル（バーの中央に正確に配置） */}
                  <text
                    x={barCenterX}
                    y={topMargin + chartHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'day': return '過去31日間';
      case 'week': return '過去3ヶ月（週単位）';
      case 'month': return '過去1年';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5" style={{ color: '#CB8585' }} />
        <h4 className="text-md font-semibold text-gray-900">売上推移</h4>
      </div>

      {/* 期間選択タブ */}
      <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'day' as PeriodType, label: '日', icon: Calendar },
          { key: 'week' as PeriodType, label: '週', icon: BarChart3 },
          { key: 'month' as PeriodType, label: '月', icon: TrendingUp }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedPeriod(key)}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === key
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={selectedPeriod === key ? { color: '#CB8585' } : {}}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 統計情報 */}
      <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: '#FDF2F2' }}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 flex-shrink-0">{getPeriodLabel()}の売上</p>
            <p className="text-lg font-bold text-right" style={{ color: '#CB8585' }}>
              ¥{totalSales.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 flex-shrink-0">最大売上</p>
            <p className="text-lg font-semibold text-right" style={{ color: '#CB8585' }}>
              ¥{maxSales.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 flex-shrink-0">平均売上</p>
            <p className="text-lg font-semibold text-right" style={{ color: '#CB8585' }}>
              ¥{Math.round(avgSales).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* チャート */}
      <div className="bg-gray-50 rounded-lg p-3">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full" style={{ borderColor: '#CB8585', borderTopColor: 'transparent' }}></div>
              <span className="text-sm">読み込み中...</span>
            </div>
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
};

export default SalesChart;