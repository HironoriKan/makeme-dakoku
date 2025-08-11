/**
 * 文字化け対策のためのテキストユーティリティ
 */

/**
 * 安全にテキストを表示するための関数
 * 文字化けや不正な文字を除去し、適切な長さに切り詰める
 */
export const sanitizeDisplayText = (text: string | null | undefined, maxLength?: number): string => {
  if (!text) return '';
  
  try {
    // 基本的な文字化け対策
    let sanitized = text
      // 制御文字を除去
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // 不正なUnicode文字を除去
      .replace(/\uFFFD/g, '')
      // 連続する空白を単一の空白に変換
      .replace(/\s+/g, ' ')
      // 前後の空白を除去
      .trim();
    
    // 最大長が指定されている場合は切り詰める
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '...';
    }
    
    return sanitized;
  } catch (error) {
    console.warn('テキストのサニタイズに失敗しました:', error);
    return '';
  }
};

/**
 * ユーザー名を安全に表示するための関数
 */
export const sanitizeUserName = (displayName: string | null | undefined): string => {
  const sanitized = sanitizeDisplayText(displayName);
  return sanitized || 'Unknown User';
};

/**
 * ユーザー名を指定した文字数で切り詰める関数
 */
export const truncateUserName = (displayName: string | null | undefined, maxLength: number = 10): string => {
  const sanitized = sanitizeUserName(displayName);
  if (sanitized.length <= maxLength) return sanitized;
  return sanitized.substring(0, maxLength) + '...';
};

/**
 * 文字エンコーディングを確認・修正する関数
 */
export const fixTextEncoding = (text: string | null | undefined): string => {
  if (!text) return '';
  
  try {
    // UTF-8として正しく表示されるかチェック
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    
    const bytes = encoder.encode(text);
    const decoded = decoder.decode(bytes);
    
    return sanitizeDisplayText(decoded);
  } catch (error) {
    console.warn('文字エンコーディングの修正に失敗しました:', error);
    return sanitizeDisplayText(text);
  }
};