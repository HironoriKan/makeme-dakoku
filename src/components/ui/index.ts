/**
 * 統一デザインシステム - UIコンポーネント集約
 * 
 * 使用例:
 * import { Button, Input, Modal, Table, Card, colors } from '@/components/ui';
 */

// カラーパレット
export { colors, semanticColors, colorUtils, tailwindColors } from '../../styles/colors';

// ボタン系コンポーネント
export { Button, IconButton } from './Button';

// 入力系コンポーネント
export { 
  Input, 
  Textarea, 
  Select, 
  TimeInput, 
  DateInput, 
  NumberInput 
} from './Input';

// モーダル・ダイアログ系コンポーネント
export { 
  Modal, 
  ConfirmDialog, 
  AlertDialog, 
  ModalProvider, 
  useModal 
} from './Modal';

// テーブル系コンポーネント
export { Table } from './Table';

// カード・パネル系コンポーネント
export { 
  Card, 
  StatCard, 
  ActionCard, 
  InfoPanel 
} from './Card';

/**
 * デザインシステム定数
 */
export const designSystem = {
  // スペーシング（Tailwindに合わせた8pxベース）
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  },

  // 角丸
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
  },

  // フォントサイズ
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    md: '1rem',      // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },

  // フォントウェイト
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // シャドウ
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // アニメーション
  animation: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
} as const;

/**
 * ユーティリティ関数
 */
export const utils = {
  /**
   * クラス名を条件付きで結合
   */
  cn: (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
  },

  /**
   * スタイルオブジェクトをマージ
   */
  mergeStyles: (...styles: (React.CSSProperties | undefined)[]): React.CSSProperties => {
    return styles.reduce((merged, style) => ({
      ...merged,
      ...style,
    }), {});
  },

  /**
   * レスポンシブ値の取得
   */
  responsive: {
    isSmall: () => window.innerWidth < 640,
    isMedium: () => window.innerWidth >= 640 && window.innerWidth < 1024,
    isLarge: () => window.innerWidth >= 1024,
  },
} as const;

/**
 * コンポーネントプロパティのベース型
 */
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * サイズバリエーションの型
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * カラーバリエーションの型
 */
export type ColorVariant = 'primary' | 'success' | 'warning' | 'error' | 'secondary';

/**
 * デザインシステムのバージョン情報
 */
export const version = '1.0.0';

/**
 * デザインシステムの設定
 */
export const config = {
  // アニメーション有効化
  enableAnimations: true,
  // ダークモード対応（将来の拡張用）
  darkMode: false,
  // アクセシビリティ機能
  accessibility: {
    enableFocusRing: true,
    enableReducedMotion: false,
  },
} as const;