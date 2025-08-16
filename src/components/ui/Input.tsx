import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { colors } from '../../styles/colors';

/**
 * 入力フィールドのバリデーション状態
 */
type InputState = 'default' | 'error' | 'warning' | 'success';

/**
 * 入力フィールドのサイズ
 */
type InputSize = 'sm' | 'md' | 'lg';

/**
 * 基本入力フィールドプロパティ
 */
interface BaseInputProps {
  /** ラベル */
  label?: string;
  /** ヘルプテキスト */
  helpText?: string;
  /** エラーメッセージ */
  errorMessage?: string;
  /** バリデーション状態 */
  state?: InputState;
  /** サイズ */
  size?: InputSize;
  /** 必須フィールド */
  required?: boolean;
  /** 全幅表示 */
  fullWidth?: boolean;
  /** 左側アイコン */
  leftIcon?: React.ReactNode;
  /** 右側アイコン */
  rightIcon?: React.ReactNode;
}

/**
 * テキスト入力フィールドプロパティ
 */
interface TextInputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {}

/**
 * テキストエリアプロパティ
 */
interface TextareaProps extends BaseInputProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {}

/**
 * セレクトプロパティ
 */
interface SelectProps extends BaseInputProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  children: React.ReactNode;
}

/**
 * スタイル定義
 */
const inputStyles = {
  // ラベルスタイル
  label: {
    base: 'block text-sm font-medium mb-1',
    colors: {
      default: `text-[${colors.text.primary}]`,
      error: `text-[${colors.error[600]}]`,
      warning: `text-[${colors.warning[600]}]`,
      success: `text-[${colors.success[600]}]`,
    },
  },

  // ヘルプテキスト・エラーメッセージスタイル
  helpText: {
    base: 'mt-1 text-xs',
    colors: {
      default: `text-[${colors.text.secondary}]`,
      error: `text-[${colors.error[600]}]`,
      warning: `text-[${colors.warning[600]}]`,
      success: `text-[${colors.success[600]}]`,
    },
  },

  // 入力フィールド基本スタイル
  field: {
    base: 'block border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed',
    
    // サイズ別スタイル
    sizes: {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-3 py-2 text-sm rounded-md',
      lg: 'px-4 py-3 text-base rounded-lg',
    },

    // 状態別スタイル
    states: {
      default: {
        classes: `border-[${colors.border.light}] focus:border-[${colors.primary[500]}] focus:ring-[${colors.primary[500]}]`,
        style: {
          borderColor: colors.border.light,
          '&:focus': {
            borderColor: colors.primary[500],
            boxShadow: `0 0 0 2px ${colors.primary[500]}20`,
          },
        },
      },
      error: {
        classes: `border-[${colors.error[500]}] focus:border-[${colors.error[500]}] focus:ring-[${colors.error[500]}]`,
        style: {
          borderColor: colors.error[500],
          '&:focus': {
            borderColor: colors.error[500],
            boxShadow: `0 0 0 2px ${colors.error[500]}20`,
          },
        },
      },
      warning: {
        classes: `border-[${colors.warning[500]}] focus:border-[${colors.warning[500]}] focus:ring-[${colors.warning[500]}]`,
        style: {
          borderColor: colors.warning[500],
          '&:focus': {
            borderColor: colors.warning[500],
            boxShadow: `0 0 0 2px ${colors.warning[500]}20`,
          },
        },
      },
      success: {
        classes: `border-[${colors.success[500]}] focus:border-[${colors.success[500]}] focus:ring-[${colors.success[500]}]`,
        style: {
          borderColor: colors.success[500],
          '&:focus': {
            borderColor: colors.success[500],
            boxShadow: `0 0 0 2px ${colors.success[500]}20`,
          },
        },
      },
    },
  },

  // コンテナスタイル
  container: {
    base: '',
    fullWidth: 'w-full',
  },

  // アイコン付き入力フィールドのコンテナ
  iconContainer: {
    base: 'relative',
    leftIcon: 'pl-10',
    rightIcon: 'pr-10',
  },

  // アイコンスタイル
  icon: {
    base: 'absolute top-1/2 transform -translate-y-1/2 pointer-events-none',
    left: 'left-3',
    right: 'right-3',
    colors: {
      default: `text-[${colors.text.secondary}]`,
      error: `text-[${colors.error[500]}]`,
      warning: `text-[${colors.warning[500]}]`,
      success: `text-[${colors.success[500]}]`,
    },
  },
};

/**
 * 必須マーク
 */
const RequiredMark: React.FC = () => (
  <span className={`text-[${colors.error[500]}] ml-1`}>*</span>
);

/**
 * フィールドラッパーコンポーネント
 */
const FieldWrapper: React.FC<{
  label?: string;
  helpText?: string;
  errorMessage?: string;
  state: InputState;
  required?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}> = ({ label, helpText, errorMessage, state, required, fullWidth, children }) => {
  const containerClass = [
    inputStyles.container.base,
    fullWidth ? inputStyles.container.fullWidth : '',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClass = [
    inputStyles.label.base,
    state === 'error' ? inputStyles.label.colors.error :
    state === 'warning' ? inputStyles.label.colors.warning :
    state === 'success' ? inputStyles.label.colors.success :
    inputStyles.label.colors.default,
  ]
    .filter(Boolean)
    .join(' ');

  const messageClass = [
    inputStyles.helpText.base,
    state === 'error' ? inputStyles.helpText.colors.error :
    state === 'warning' ? inputStyles.helpText.colors.warning :
    state === 'success' ? inputStyles.helpText.colors.success :
    inputStyles.helpText.colors.default,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass}>
      {label && (
        <label className={labelClass} style={{ color: 
          state === 'error' ? colors.error[600] :
          state === 'warning' ? colors.warning[600] :
          state === 'success' ? colors.success[600] :
          colors.text.primary
        }}>
          {label}
          {required && <RequiredMark />}
        </label>
      )}
      {children}
      {(errorMessage || helpText) && (
        <p className={messageClass} style={{ color:
          state === 'error' ? colors.error[600] :
          state === 'warning' ? colors.warning[600] :
          state === 'success' ? colors.success[600] :
          colors.text.secondary
        }}>
          {errorMessage || helpText}
        </p>
      )}
    </div>
  );
};

/**
 * テキスト入力フィールド
 */
export const Input = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      helpText,
      errorMessage,
      state = 'default',
      size = 'md',
      required = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const fieldClass = [
      inputStyles.field.base,
      inputStyles.field.sizes[size],
      leftIcon ? inputStyles.iconContainer.leftIcon : '',
      rightIcon ? inputStyles.iconContainer.rightIcon : '',
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const fieldStyle = {
      ...inputStyles.field.states[state].style,
      ...style,
    };

    const iconClass = [
      inputStyles.icon.base,
      inputStyles.icon.colors[state],
    ]
      .filter(Boolean)
      .join(' ');

    const iconStyle = {
      color: 
        state === 'error' ? colors.error[500] :
        state === 'warning' ? colors.warning[500] :
        state === 'success' ? colors.success[500] :
        colors.text.secondary
    };

    return (
      <FieldWrapper
        label={label}
        helpText={helpText}
        errorMessage={errorMessage}
        state={state}
        required={required}
        fullWidth={fullWidth}
      >
        <div className={inputStyles.iconContainer.base}>
          <input
            ref={ref}
            className={fieldClass}
            style={fieldStyle}
            required={required}
            {...props}
          />
          {leftIcon && (
            <div className={`${iconClass} ${inputStyles.icon.left}`} style={iconStyle}>
              {leftIcon}
            </div>
          )}
          {rightIcon && (
            <div className={`${iconClass} ${inputStyles.icon.right}`} style={iconStyle}>
              {rightIcon}
            </div>
          )}
        </div>
      </FieldWrapper>
    );
  }
);

Input.displayName = 'Input';

/**
 * テキストエリア
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helpText,
      errorMessage,
      state = 'default',
      size = 'md',
      required = false,
      fullWidth = false,
      className = '',
      style,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const fieldClass = [
      inputStyles.field.base,
      inputStyles.field.sizes[size],
      fullWidth ? 'w-full' : '',
      'resize-vertical',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const fieldStyle = {
      ...inputStyles.field.states[state].style,
      ...style,
    };

    return (
      <FieldWrapper
        label={label}
        helpText={helpText}
        errorMessage={errorMessage}
        state={state}
        required={required}
        fullWidth={fullWidth}
      >
        <textarea
          ref={ref}
          className={fieldClass}
          style={fieldStyle}
          required={required}
          rows={rows}
          {...props}
        />
      </FieldWrapper>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * セレクト
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helpText,
      errorMessage,
      state = 'default',
      size = 'md',
      required = false,
      fullWidth = false,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    const fieldClass = [
      inputStyles.field.base,
      inputStyles.field.sizes[size],
      fullWidth ? 'w-full' : '',
      'pr-8 bg-white', // セレクト矢印のためのスペース
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const fieldStyle = {
      ...inputStyles.field.states[state].style,
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 0.5rem center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '1.5em 1.5em',
      ...style,
    };

    return (
      <FieldWrapper
        label={label}
        helpText={helpText}
        errorMessage={errorMessage}
        state={state}
        required={required}
        fullWidth={fullWidth}
      >
        <select
          ref={ref}
          className={fieldClass}
          style={fieldStyle}
          required={required}
          {...props}
        >
          {children}
        </select>
      </FieldWrapper>
    );
  }
);

Select.displayName = 'Select';

/**
 * 時間入力フィールド（HH:MM形式）
 */
interface TimeInputProps extends Omit<TextInputProps, 'type'> {}

export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="time"
        {...props}
      />
    );
  }
);

TimeInput.displayName = 'TimeInput';

/**
 * 日付入力フィールド
 */
interface DateInputProps extends Omit<TextInputProps, 'type'> {}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        {...props}
      />
    );
  }
);

DateInput.displayName = 'DateInput';

/**
 * 数値入力フィールド
 */
interface NumberInputProps extends Omit<TextInputProps, 'type'> {}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';

export default Input;