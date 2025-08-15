import React from 'react';
import { LocationSalesData } from '../services/dashboardService';

interface SalesHeatmapProps {
  data: LocationSalesData[];
  isLoading: boolean;
}

const SalesHeatmap: React.FC<SalesHeatmapProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600 text-xs">ヒートマップを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p className="text-sm">拠点データがありません</p>
      </div>
    );
  }

  // 売上の最大値を計算してサイズ比率を決める
  const maxSales = Math.max(...data.map(d => d.currentMonthSales));
  const minSize = 40; // 最小サイズ
  const maxSize = 120; // 最大サイズ

  // サイズ計算関数
  const calculateSize = (sales: number): number => {
    if (maxSales === 0) return minSize;
    const ratio = sales / maxSales;
    return minSize + (maxSize - minSize) * ratio;
  };

  // 成長率に基づく色を計算
  const getGrowthColor = (growth: number, isGrowing: boolean): string => {
    const intensity = Math.min(Math.abs(growth) / 50, 1); // 50%で最大強度
    
    if (isGrowing) {
      // プラス成長：緑系（薄緑→濃緑）
      const greenValue = Math.floor(100 + (155 * intensity)); // 100-255
      return `rgb(34, ${greenValue}, 34)`; // 緑系統
    } else {
      // マイナス成長：赤系（薄赤→濃赤）
      const redValue = Math.floor(100 + (155 * intensity)); // 100-255
      return `rgb(${redValue}, 34, 34)`; // 赤系統
    }
  };

  // 通貨フォーマット
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `¥${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `¥${(amount / 1000).toFixed(0)}K`;
    }
    return `¥${amount.toLocaleString()}`;
  };

  // 成長率フォーマット
  const formatGrowth = (growth: number): string => {
    return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
  };

  return (
    <div className="relative">
      {/* ヒートマップグリッド */}
      <div className="grid grid-cols-4 gap-3 p-4 min-h-[240px]">
        {data.slice(0, 12).map((location, index) => {
          const size = calculateSize(location.currentMonthSales);
          const color = getGrowthColor(location.monthOverMonthGrowth, location.isGrowing);
          
          return (
            <div
              key={location.locationId}
              className="relative flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer group"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                margin: 'auto'
              }}
            >
              {/* 拠点名（短縮版） */}
              <div className="text-white text-xs font-bold text-center px-1">
                {location.locationName.length > 6 
                  ? location.locationName.substring(0, 6) + '...'
                  : location.locationName
                }
              </div>

              {/* ホバー時の詳細情報 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
                <div className="font-semibold">{location.locationName}</div>
                <div className="text-gray-300">今月売上: {formatCurrency(location.currentMonthSales)}</div>
                <div className="text-gray-300">先月売上: {formatCurrency(location.lastMonthSales)}</div>
                <div className={`font-semibold ${location.isGrowing ? 'text-green-400' : 'text-red-400'}`}>
                  前月比: {formatGrowth(location.monthOverMonthGrowth)}
                </div>
                <div className="text-gray-300">客数: {location.customerCount}人</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>売上増加</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>売上減少</span>
          </div>
        </div>
        <div className="text-gray-500">
          サイズ: 売上高 | 色の濃さ: 前月比変化率
        </div>
      </div>

      {/* ランキング表示（上位3位） */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-900 mb-2">売上TOP3</h4>
        <div className="space-y-1">
          {data.slice(0, 3).map((location, index) => (
            <div key={location.locationId} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                }`}>
                  {index + 1}
                </span>
                <span className="font-medium">{location.locationName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900">{formatCurrency(location.currentMonthSales)}</span>
                <span className={`font-medium ${location.isGrowing ? 'text-green-600' : 'text-red-600'}`}>
                  {formatGrowth(location.monthOverMonthGrowth)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesHeatmap;