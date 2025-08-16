import React, { useState, useEffect } from 'react';
import { 
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  BarChart3,
  Activity,
  Clock,
  MapPin,
  UserCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DashboardService, 
  DashboardStats
} from '../services/dashboardService';

// Mock data for charts - monthly data
const monthlyData = [
  { 
    name: '1月', 
    sales: 1200000, 
    unitPrice: 15600, 
    purchaseCount: 77 
  },
  { 
    name: '2月', 
    sales: 1100000, 
    unitPrice: 14800, 
    purchaseCount: 74 
  },
  { 
    name: '3月', 
    sales: 1400000, 
    unitPrice: 16200, 
    purchaseCount: 86 
  },
  { 
    name: '4月', 
    sales: 1300000, 
    unitPrice: 15900, 
    purchaseCount: 82 
  },
  { 
    name: '5月', 
    sales: 1600000, 
    unitPrice: 17100, 
    purchaseCount: 94 
  },
  { 
    name: '6月', 
    sales: 1450000, 
    unitPrice: 16500, 
    purchaseCount: 88 
  },
  { 
    name: '7月', 
    sales: 1750000, 
    unitPrice: 18200, 
    purchaseCount: 96 
  },
  { 
    name: '8月', 
    sales: 1650000, 
    unitPrice: 17800, 
    purchaseCount: 93 
  }
];

// Weekly data
const weeklyData = [
  { name: '第1週', sales: 420000, unitPrice: 17500, purchaseCount: 24 },
  { name: '第2週', sales: 380000, unitPrice: 16800, purchaseCount: 23 },
  { name: '第3週', sales: 450000, unitPrice: 18200, purchaseCount: 25 },
  { name: '第4週', sales: 400000, unitPrice: 17600, purchaseCount: 23 }
];

// Daily data (31 days)
const dailyData = [
  { name: '1', sales: 65000, unitPrice: 18100, purchaseCount: 4 },
  { name: '2', sales: 72000, unitPrice: 17800, purchaseCount: 4 },
  { name: '3', sales: 58000, unitPrice: 16900, purchaseCount: 3 },
  { name: '4', sales: 68000, unitPrice: 18500, purchaseCount: 4 },
  { name: '5', sales: 75000, unitPrice: 19200, purchaseCount: 4 },
  { name: '6', sales: 82000, unitPrice: 19800, purchaseCount: 4 },
  { name: '7', sales: 80000, unitPrice: 19400, purchaseCount: 4 },
  { name: '8', sales: 71000, unitPrice: 17600, purchaseCount: 4 },
  { name: '9', sales: 69000, unitPrice: 18300, purchaseCount: 4 },
  { name: '10', sales: 77000, unitPrice: 19100, purchaseCount: 4 },
  { name: '11', sales: 63000, unitPrice: 17200, purchaseCount: 4 },
  { name: '12', sales: 85000, unitPrice: 20100, purchaseCount: 4 },
  { name: '13', sales: 78000, unitPrice: 18900, purchaseCount: 4 },
  { name: '14', sales: 74000, unitPrice: 18600, purchaseCount: 4 },
  { name: '15', sales: 81000, unitPrice: 19700, purchaseCount: 4 },
  { name: '16', sales: 67000, unitPrice: 17800, purchaseCount: 4 },
  { name: '17', sales: 73000, unitPrice: 18400, purchaseCount: 4 },
  { name: '18', sales: 79000, unitPrice: 19300, purchaseCount: 4 },
  { name: '19', sales: 66000, unitPrice: 17500, purchaseCount: 4 },
  { name: '20', sales: 84000, unitPrice: 20000, purchaseCount: 4 },
  { name: '21', sales: 76000, unitPrice: 18800, purchaseCount: 4 },
  { name: '22', sales: 70000, unitPrice: 18000, purchaseCount: 4 },
  { name: '23', sales: 88000, unitPrice: 20500, purchaseCount: 4 },
  { name: '24', sales: 72000, unitPrice: 18200, purchaseCount: 4 },
  { name: '25', sales: 75000, unitPrice: 18700, purchaseCount: 4 },
  { name: '26', sales: 83000, unitPrice: 19800, purchaseCount: 4 },
  { name: '27', sales: 77000, unitPrice: 19100, purchaseCount: 4 },
  { name: '28', sales: 71000, unitPrice: 18300, purchaseCount: 4 },
  { name: '29', sales: 86000, unitPrice: 20200, purchaseCount: 4 },
  { name: '30', sales: 74000, unitPrice: 18500, purchaseCount: 4 },
  { name: '31', sales: 82000, unitPrice: 19600, purchaseCount: 4 }
];

const pieData = [
  { name: '完了', value: 78, color: '#CB8585' },
  { name: '進行中', value: 15, color: '#E8A87C' },
  { name: '保留', value: 7, color: '#F4E4C1' }
];

// 拠点別売上データ（常設店のみ）
const storeData = [
  { id: 'shibuya', name: '渋谷店', type: 'high', rank: 1 },
  { id: 'shinjuku', name: '新宿店', type: 'high', rank: 2 },
  { id: 'ginza', name: '銀座店', type: 'high', rank: 3 },
  { id: 'ikebukuro', name: '池袋店', type: 'high', rank: 4 },
  { id: 'harajuku', name: '原宿店', type: 'high', rank: 5 },
  { id: 'kichijoji', name: '吉祥寺店', type: 'low', rank: 6 },
  { id: 'shimokita', name: '下北沢店', type: 'low', rank: 7 }
];

// 日次ベースのヒートマップデータ（364日分 = 52週、拠点別）
const generateHeatmapData = () => {
  const data = [];
  const today = new Date();
  
  // 過去364日分のデータを生成（52週 × 7日）
  for (let i = 363; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayData = {
      date: date,
      day: date.getDate(),
      month: date.getMonth() + 1,
      weekIndex: Math.floor((363 - i) / 7),
      stores: {}
    };
    
    // 各拠点の売上活動レベルを生成
    storeData.forEach(store => {
      // 売上TOP店舗は高めの活動レベル、低い店舗は低めに設定
      let baseActivity;
      if (store.type === 'high') {
        // TOP店舗：40-100%の範囲、たまに0も含む
        const rand = Math.random();
        if (rand < 0.05) { // 5%の確率で0（定休日等）
          baseActivity = 0;
        } else {
          baseActivity = 40 + Math.floor(Math.random() * 60); // 40-100%
        }
      } else {
        // 改善対象店舗：0-60%の範囲、0の確率も高め
        const rand = Math.random();
        if (rand < 0.15) { // 15%の確率で0（定休日等）
          baseActivity = 0;
        } else {
          baseActivity = Math.floor(Math.random() * 60); // 0-60%
        }
      }
      
      // 曜日による変動（土日は高め）
      if (baseActivity > 0) {
        const dayOfWeek = date.getDay();
        let dayMultiplier = 1;
        if (dayOfWeek === 0 || dayOfWeek === 6) { // 日曜日または土曜日
          dayMultiplier = 1.2;
        } else if (dayOfWeek === 1) { // 月曜日は低め
          dayMultiplier = 0.8;
        }
        baseActivity = Math.min(100, Math.floor(baseActivity * dayMultiplier));
      }
      
      dayData.stores[store.id] = baseActivity;
    });
    
    data.push(dayData);
  }
  
  return data;
};

const heatmapData = generateHeatmapData();

const recentTransactions = [
  { id: '001', customer: '田中美咲', amount: 15600, status: 'completed', location: '渋谷店', time: '14:32' },
  { id: '002', customer: '佐藤花音', amount: 8900, status: 'pending', location: '新宿店', time: '14:15' },
  { id: '003', customer: '鈴木麻衣', amount: 23400, status: 'completed', location: '池袋店', time: '13:58' },
  { id: '004', customer: '高橋梨花', amount: 12300, status: 'cancelled', location: '原宿店', time: '13:45' },
  { id: '005', customer: '山田愛美', amount: 18750, status: 'completed', location: '表参道店', time: '13:22' }
];

const CMSDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [activeMetric, setActiveMetric] = useState<'sales' | 'unitPrice' | 'purchaseCount'>('sales');
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadTimeSeriesData();
    
  }, []);

  useEffect(() => {
    loadTimeSeriesData();
  }, [chartPeriod]);

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
      const periodType = chartPeriod === 'monthly' ? 'monthly' : chartPeriod === 'weekly' ? 'weekly' : 'daily';
      const timeSeriesResult = await DashboardService.getTimeSeriesData(periodType);
      
      // データをチャート用に変換
      const chartData = timeSeriesResult.map(item => ({
        name: item.label,
        sales: item.totalSales,
        unitPrice: item.customerUnitPrice,
        purchaseCount: item.itemsPerCustomer // 一人当たりの購入数を使用
      }));
      
      setTimeSeriesData(chartData);
    } catch (err) {
      console.error('時系列データの取得に失敗:', err);
    } finally {
      setIsChartLoading(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  // Stats Cards Component
  const StatsCard = ({ title, value, change, icon, color = '#CB8585' }: {
    title: string;
    value: string;
    change?: number;
    icon: React.ReactNode;
    color?: string;
  }) => (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-gray-500 text-xs ml-1">前月比</span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: color + '20' }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Get chart data - use real data from database
  const getChartData = () => {
    return timeSeriesData.length > 0 ? timeSeriesData : [];
  };

  // Get metric label
  const getMetricLabel = () => {
    switch (activeMetric) {
      case 'unitPrice': return '顧客単価';
      case 'purchaseCount': return '一人当たり購入数';
      default: return '売上';
    }
  };

  // Get Y-axis formatter
  const getYAxisFormatter = () => {
    switch (activeMetric) {
      case 'unitPrice': return (value: number) => `¥${(value / 1000).toFixed(0)}K`;
      case 'purchaseCount': return (value: number) => `${value.toFixed(1)}個`;
      default: return (value: number) => `¥${(value / 1000000).toFixed(1)}M`;
    }
  };

  // Transaction Activity Chart
  const TransactionChart = () => (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Transaction Activity</h3>
          <p className="text-sm text-gray-600">{getMetricLabel()}の推移</p>
        </div>
        <BarChart3 className="w-5 h-5" style={{ color: '#CB8585' }} />
      </div>
      
      {/* Period Selector */}
      <div className="flex space-x-2 mb-4">
        {[
          { key: 'monthly', label: '月次' },
          { key: 'weekly', label: '週次' },
          { key: 'daily', label: '日次' }
        ].map((period) => (
          <button
            key={period.key}
            onClick={() => setChartPeriod(period.key as 'monthly' | 'weekly' | 'daily')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              chartPeriod === period.key
                ? 'text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={chartPeriod === period.key ? { backgroundColor: '#CB8585' } : {}}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Metric Selector */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: 'sales', label: '売上', color: '#CB8585' },
          { key: 'unitPrice', label: '顧客単価', color: '#E8A87C' },
          { key: 'purchaseCount', label: '一人当たり購入数', color: '#60A5FA' }
        ].map((metric) => (
          <button
            key={metric.key}
            onClick={() => setActiveMetric(metric.key as 'sales' | 'unitPrice' | 'purchaseCount')}
            className={`px-3 py-1 text-xs rounded-full transition-colors border ${
              activeMetric === metric.key
                ? 'text-white border-transparent'
                : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
            }`}
            style={activeMetric === metric.key ? { backgroundColor: metric.color } : {}}
          >
            {metric.label}
          </button>
        ))}
      </div>

      <div className="h-64">
        {isChartLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-b-2" 
                style={{ borderColor: '#CB8585' }}
              />
              <p className="mt-2 text-gray-600 text-sm">チャートデータを読み込み中...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
                tickFormatter={getYAxisFormatter()}
              />
              <Line 
                type="linear" 
                dataKey={activeMetric} 
                stroke={
                  activeMetric === 'sales' ? '#CB8585' :
                  activeMetric === 'unitPrice' ? '#E8A87C' : '#60A5FA'
                }
                strokeWidth={3}
                dot={{ 
                  fill: activeMetric === 'sales' ? '#CB8585' :
                        activeMetric === 'unitPrice' ? '#E8A87C' : '#60A5FA',
                  strokeWidth: 2, 
                  r: 4 
                }}
                activeDot={{ 
                  r: 6, 
                  stroke: activeMetric === 'sales' ? '#CB8585' :
                          activeMetric === 'unitPrice' ? '#E8A87C' : '#60A5FA',
                  strokeWidth: 2, 
                  fill: '#fff' 
                }}
                label={{ 
                  position: 'top',
                  fill: '#333',
                  fontSize: 13,
                  fontWeight: '600',
                  offset: 10,
                  formatter: (value: number) => {
                    if (activeMetric === 'sales') return `¥${(value / 1000).toFixed(0)}K`;
                    if (activeMetric === 'unitPrice') return `¥${(value / 1000).toFixed(0)}K`;
                    return `${value.toFixed(1)}個`;
                  }
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );

  // Attendance Performance Card
  const AttendancePerformanceCard = () => {
    const attendanceRate = stats?.attendanceRate?.currentMonth || 0;
    const circumference = 2 * Math.PI * 45; // 半径45の円周
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

    // 出勤率に基づく色分け
    const getAttendanceColor = (rate: number) => {
      if (rate >= 95) return '#10B981'; // 緑色（優秀）
      if (rate >= 85) return '#F59E0B'; // 黄色（普通）
      return '#EF4444'; // 赤色（要改善）
    };

    const attendanceColor = getAttendanceColor(attendanceRate);

    return (
      <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Attendance Rate</h3>
            <p className="text-sm text-gray-600">今月のシフト出勤率</p>
          </div>
          <UserCheck className="w-6 h-6" style={{ color: '#CB8585' }} />
        </div>
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#f3f4f6"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={attendanceColor}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{attendanceRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">出勤率</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: '#10B981' }}
              />
              <span className="text-gray-600">出勤</span>
            </div>
            <span className="font-medium text-gray-900">{stats?.attendanceRate?.totalActualAttendance || 0}回</span>
          </div>
          <div className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: '#EF4444' }}
              />
              <span className="text-gray-600">欠勤</span>
            </div>
            <span className="font-medium text-gray-900">{stats?.attendanceRate?.absenteeCount || 0}回</span>
          </div>
          <div className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: '#6B7280' }}
              />
              <span className="text-gray-600">予定シフト</span>
            </div>
            <span className="font-medium text-gray-900">{stats?.attendanceRate?.totalScheduledShifts || 0}回</span>
          </div>
        </div>
      </div>
    );
  };

  // Active User Heatmap
  const ActiveUserHeatmap = () => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    
    const getIntensity = (value: number) => {
      const max = 100;
      const intensity = value / max;
      
      // 10段階の濃淡（0を含む）
      const step = Math.floor(intensity * 10) / 10;
      
      // 0の場合も薄いグレーで表示、それ以外は濃淡を適用
      if (value === 0) {
        return `rgba(229, 231, 235, 1)`; // gray-200
      }
      
      // 0.1〜1.0の範囲で10段階の濃淡
      const alpha = Math.max(0.1, step);
      return `rgba(203, 133, 133, ${alpha})`;
    };

    // 週次のラベルを生成（52週間）
    const getWeekLabels = () => {
      const labels = [];
      const startDate = new Date(heatmapData[0]?.date);
      
      for (let week = 0; week < 52; week++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (week * 7));
        
        // 月の1週目のみ月/日表示、それ以外は日のみ
        const weekDay = weekStart.getDate();
        if (weekDay <= 7) {
          labels.push(`${weekStart.getMonth() + 1}/${weekStart.getDate()}`);
        } else {
          labels.push(`${weekStart.getDate()}`);
        }
      }
      return labels;
    };

    // 日付ラベルを生成（各週の開始日）
    const getDateLabels = () => {
      const labels = [];
      const startDate = new Date(heatmapData[0]?.date);
      
      for (let week = 0; week < 52; week++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (week * 7));
        
        // 月/日 形式で表示
        labels.push({
          month: weekStart.getMonth() + 1,
          day: weekStart.getDate(),
          text: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
        });
      }
      return labels;
    };

    // データを週ごとに分割（52週間）
    const weeklyData = [];
    for (let week = 0; week < 52; week++) {
      const weekData = heatmapData.slice(week * 7, (week + 1) * 7);
      weeklyData.push(weekData);
    }

    const weekLabels = getWeekLabels();
    const dateLabels = getDateLabels();
    
    // 最新（右端）にスクロールする
    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    }, []);

    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Store Sales Heatmap</h3>
            <p className="text-sm text-gray-600">拠点別日次売上活動</p>
          </div>
          <MapPin className="w-5 h-5" style={{ color: '#CB8585' }} />
        </div>
        
        {/* スクロール可能なヒートマップエリア */}
        <div className="relative">
          {/* 拠点ラベル（固定） */}
          <div className="absolute left-0 top-0 z-10 bg-white">
            <div className="w-20 pb-1"> {/* 日付ラベル分のスペース */}
              <div className="text-xs text-transparent">Date</div>
            </div>
            <div className="w-20 pb-2"> {/* 週次ラベル分のスペース */}
              <div className="text-xs text-transparent">Label</div>
            </div>
            <div className="w-20 flex flex-col mr-2">
              {storeData.map((store, index) => (
                <div key={store.id} className="flex items-center mb-1" style={{ height: '16px' }}>
                  <span className={`text-xs text-right ${store.type === 'high' ? 'font-medium' : ''}`}>
                    {store.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* スクロール可能なコンテンツエリア */}
          <div 
            ref={scrollRef}
            className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            style={{ marginLeft: '5rem' }}
          >
            <div style={{ width: `${52 * 16}px` }}> {/* 52週 × 16px */}
              {/* 日付ラベル */}
              <div className="flex mb-1 gap-1">
                {dateLabels.map((dateInfo, index) => (
                  <div 
                    key={index} 
                    className="text-center flex-shrink-0 text-gray-400"
                    style={{ 
                      width: '14px', 
                      fontSize: '8px',
                      lineHeight: '10px',
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'center center'
                    }}
                    title={dateInfo.text}
                  >
                    {dateInfo.month}/{dateInfo.day}
                  </div>
                ))}
              </div>

              {/* 週次ラベル */}
              <div className="flex mb-2 gap-1">
                {weekLabels.map((label, index) => (
                  <div key={index} className="text-xs text-gray-500 text-center" style={{ width: '14px' }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* グリッド */}
              <div>
                {storeData.map((store) => (
                  <div key={store.id} className="flex gap-1 mb-1">
                    {weeklyData.map((week, weekIndex) => {
                      // その週の7日間の平均売上活動を計算
                      const weekActivity = week.reduce((sum, day) => {
                        return sum + (day.stores[store.id] || 0);
                      }, 0) / 7;
                      
                      return (
                        <div
                          key={weekIndex}
                          className="rounded-sm border border-gray-200 flex-shrink-0"
                          style={{ 
                            backgroundColor: getIntensity(weekActivity),
                            width: '14px',
                            height: '14px'
                          }}
                          title={`${store.name} - 週平均売上活動: ${weekActivity.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>Low Sales</span>
          <div className="flex gap-1">
            {/* 0の場合のグレー表示 */}
            <div
              className="rounded-sm border border-gray-200"
              style={{ 
                backgroundColor: `rgba(229, 231, 235, 1)`,
                width: '14px',
                height: '14px'
              }}
              title="0%"
            />
            {/* 1-9段階の濃淡 */}
            {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((intensity, index) => (
              <div
                key={index}
                className="rounded-sm border border-gray-200"
                style={{ 
                  backgroundColor: `rgba(203, 133, 133, ${intensity})`,
                  width: '14px',
                  height: '14px'
                }}
                title={`${(intensity * 100).toFixed(0)}%`}
              />
            ))}
          </div>
          <span>High Sales</span>
        </div>
        
        {/* 拠点説明 */}
        <div className="mt-3 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>🏆 売上TOP5: 渋谷・新宿・銀座・池袋・原宿</span>
            <span>📉 改善対象: 吉祥寺・下北沢</span>
          </div>
        </div>
      </div>
    );
  };

  // Recent Transaction Table
  const RecentTransactionTable = () => (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Transaction</h3>
            <p className="text-sm text-gray-600">最新の取引履歴</p>
          </div>
          <MapPin className="w-5 h-5" style={{ color: '#CB8585' }} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">拠点</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{transaction.customer}</div>
                  <div className="text-xs text-gray-500">ID: {transaction.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{formatCurrency(transaction.amount)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{transaction.location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status === 'completed' ? '完了' : 
                     transaction.status === 'pending' ? '処理中' : 'キャンセル'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2" 
              style={{ borderColor: '#CB8585' }}
            />
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">エラーが発生しました</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 text-white rounded-2xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#CB8585' }}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-gray-600 mt-2">売上分析とパフォーマンス指標の概要</p>
            </div>
            
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col justify-between relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">ユーザー数</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalActiveUsers)}</p>
                <p className="text-xs text-gray-400 mt-1">2024年8月現在</p>
              </div>
              <div className="absolute top-4 right-4">
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col justify-between relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">有効常設店数</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalActivePermanentStores)}</p>
                <p className="text-xs text-gray-400 mt-1">2024年8月現在</p>
              </div>
              <div className="absolute top-4 right-4">
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col justify-between relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">有効イベント数</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalActiveEvents)}</p>
                <p className="text-xs text-gray-400 mt-1">2024年8月現在</p>
              </div>
              <div className="absolute top-4 right-4">
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Transaction Chart - Full width on smaller screens, 2 columns on xl */}
          <div className="xl:col-span-2">
            <TransactionChart />
          </div>
          
          {/* Attendance Performance Card */}
          <div>
            <AttendancePerformanceCard />
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Active User Heatmap */}
          <div>
            <ActiveUserHeatmap />
          </div>
          
          {/* Recent Transaction Table */}
          <div>
            <RecentTransactionTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSDashboard;