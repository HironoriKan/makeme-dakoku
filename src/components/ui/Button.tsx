import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { colors, semanticColors } from '../../styles/colors';

/**
 * ボタンバリエーション
 */
type ButtonVariant = 'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'outline' | 'ghost';

/**
 * ボタンサイズ
 */
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * ボタンプロパティ
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** ボタンバリエーション（色） */
  variant?: ButtonVariant;
  /** ボタンサイズ */
  size?: ButtonSize;
  /** 全幅表示 */
  fullWidth?: boolean;
  /** ローディング状態 */
  loading?: boolean;
  /** 左側アイコン */
  leftIcon?: React.ReactNode;
  /** 右側アイコン */
  rightIcon?: React.ReactNode;
  /** 子要素 */
  children: React.ReactNode;
}

/**
 * スタイル定義
 */
const buttonStyles = {
  // 基本スタイル
  base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // サイズ別スタイル
  sizes: {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
    xl: 'px-8 py-4 text-lg rounded-lg',
  },
  
  // バリエーション別スタイル
  variants: {
    primary: {
      base: 'text-white border border-transparent',
      normal: `bg-[${colors.primary[500]}] hover:bg-[${colors.primary[600]}] active:bg-[${colors.primary[700]}] focus:ring-[${colors.primary[500]}]`,
      style: {
        backgroundColor: colors.primary[500],
        borderColor: colors.primary[500],
        color: '#ffffff',
        '&:hover': {
          backgroundColor: colors.primary[600],
        },
        '&:active': {
          backgroundColor: colors.primary[700],
        },
        '&:focus': {
          boxShadow: `0 0 0 2px ${colors.primary[500]}40`,
        },
      },
    },
    success: {
      base: 'text-white border border-transparent',
      normal: `bg-[${colors.success[500]}] hover:bg-[${colors.success[600]}] focus:ring-[${colors.success[500]}]`,
      style: {
        backgroundColor: colors.success[500],
        borderColor: colors.success[500],
        color: '#ffffff',
        '&:hover': {
          backgroundColor: colors.success[600],
        },
        '&:focus': {
          boxShadow: `0 0 0 2px ${colors.success[500]}40`,
        },
      },
    },
    warning: {
      base: 'text-white border border-transparent',
      normal: `bg-[${colors.warning[500]}] hover:bg-[${colors.warning[600]}] focus:ring-[${colors.warning[500]}]`,
      style: {
        backgroundColor: colors.warning[500],
        borderColor: colors.warning[500],
        color: '#ffffff',
        '&:hover': {
          backgroundColor: colors.warning[600],
        },
        '&:focus': {
          boxShadow: `0 0 0 2px ${colors.warning[500]}40`,
        },
      },
    },
    error: {
      base: 'text-white border border-transparent',
      normal: `bg-[${colors.error[500]}] hover:bg-[${colors.error[600]}] focus:ring-[${colors.error[500]}]`,
      style: {
        backgroundColor: colors.error[500],
        borderColor: colors.error[500],
        color: '#ffffff',
        '&:hover': {
          backgroundColor: colors.error[600],
        },
        '&:focus': {
          boxShadow: `0 0 0 2px ${colors.error[500]}40`,
        },
      },
    },
    secondary: {
      base: 'border',
      normal: `text-[${colors.gray[700]}] bg-white border-[${colors.gray[300]}] hover:bg-[${colors.gray[50]}] focus:ring-[${colors.gray[500]}]`,
      style: {
        backgroundColor: '#ffffff',
        borderColor: colors.gray[300],
        color: colors.gray[700],
        '&:hover': {
          backgroundColor: colors.gray[50],
        },
        '&:focus': {
          boxShadow: `0 0 0 2px ${colors.gray[500]}40`,
        },
      },
    },
    outline: {
      base: 'border-2 bg-transparent',
      normal: `text-[${colors.primary[600]}] border-[${colors.primary[500]}] hover:bg-[${colors.primary[50]}] focus:ring-[${colors.primary[500]}]`,
      style: {
        backgroundColor: 'transparent',
        borderColor: colors.primary[500],
        color: colors.primary[600],
        '&:hover': {
          backgroundColor: colors.primary[50],
        },
        '&:focus': {
          boxShadow: `0 0 0 2px ${colors.primary[500]}40`,
        },
      },
    },
    ghost: {
      base: 'border border-transparent',
      normal: `text-[${colors.primary[600]}] hover:bg-[${colors.primary[50]}] focus:ring-[${colors.primary[500]}]`,
      style: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: colors.primary[600],
        '&:hover': {
          backgroundColor: colors.primary[50],
        },
        '&:focus': {
          boxShadow: `0 0 0 2px ${colors.primary[500]}40`,
        },
      },
    },
  },
};

/**
 * ローディングスピナーコンポーネント
 */
const LoadingSpinner: React.FC<{ size: number }> = ({ size }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

/**
 * 統一ボタンコンポーネント
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      style,
      ...props
    },
    ref
  ) => {
    // スピナーサイズの計算
    const spinnerSize = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    }[size];

    // アイコン間隔の計算
    const iconSpacing = {
      xs: 'space-x-1',
      sm: 'space-x-1.5',
      md: 'space-x-2',
      lg: 'space-x-2.5',
      xl: 'space-x-3',
    }[size];

    // スタイルの組み合わせ
    const baseClasses = [
      buttonStyles.base,
      buttonStyles.sizes[size],
      buttonStyles.variants[variant].base,
      fullWidth ? 'w-full' : '',
      iconSpacing,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // インラインスタイルの組み合わせ
    const combinedStyle = {
      ...buttonStyles.variants[variant].style,
      ...style,
    };

    return (
      <button
        ref={ref}
        className={baseClasses}
        style={combinedStyle}
        disabled={disabled || loading}
        {...props}
      >
        {/* 左側アイコンまたはローディング */}
        {loading ? (
          <LoadingSpinner size={spinnerSize} />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}

        {/* ボタンテキスト */}
        <span className={loading ? 'opacity-0' : ''}>{children}</span>

        {/* 右側アイコン（ローディング中は非表示） */}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}

        {/* ローディング中の中央スピナー */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size={spinnerSize} />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * アイコンボタンコンポーネント（正方形）
 */
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className = '', ...props }, ref) => {
    const iconButtonSizes = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-14 h-14',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={`${iconButtonSizes[size]} p-0 ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default Button;