import React, { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { colors } from '../../styles/colors';
import { Button } from './Button';

/**
 * モーダルサイズ
 */
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * アラートタイプ
 */
type AlertType = 'success' | 'warning' | 'error' | 'info';

/**
 * 基本モーダルプロパティ
 */
interface ModalProps {
  /** モーダル表示状態 */
  isOpen: boolean;
  /** 閉じる時のコールバック */
  onClose: () => void;
  /** モーダルサイズ */
  size?: ModalSize;
  /** 背景クリックで閉じる */
  closeOnBackdrop?: boolean;
  /** ESCキーで閉じる */
  closeOnEsc?: boolean;
  /** ヘッダーを表示するか */
  showHeader?: boolean;
  /** タイトル */
  title?: string;
  /** ヘッダーアイコン */
  headerIcon?: ReactNode;
  /** カスタムヘッダー */
  customHeader?: ReactNode;
  /** フッターを表示するか */
  showFooter?: boolean;
  /** カスタムフッター */
  customFooter?: ReactNode;
  /** モーダル本体 */
  children: ReactNode;
  /** カスタムクラス */
  className?: string;
}

/**
 * 確認ダイアログプロパティ
 */
interface ConfirmDialogProps {
  /** ダイアログ表示状態 */
  isOpen: boolean;
  /** タイトル */
  title?: string;
  /** メッセージ */
  message: string;
  /** 確認ボタンテキスト */
  confirmText?: string;
  /** キャンセルボタンテキスト */
  cancelText?: string;
  /** 確認ボタンの種類 */
  confirmVariant?: 'primary' | 'success' | 'warning' | 'error';
  /** 確認時のコールバック */
  onConfirm: () => void;
  /** キャンセル時のコールバック */
  onCancel: () => void;
}

/**
 * アラートダイアログプロパティ
 */
interface AlertDialogProps {
  /** ダイアログ表示状態 */
  isOpen: boolean;
  /** アラートタイプ */
  type: AlertType;
  /** タイトル */
  title?: string;
  /** メッセージ */
  message: string;
  /** 閉じるボタンテキスト */
  closeText?: string;
  /** 閉じる時のコールバック */
  onClose: () => void;
}

/**
 * モーダルサイズスタイル
 */
const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full m-4',
};

/**
 * アラートアイコン
 */
const alertIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

/**
 * アラートカラー
 */
const alertColors = {
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  info: colors.info[500],
};

/**
 * モーダル背景カラー
 */
const alertBackgrounds = {
  success: colors.success[50],
  warning: colors.warning[50],
  error: colors.error[50],
  info: colors.info[50],
};

/**
 * フォーカストラップフック
 */
const useFocusTrap = (isOpen: boolean, containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, containerRef]);
};

/**
 * 基本モーダルコンポーネント
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  showHeader = true,
  title,
  headerIcon,
  customHeader,
  showFooter = false,
  customFooter,
  children,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // フォーカストラップ
  useFocusTrap(isOpen, modalRef);

  // ESCキーで閉じる
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, closeOnEsc, onClose]);

  // 前のフォーカス要素の保存・復元
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // ボディスクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={handleBackdropClick}
      />

      {/* モーダルコンテンツ */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative w-full ${modalSizes[size]} 
            bg-white rounded-2xl shadow-2xl 
            transform transition-all duration-300 
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* ヘッダー */}
          {showHeader && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {customHeader || (
                <div className="flex items-center space-x-3">
                  {headerIcon && (
                    <div style={{ color: colors.primary[500] }}>
                      {headerIcon}
                    </div>
                  )}
                  {title && (
                    <h2 id="modal-title" className="text-xl font-bold text-gray-900">
                      {title}
                    </h2>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="閉じる"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}

          {/* ボディ */}
          <div className="p-6">
            {children}
          </div>

          {/* フッター */}
          {showFooter && customFooter && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              {customFooter}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * 確認ダイアログ
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = '確認',
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      title={title}
      headerIcon={<AlertCircle className="w-6 h-6" />}
      showFooter
      customFooter={
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  );
};

/**
 * アラートダイアログ
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  type,
  title,
  message,
  closeText = '閉じる',
  onClose,
}) => {
  const IconComponent = alertIcons[type];
  const iconColor = alertColors[type];
  const backgroundColor = alertBackgrounds[type];

  const defaultTitles = {
    success: '成功',
    warning: '警告',
    error: 'エラー',
    info: '情報',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title || defaultTitles[type]}
      headerIcon={<IconComponent className="w-6 h-6" style={{ color: iconColor }} />}
      showFooter
      customFooter={
        <Button variant="primary" onClick={onClose}>
          {closeText}
        </Button>
      }
    >
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor }}
      >
        <p className="text-gray-700">{message}</p>
      </div>
    </Modal>
  );
};

/**
 * モーダルコンテキスト（複数モーダル管理用）
 */
interface ModalContextType {
  openModal: (id: string, content: ReactNode) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

const ModalContext = React.createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

/**
 * モーダルプロバイダー
 */
export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modals, setModals] = React.useState<Record<string, ReactNode>>({});

  const openModal = (id: string, content: ReactNode) => {
    setModals(prev => ({ ...prev, [id]: content }));
  };

  const closeModal = (id: string) => {
    setModals(prev => {
      const newModals = { ...prev };
      delete newModals[id];
      return newModals;
    });
  };

  const closeAllModals = () => {
    setModals({});
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, closeAllModals }}>
      {children}
      {Object.entries(modals).map(([id, content]) => (
        <React.Fragment key={id}>{content}</React.Fragment>
      ))}
    </ModalContext.Provider>
  );
};

export default Modal;