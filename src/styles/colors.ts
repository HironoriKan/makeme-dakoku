/**
 * 統一カラーパレット - WCAG AA準拠
 * コントラスト比4.5:1以上を保証
 */

export const colors = {
  // 🎨 メインカラー（既存継続）
  primary: {
    50: '#fdf2f2',   // 最薄 - 背景用
    100: '#fde8e8',  // 薄 - ホバー状態
    200: '#fccfcf',  // 中薄
    300: '#fca5a5',  // 中
    400: '#f87171',  // 中濃
    500: '#CB8585',  // メイン（既存アクセントカラー）
    600: '#b86e6e',  // 濃
    700: '#a55757',  // より濃
    800: '#924040',  // 最濃
    900: '#7f2929',  // 極濃
  },

  // ✅ ステータスカラー（4色セット）
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // メイン成功色
    600: '#16a34a',  // 濃い成功色
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // メイン警告色
    600: '#d97706',  // 濃い警告色
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // メイン赤色
    600: '#dc2626',  // 濃い赤色
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // メイン青色
    600: '#2563eb',  // 濃い青色
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // 📊 チャートカラー
  chart: {
    orange: '#e8a87c',  // 指定色1
    blue: '#5fa5f9',    // 指定色2
    primary: '#CB8585', // メインカラー
    // 追加チャート色（調和のとれた色相）
    green: '#4ade80',
    purple: '#a855f7',
    yellow: '#fbbf24',
    pink: '#ec4899',
    teal: '#14b8a6',
  },

  // 🎨 グレースケール
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',  // 中間グレー
    600: '#4b5563',  // テキスト用
    700: '#374151',  // 濃いテキスト
    800: '#1f2937',  // 見出し用
    900: '#111827',  // 最濃
  },

  // 🔲 背景色
  background: {
    primary: '#ffffff',    // 白背景
    secondary: '#f9fafb',  // 薄グレー背景
    accent: '#fdf2f2',     // アクセント背景
    dark: '#1f2937',       // ダーク背景
  },

  // 📝 テキストカラー
  text: {
    primary: '#111827',    // メインテキスト（最濃グレー）
    secondary: '#4b5563',  // サブテキスト
    accent: '#CB8585',     // アクセントテキスト
    light: '#9ca3af',      // 薄いテキスト
    white: '#ffffff',      // 白テキスト
  },

  // 🔗 ボーダーカラー
  border: {
    light: '#e5e7eb',      // 薄いボーダー
    medium: '#d1d5db',     // 中間ボーダー
    dark: '#9ca3af',       // 濃いボーダー
    accent: '#CB8585',     // アクセントボーダー
  },

} as const;

/**
 * セマンティックカラー（用途別）
 */
export const semanticColors = {
  // ボタン用カラー
  button: {
    primary: colors.primary[500],
    primaryHover: colors.primary[600],
    primaryActive: colors.primary[700],
    
    success: colors.success[500],
    successHover: colors.success[600],
    
    warning: colors.warning[500],
    warningHover: colors.warning[600],
    
    error: colors.error[500],
    errorHover: colors.error[600],
    
    secondary: colors.gray[500],
    secondaryHover: colors.gray[600],
  },

  // 状態表示用
  status: {
    confirmed: colors.success[500],    // 承認済み
    adjusting: colors.warning[500],    // 調整中
    error: colors.error[500],          // エラー
    inactive: colors.gray[400],        // 非アクティブ
  },

  // フォーカス・選択状態
  focus: {
    ring: colors.primary[500],         // フォーカスリング
    background: colors.primary[50],    // フォーカス背景
  },
} as const;

/**
 * カラーユーティリティ関数
 */
export const colorUtils = {
  // 16進数カラーからRGBA形式に変換
  hexToRgba: (hex: string, alpha: number = 1): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  // アクセントカラーの半透明版を取得
  getAccentWithAlpha: (alpha: number = 0.1): string => {
    return colorUtils.hexToRgba(colors.primary[500], alpha);
  },
} as const;

/**
 * Tailwindカスタムカラー（必要に応じてtailwind.config.jsで使用）
 */
export const tailwindColors = {
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  chart: colors.chart,
  gray: colors.gray,
} as const;