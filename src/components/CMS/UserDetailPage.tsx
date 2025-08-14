import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Tables } from '../../types/supabase';
import { 
  ArrowLeft,
  Edit3, 
  Save, 
  User, 
  Mail, 
  MapPin, 
  Award, 
  Briefcase,
  Calendar,
  TrendingUp,
  DollarSign,
  Users as UsersIcon,
  BarChart3,
  ShoppingCart,
  Target,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { sanitizeUserName, sanitizeDisplayText } from '../../utils/textUtils';
import { DailyReportService } from '../../services/dailyReportService';
import ShiftEditModal from './ShiftEditModal';

type User = Tables<'users'>;
type DailyReport = Tables<'daily_reports'>;
type TimeRecord = Tables<'time_records'>;
type WorkPattern = Tables<'work_patterns'>;
type Shift = Tables<'shifts'>;
type PeriodType = 'day' | 'week' | 'month';

interface ChartDataPoint {
  label: string;
  value: number;
  date: string;
}

interface UserDetailPageProps {
  userId: string;
  onBack: () => void;
}

interface UserStats {
  totalReports: number;
  totalSales: number;
  avgSales: number;
  totalCustomers: number;
  avgCustomers: number;
  totalItemsSold: number;
  avgItemsSold: number;
  avgUnitPrice: number;
}

interface DailyReportGraphData {
  date: string;
  sales: number;
  customers: number;
  unitPrice: number;
  itemsSold: number;
  formattedDate: string;
}

const UserDetailPage: React.FC<UserDetailPageProps> = ({
  userId,
  onBack
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [graphData, setGraphData] = useState<DailyReportGraphData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<User>>({});
  const [activeTab, setActiveTab] = useState<'shift' | 'performance'>('shift');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shiftData, setShiftData] = useState<{ [key: string]: any }>({});
  const [workPatterns, setWorkPatterns] = useState<WorkPattern[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('day');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [maxSales, setMaxSales] = useState(0);
  const [avgSales, setAvgSales] = useState(0);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    if (userId) {
      console.log('🚀 UserDetailPage初期化開始:', userId);
      // まずユーザー情報を取得してから他のデータを取得
      fetchUserDetail();
    }
  }, [userId]);

  // ユーザー情報が取得できたら、他のデータも取得
  useEffect(() => {
    if (userId && user) {
      console.log('📊 関連データ取得開始:', user.display_name);
      fetchUserStats();
      fetchUserReports();
      fetchWorkPatterns();
      fetchShiftData();
      fetchChartData();
      fetchShifts();
    }
  }, [userId, user]);

  useEffect(() => {
    if (userId) {
      fetchShiftData();
      fetchShifts();
    }
  }, [currentMonth, userId]);

  useEffect(() => {
    if (userId) {
      fetchChartData();
    }
  }, [selectedPeriod, userId]);

  const fetchUserDetail = async () => {
    if (!userId) {
      console.error('❌ fetchUserDetail: userId が未定義です');
      setError('ユーザーIDが指定されていません');
      return;
    }

    console.log('🔍 fetchUserDetail開始:', userId);
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📊 ユーザー取得結果:', { data, error: fetchError });

      if (fetchError) {
        console.error('❌ fetchUserDetail エラー:', fetchError);
        throw fetchError;
      }

      if (!data) {
        console.error('❌ fetchUserDetail: データがnullです');
        throw new Error('ユーザーデータが見つかりません');
      }

      console.log('✅ fetchUserDetail成功:', data.display_name);
      setUser(data);
      setEditedData({
        display_name: data.display_name,
        email: data.email || '',
        address: data.address || '',
        self_pr: data.self_pr || '',
        career: data.career || ''
      });
    } catch (err) {
      console.error('❌ fetchUserDetail 例外:', err);
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
    } finally {
      setLoading(false);
      console.log('🏁 fetchUserDetail完了');
    }
  };

  const fetchUserStats = async () => {
    if (!userId) return;

    try {
      const { data, error: statsError } = await supabase
        .from('daily_reports_with_metrics')
        .select('*')
        .eq('user_id', userId);

      if (statsError) throw statsError;

      if (data && data.length > 0) {
        const totalSales = data.reduce((sum, report) => sum + report.sales_amount, 0);
        const totalCustomers = data.reduce((sum, report) => sum + report.customer_count, 0);
        const totalItemsSold = data.reduce((sum, report) => sum + report.items_sold, 0);
        const totalUnitPrice = data.reduce((sum, report) => sum + (report.customer_unit_price || 0), 0);
        
        setUserStats({
          totalReports: data.length,
          totalSales,
          avgSales: totalSales / data.length,
          totalCustomers,
          avgCustomers: totalCustomers / data.length,
          totalItemsSold,
          avgItemsSold: totalItemsSold / data.length,
          avgUnitPrice: totalUnitPrice / data.length
        });
      } else {
        setUserStats({
          totalReports: 0,
          totalSales: 0,
          avgSales: 0,
          totalCustomers: 0,
          avgCustomers: 0,
          totalItemsSold: 0,
          avgItemsSold: 0,
          avgUnitPrice: 0
        });
      }
    } catch (err) {
      console.warn('統計データの取得に失敗しました:', err);
    }
  };

  const fetchUserReports = async () => {
    if (!userId) return;

    try {
      const { data, error: reportsError } = await supabase
        .from('daily_reports_with_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('report_date', { ascending: true });

      if (reportsError) throw reportsError;

      setDailyReports(data || []);
      
      // グラフデータを準備
      if (data && data.length > 0) {
        const graphData = data.map(report => ({
          date: report.report_date,
          sales: report.sales_amount,
          customers: report.customer_count,
          unitPrice: report.customer_unit_price || 0,
          itemsSold: report.items_sold,
          formattedDate: new Date(report.report_date).toLocaleDateString('ja-JP', {
            month: 'short',
            day: 'numeric'
          })
        }));
        setGraphData(graphData);
      }
    } catch (err) {
      console.warn('日報データの取得に失敗しました:', err);
    }
  };

  const fetchWorkPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('work_patterns')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setWorkPatterns(data || []);
    } catch (err) {
      console.warn('勤務パターンの取得に失敗しました:', err);
    }
  };

  const fetchShiftData = async () => {
    if (!userId) return;

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0).toISOString();

      const { data, error } = await supabase
        .from('time_records')
        .select(`
          *,
          work_pattern:work_patterns(*)
        `)
        .eq('user_id', userId)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .order('recorded_at');

      if (error) throw error;

      // データを日付別に整理
      const organized: { [key: string]: any } = {};
      data?.forEach(record => {
        const date = new Date(record.recorded_at).toISOString().split('T')[0];
        if (!organized[date]) {
          organized[date] = {
            date,
            records: [],
            clockIn: null,
            clockOut: null,
            breakStart: null,
            breakEnd: null,
            workPattern: null
          };
        }
        
        organized[date].records.push(record);
        
        switch (record.record_type) {
          case 'clock_in':
            organized[date].clockIn = new Date(record.recorded_at).toTimeString().substring(0, 5);
            break;
          case 'clock_out':
            organized[date].clockOut = new Date(record.recorded_at).toTimeString().substring(0, 5);
            break;
          case 'break_start':
            organized[date].breakStart = new Date(record.recorded_at).toTimeString().substring(0, 5);
            break;
          case 'break_end':
            organized[date].breakEnd = new Date(record.recorded_at).toTimeString().substring(0, 5);
            break;
        }

        if (record.work_pattern) {
          organized[date].workPattern = record.work_pattern;
        }
      });

      setShiftData(organized);
    } catch (err) {
      console.warn('シフトデータの取得に失敗しました:', err);
    }
  };

  // データ取得（SalesChart.tsxと同じロジック）
  const fetchChartData = async () => {
    if (!userId) {
      console.warn('⚠️ fetchChartData: userId が未定義です');
      return;
    }

    console.log('🔍 fetchChartData開始:', userId);
    setIsChartLoading(true);
    try {
      // 一時的なユーザーオブジェクトを作成（LineUser型に合わせる）
      // user状態がまだ未定義の場合もあるので、安全にアクセス
      const tempUser = { 
        userId, 
        displayName: user?.display_name || `User_${userId.slice(0, 8)}` 
      };
      const now = new Date();
      const data: ChartDataPoint[] = [];

      console.log('📊 チャートデータ取得開始:', { tempUser, period: selectedPeriod });

      if (selectedPeriod === 'day') {
        // 過去31日間のデータを取得
        const currentMonth = await DailyReportService.getMonthlyReports(tempUser, now.getFullYear(), now.getMonth() + 1);
        const previousMonth = await DailyReportService.getMonthlyReports(tempUser, now.getFullYear(), now.getMonth());
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
            tempUser, 
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
            tempUser, 
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
      console.log('✅ fetchChartData成功:', data.length, '件');
    } catch (error) {
      console.error('❌ fetchChartData エラー:', error);
      // チャートデータの取得失敗は致命的ではないので、空データで継続
      setChartData([]);
      setTotalSales(0);
      setMaxSales(0);
      setAvgSales(0);
    } finally {
      setIsChartLoading(false);
      console.log('🏁 fetchChartData完了');
    }
  };

  const fetchShifts = async () => {
    if (!userId) {
      console.warn('⚠️ fetchShifts: userId が未定義です');
      return;
    }

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      console.log('🔍 fetchShifts開始:', { userId, startDate, endDate });

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .order('shift_date', { ascending: true });

      console.log('📊 シフト取得結果:', { data: data?.length, error });

      if (error) {
        console.error('❌ fetchShifts エラー:', error);
        throw error;
      }
      setShifts(data || []);
      console.log('✅ fetchShifts成功:', data?.length || 0, '件');
    } catch (err) {
      console.error('❌ fetchShifts 例外:', err);
      // シフトデータの取得失敗は致命的ではないので、エラー状態は設定しない
    }
  };

  // 最新日付（右端）にスクロールする関数
  const scrollToLatest = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const updateData: Record<string, any> = {
        display_name: editedData.display_name,
        email: editedData.email || null,
        address: editedData.address || null,
        self_pr: editedData.self_pr || null,
        career: editedData.career || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUser(prev => prev ? { ...prev, ...updateData } : null);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleShiftModalSave = () => {
    fetchShifts();
    fetchShiftData();
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  // チャート描画（SalesChart.tsxと同じロジック）
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getMonthDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const dates = [];
    
    // 前月の日付で埋める
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      dates.push({
        date: date,
        dateStr: date.toISOString().split('T')[0],
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // 今月の日付
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      dates.push({
        date: date,
        dateStr: dateStr,
        day: day,
        isCurrentMonth: true,
        isToday: dateStr === today.toISOString().split('T')[0]
      });
    }
    
    // 来月の日付で埋める（42日で埋める）
    const remainingSlots = 42 - dates.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const date = new Date(year, month + 1, day);
      dates.push({
        date: date,
        dateStr: date.toISOString().split('T')[0],
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return dates;
  };


  // シフト管理カレンダーコンポーネント
  const ShiftCalendar = () => {
    const monthDates = getMonthDates();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    const getShiftInfo = (dateStr: string) => {
      const timeRecord = shiftData[dateStr];
      const shift = shifts.find(s => s.shift_date === dateStr);
      
      if (!shift && !timeRecord) return null;

      // 打刻記録の状況
      let timeStatus = null;
      if (timeRecord) {
        if (timeRecord.clockIn && timeRecord.clockOut) {
          timeStatus = {
            status: '出勤完了',
            color: 'bg-green-100 text-green-800 border-green-200',
            time: `${timeRecord.clockIn}-${timeRecord.clockOut}`
          };
        } else if (timeRecord.clockIn) {
          timeStatus = {
            status: '出勤中',
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            time: `${timeRecord.clockIn}-`
          };
        }
      }

      // シフトの状況
      let shiftStatus = null;
      if (shift) {
        const statusColors = {
          adjusting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          confirmed: 'bg-green-100 text-green-800 border-green-200'
        };
        
        const statusLabels = {
          adjusting: '調整中',
          confirmed: '確定済み'
        };

        shiftStatus = {
          status: statusLabels[shift.shift_status as keyof typeof statusLabels] || shift.shift_status,
          color: statusColors[shift.shift_status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200',
          time: shift.start_time && shift.end_time ? `${shift.start_time.substring(0, 5)}-${shift.end_time.substring(0, 5)}` : '時間未設定',
          shift
        };
      }
      
      return { timeStatus, shiftStatus };
    };

    const handleShiftClick = (shift: Shift) => {
      setSelectedShift(shift);
      setIsShiftModalOpen(true);
    };

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">シフト管理カレンダー</h3>
              <p className="text-sm text-gray-600">打刻記録とシフト予定の管理</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-medium text-gray-900 min-w-32 text-center">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-2">
          {/* 曜日ヘッダー */}
          {weekdays.map((day, index) => (
            <div key={day} className={`p-3 text-center text-sm font-medium ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {day}
            </div>
          ))}
          
          {/* 日付セル */}
          {monthDates.map((dateInfo, index) => {
            const shiftInfo = getShiftInfo(dateInfo.dateStr);
            const isWeekend = index % 7 === 0 || index % 7 === 6;
            
            return (
              <div
                key={`${dateInfo.dateStr}-${index}`}
                className={`min-h-28 p-2 border-2 border-dashed transition-all hover:bg-gray-50 ${
                  dateInfo.isCurrentMonth
                    ? dateInfo.isToday
                      ? 'bg-blue-50 border-blue-300'
                      : isWeekend
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    !dateInfo.isCurrentMonth
                      ? 'text-gray-400'
                      : dateInfo.isToday
                        ? 'text-blue-600'
                        : isWeekend
                          ? index % 7 === 0
                            ? 'text-red-600'
                            : 'text-blue-600'
                          : 'text-gray-900'
                  }`}>
                    {dateInfo.day}
                  </span>
                </div>
                
                {dateInfo.isCurrentMonth && (
                  <div className="space-y-1">
                    {/* シフト情報 */}
                    {shiftInfo?.shiftStatus && (
                      <div 
                        className={`text-xs px-2 py-1 rounded-md border cursor-pointer hover:opacity-75 transition-opacity ${shiftInfo.shiftStatus.color}`}
                        onClick={() => shiftInfo.shiftStatus?.shift && handleShiftClick(shiftInfo.shiftStatus.shift)}
                        title="クリックして編集"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{shiftInfo.shiftStatus.status}</span>
                          {shiftInfo.shiftStatus.shift?.shift_status === 'adjusting' && (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {shiftInfo.shiftStatus.shift?.shift_status === 'confirmed' && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                        </div>
                        <div className="font-mono text-xs mt-0.5">{shiftInfo.shiftStatus.time}</div>
                      </div>
                    )}
                    
                    {/* 打刻記録情報 */}
                    {shiftInfo?.timeStatus && (
                      <div className={`text-xs px-2 py-1 rounded-md border ${shiftInfo.timeStatus.color}`}>
                        <div className="font-medium">{shiftInfo.timeStatus.status}</div>
                        <div className="font-mono text-xs mt-0.5">{shiftInfo.timeStatus.time}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 凡例 */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">凡例</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-gray-700">出勤完了・確定済み</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-gray-700">出勤中</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-gray-700">調整中</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 シフトをクリックして編集・確認できます
          </p>
        </div>
      </div>
    );
  };

  // ローディング状態の表示
  if (loading && !user) {
    console.log('⏳ ローディング中...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700 mb-2">ユーザー情報を読み込み中...</div>
          <div className="text-sm text-gray-500">
            User ID: {userId ? `${userId.slice(0, 8)}...` : 'Unknown'}
          </div>
        </div>
      </div>
    );
  }

  // エラー状態の表示
  if (error && !user) {
    console.log('❌ エラー状態:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h2>
          <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            User ID: {userId ? `${userId.slice(0, 8)}...` : 'Unknown'}
          </div>
          <button
            onClick={() => {
              console.log('🔄 リトライ開始');
              setError(null);
              fetchUserDetail();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            再試行
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  // ユーザーが見つからない場合
  if (!user) {
    console.log('❓ ユーザーが見つかりません:', userId);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-600 text-2xl">👤</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">ユーザーが見つかりません</h2>
          <div className="text-gray-600 mb-4">
            指定されたユーザーの情報を読み込めませんでした。
          </div>
          <div className="text-sm text-gray-500 mb-4">
            User ID: {userId ? `${userId.slice(0, 8)}...` : 'Unknown'}
          </div>
          <button
            onClick={() => {
              console.log('🔄 再読み込み開始');
              fetchUserDetail();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            再読み込み
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  console.log('🎯 UserDetailPageレンダリング:', { userId, user: user?.display_name, loading, error });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ユーザー詳細</h1>
                <p className="text-sm text-gray-600">プロファイルと実績を確認・編集</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? '保存中...' : '保存'}
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  編集
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左カラム: プロファイル */}
          <div className="lg:col-span-1 space-y-6">
            {/* ユーザー基本情報 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                {user.picture_url ? (
                  <img
                    src={user.picture_url}
                    alt={sanitizeUserName(user.display_name)}
                    className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      #{user.employee_number || '---'}
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.display_name || ''}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      className="text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-3 py-2 text-center"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900">
                      {sanitizeUserName(user.display_name)}
                    </h2>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* メール */}
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="example@company.com"
                      />
                    ) : (
                      <p className="text-gray-900">{user.email || '未設定'}</p>
                    )}
                  </div>
                </div>

                {/* 住所 */}
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      住所
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={2}
                        placeholder="住所を入力してください"
                      />
                    ) : (
                      <p className="text-gray-900">{user.address || '未設定'}</p>
                    )}
                  </div>
                </div>

                {/* 自己PR */}
                <div className="flex items-start space-x-3">
                  <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      自己PR
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedData.self_pr || ''}
                        onChange={(e) => handleInputChange('self_pr', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="自己PRを入力してください"
                      />
                    ) : (
                      <p className="text-gray-900">{sanitizeDisplayText(user.self_pr) || '未設定'}</p>
                    )}
                  </div>
                </div>

                {/* 経歴 */}
                <div className="flex items-start space-x-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      経歴・職歴
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedData.career || ''}
                        onChange={(e) => handleInputChange('career', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="経歴や職歴を入力してください"
                      />
                    ) : (
                      <p className="text-gray-900">{sanitizeDisplayText(user.career) || '未設定'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 右カラム: タブコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* タブナビゲーション */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('shift')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'shift'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  シフト管理
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'performance'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  日報管理
                </button>
              </div>
            </div>

            {/* タブコンテンツ */}
            {activeTab === 'shift' ? (
              <ShiftCalendar />
            ) : (
              <>
                {/* 売上推移チャート */}
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
                    {isChartLoading ? (
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

            {/* 最近の日報 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近の日報</h3>
              {dailyReports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          日付
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          売上金額
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          客数
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          客単価
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          販売個数
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyReports.slice(0, 10).map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatDate(report.report_date)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatCurrency(report.sales_amount)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {report.customer_count}人
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatCurrency(report.customer_unit_price || 0)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {report.items_sold}個
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">日報データがありません</p>
                </div>
              )}
            </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shift Edit Modal */}
      <ShiftEditModal
        isOpen={isShiftModalOpen}
        onClose={() => {
          setIsShiftModalOpen(false);
          setSelectedShift(null);
        }}
        shift={selectedShift}
        onSave={handleShiftModalSave}
      />
    </div>
  );
};

export default UserDetailPage;