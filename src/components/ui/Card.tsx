import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, MoreVertical } from 'lucide-react';
import { colors } from '../../styles/colors';
import { Button, IconButton } from './Button';

/**
 * カードサイズ
 */
type CardSize = 'sm' | 'md' | 'lg';

/**
 * カードバリアント
 */
type CardVariant = 'default' | 'outlined' | 'elevated' | 'ghost';

/**
 * 統計カードのトレンド
 */
type TrendType = 'up' | 'down' | 'neutral';

/**
 * 基本カードプロパティ
 */
interface CardProps {
  /** カードサイズ */
  size?: CardSize;
  /** カードバリアント */
  variant?: CardVariant;
  /** ヘッダーを表示するか */
  showHeader?: boolean;
  /** タイトル */
  title?: string;
  /** サブタイトル */
  subtitle?: string;
  /** ヘッダーアイコン */
  headerIcon?: ReactNode;
  /** ヘッダーアクション */
  headerAction?: ReactNode;
  /** カスタムヘッダー */
  customHeader?: ReactNode;
  /** フッターを表示するか */
  showFooter?: boolean;
  /** カスタムフッター */
  customFooter?: ReactNode;
  /** クリック可能かどうか */
  clickable?: boolean;
  /** クリック時のコールバック */
  onClick?: () => void;
  /** ホバー効果を有効にするか */
  hoverable?: boolean;
  /** ローディング状態 */
  loading?: boolean;
  /** カスタムクラス */
  className?: string;
  /** カスタムスタイル */
  style?: React.CSSProperties;
  /** 子要素 */
  children: ReactNode;
}

/**
 * 統計カードプロパティ
 */
interface StatCardProps {
  /** タイトル */
  title: string;
  /** 値 */
  value: string | number;
  /** アイコン */
  icon?: ReactNode;
  /** トレンド */
  trend?: {
    type: TrendType;
    value: string | number;
    label?: string;
  };
  /** サブテキスト */
  subtext?: string;
  /** カラー */
  color?: string;
  /** カードサイズ */
  size?: CardSize;
  /** クリック時のコールバック */
  onClick?: () => void;
}

/**
 * アクションカードプロパティ
 */
interface ActionCardProps {
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** アイコン */
  icon?: ReactNode;
  /** アクションボタン */
  actions?: ReactNode;
  /** 画像URL */
  imageUrl?: string;
  /** カードサイズ */
  size?: CardSize;
  /** クリック時のコールバック */
  onClick?: () => void;
}

/**
 * 情報パネルプロパティ
 */
interface InfoPanelProps {
  /** パネルタイプ */
  type: 'info' | 'success' | 'warning' | 'error';
  /** タイトル */
  title?: string;
  /** メッセージ */
  message: string;
  /** 閉じるボタンを表示するか */
  closable?: boolean;
  /** 閉じる時のコールバック */
  onClose?: () => void;
  /** アクション */
  action?: ReactNode;
}

/**
 * カードスタイル定義
 */
const cardStyles = {
  // サイズ別スタイル
  sizes: {
    sm: {
      padding: 'p-4',
      headerPadding: 'px-4 py-3',
      footerPadding: 'px-4 py-3',
      titleSize: 'text-sm font-medium',
      subtitleSize: 'text-xs',
    },
    md: {
      padding: 'p-6',
      headerPadding: 'px-6 py-4',
      footerPadding: 'px-6 py-4',
      titleSize: 'text-lg font-semibold',
      subtitleSize: 'text-sm',
    },
    lg: {
      padding: 'p-8',
      headerPadding: 'px-8 py-6',
      footerPadding: 'px-8 py-6',
      titleSize: 'text-xl font-bold',
      subtitleSize: 'text-base',
    },
  },

  // バリアント別スタイル
  variants: {
    default: {
      base: 'bg-white',
      shadow: 'shadow-sm',
      border: 'border-0',
    },
    outlined: {
      base: 'bg-white',
      shadow: 'shadow-none',
      border: `border`,
      borderColor: colors.border.light,
    },
    elevated: {
      base: 'bg-white',
      shadow: 'shadow-lg',
      border: 'border-0',
    },
    ghost: {
      base: 'bg-transparent',
      shadow: 'shadow-none',
      border: 'border-0',
    },
  },
};

/**
 * ローディングスケルトン
 */
const CardSkeleton: React.FC<{ size: CardSize }> = ({ size }) => {
  const sizeConfig = cardStyles.sizes[size];

  return (
    <div className={`${sizeConfig.padding} space-y-3`}>
      <div className="animate-pulse space-y-3">
        <div 
          className="h-4 rounded"
          style={{ backgroundColor: colors.gray[200] }}
        />
        <div 
          className="h-8 rounded"
          style={{ backgroundColor: colors.gray[200] }}
        />
        <div 
          className="h-4 w-2/3 rounded"
          style={{ backgroundColor: colors.gray[200] }}
        />
      </div>
    </div>
  );
};

/**
 * 基本カードコンポーネント
 */
export const Card: React.FC<CardProps> = ({
  size = 'md',
  variant = 'default',
  showHeader = false,
  title,
  subtitle,
  headerIcon,
  headerAction,
  customHeader,
  showFooter = false,
  customFooter,
  clickable = false,
  onClick,
  hoverable = false,
  loading = false,
  className = '',
  style,
  children,
}) => {
  const sizeConfig = cardStyles.sizes[size];
  const variantConfig = cardStyles.variants[variant];

  const baseClasses = [
    'rounded-lg transition-all duration-200',
    variantConfig.base,
    variantConfig.shadow,
    variantConfig.border,
    clickable || onClick ? 'cursor-pointer' : '',
    hoverable || clickable ? 'hover:shadow-md hover:-translate-y-0.5' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const cardStyle = {
    ...style,
    ...(variant === 'outlined' ? { borderColor: variantConfig.borderColor } : {}),
  };

  const handleClick = () => {
    if (onClick && !loading) {
      onClick();
    }
  };

  return (
    <div 
      className={baseClasses}
      style={cardStyle}
      onClick={handleClick}
    >
      {/* ヘッダー */}
      {showHeader && (
        <div 
          className={`${sizeConfig.headerPadding} border-b`}
          style={{ borderColor: colors.border.light }}
        >
          {customHeader || (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {headerIcon && (
                  <div style={{ color: colors.primary[500] }}>
                    {headerIcon}
                  </div>
                )}
                <div>
                  {title && (
                    <h3 className={sizeConfig.titleSize} style={{ color: colors.text.primary }}>
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className={sizeConfig.subtitleSize} style={{ color: colors.text.secondary }}>
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {headerAction && (
                <div onClick={(e) => e.stopPropagation()}>
                  {headerAction}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ボディ */}
      <div className={showHeader || showFooter ? sizeConfig.padding : sizeConfig.padding}>
        {loading ? <CardSkeleton size={size} /> : children}
      </div>

      {/* フッター */}
      {showFooter && customFooter && (
        <div 
          className={`${sizeConfig.footerPadding} border-t`}
          style={{ borderColor: colors.border.light }}
        >
          {customFooter}
        </div>
      )}
    </div>
  );
};

/**
 * 統計カードコンポーネント
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtext,
  color = colors.primary[500],
  size = 'md',
  onClick,
}) => {
  const getTrendIcon = (type: TrendType) => {
    switch (type) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (type: TrendType) => {
    switch (type) {
      case 'up':
        return colors.success[500];
      case 'down':
        return colors.error[500];
      default:
        return colors.gray[500];
    }
  };

  return (
    <Card
      size={size}
      variant="outlined"
      hoverable={!!onClick}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: colors.text.primary }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {trend && (
            <div className="flex items-center space-x-1 mt-2">
              <div style={{ color: getTrendColor(trend.type) }}>
                {getTrendIcon(trend.type)}
              </div>
              <span 
                className="text-sm font-medium"
                style={{ color: getTrendColor(trend.type) }}
              >
                {trend.value}
                {trend.label && (
                  <span className="ml-1 text-xs" style={{ color: colors.text.secondary }}>
                    {trend.label}
                  </span>
                )}
              </span>
            </div>
          )}
          
          {subtext && (
            <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
              {subtext}
            </p>
          )}
        </div>
        
        {icon && (
          <div 
            className="p-3 rounded-lg"
            style={{ 
              backgroundColor: `${color}20`,
              color: color 
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * アクションカードコンポーネント
 */
export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  actions,
  imageUrl,
  size = 'md',
  onClick,
}) => {
  return (
    <Card
      size={size}
      variant="outlined"
      hoverable={!!onClick}
      onClick={onClick}
    >
      <div className="space-y-4">
        {imageUrl && (
          <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex items-start space-x-3">
          {icon && (
            <div 
              className="p-2 rounded-lg"
              style={{ 
                backgroundColor: colors.primary[50],
                color: colors.primary[500]
              }}
            >
              {icon}
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: colors.text.primary }}>
              {title}
            </h3>
            {description && (
              <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                {description}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * 情報パネルコンポーネント
 */
export const InfoPanel: React.FC<InfoPanelProps> = ({
  type,
  title,
  message,
  closable = false,
  onClose,
  action,
}) => {
  const typeColors = {
    info: colors.info[500],
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
  };

  const typeBackgrounds = {
    info: colors.info[50],
    success: colors.success[50],
    warning: colors.warning[50],
    error: colors.error[50],
  };

  return (
    <div 
      className="p-4 rounded-lg border-l-4"
      style={{ 
        backgroundColor: typeBackgrounds[type],
        borderLeftColor: typeColors[type]
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && (
            <h4 className="font-medium" style={{ color: colors.text.primary }}>
              {title}
            </h4>
          )}
          <p 
            className={`${title ? 'mt-1' : ''} text-sm`}
            style={{ color: colors.text.secondary }}
          >
            {message}
          </p>
          
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
        
        {closable && onClose && (
          <button
            onClick={onClose}
            className="ml-4 p-1 rounded hover:bg-black hover:bg-opacity-10"
          >
            <IconButton
              icon={<MoreVertical className="w-4 h-4" />}
              variant="ghost"
              size="sm"
              aria-label="閉じる"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;