import React, { useState, useEffect } from 'react';
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

  // データ取得
  const fetchChartData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const now = new Date();
      let data: ChartDataPoint[] = [];

      if (selectedPeriod === 'day') {
        // 過去7日間のデータを取得
        const reports = await DailyReportService.getMonthlyReports(user, now.getFullYear(), now.getMonth() + 1);
        
        // 過去7日分のデータを作成
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          
          const dayReport = reports.find(r => r.report_date === dateString);
          data.push({
            label: date.getDate().toString(),
            value: dayReport?.sales_amount || 0,
            date: dateString
          });
        }
      } else if (selectedPeriod === 'week') {
        // 過去4週間のデータを取得
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (i * 7) - (now.getDay() || 7) + 1);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          // その週の売上を集計
          const weekReports = await DailyReportService.getMonthlyReports(
            user, 
            weekStart.getFullYear(), 
            weekStart.getMonth() + 1
          );
          
          const weekSales = weekReports
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
        // 過去6ヶ月のデータを取得
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now);
          monthDate.setMonth(monthDate.getMonth() - i);
          
          const monthReports = await DailyReportService.getMonthlyReports(
            user, 
            monthDate.getFullYear(), 
            monthDate.getMonth() + 1
          );
          
          const monthSales = monthReports.reduce((sum, r) => sum + r.sales_amount, 0);
          
          data.push({
            label: `${monthDate.getMonth() + 1}月`,
            value: monthSales,
            date: monthDate.toISOString().split('T')[0]
          });
        }
      }

      setChartData(data);
      setTotalSales(data.reduce((sum, d) => sum + d.value, 0));
    } catch (error) {
      console.error('売上データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [user, selectedPeriod]);

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

    return (
      <div className="relative overflow-x-auto">
        <div style={{ width: `${Math.max(containerWidth, chartWidth)}px` }}>
          <svg width={chartWidth} height={chartHeight + 30}>
            {/* グリッドライン */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={chartHeight * (1 - ratio)}
                x2={chartWidth}
                y2={chartHeight * (1 - ratio)}
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity="0.5"
              />
            ))}

            {/* バーチャート */}
            {chartData.map((point, index) => {
              const barHeight = maxValue > 0 ? (point.value / maxValue) * chartHeight : 0;
              const x = index * (barWidth + barSpacing) + barSpacing / 2;
              const y = chartHeight - barHeight;

              return (
                <g key={index}>
                  {/* バー */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="#CB8585"
                    rx="2"
                    opacity="0.8"
                  />
                  {/* 値ラベル */}
                  {point.value > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      ¥{point.value.toLocaleString()}
                    </text>
                  )}
                  {/* 日付ラベル */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 15}
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
      case 'day': return '過去7日間';
      case 'week': return '過去4週間';
      case 'month': return '過去6ヶ月';
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{getPeriodLabel()}の売上</p>
            <p className="text-xl font-bold" style={{ color: '#CB8585' }}>
              ¥{totalSales.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">平均</p>
            <p className="text-lg font-semibold" style={{ color: '#CB8585' }}>
              ¥{chartData.length > 0 ? Math.round(totalSales / chartData.length).toLocaleString() : '0'}
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