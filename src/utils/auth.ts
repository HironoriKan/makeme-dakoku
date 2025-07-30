import { LineUser } from '../types/auth';

// 本番環境では、トークン交換はバックエンドで行うことを強く推奨
export const exchangeCodeForToken = async (code: string): Promise<{
  access_token: string;
  id_token: string;
}> => {
  try {
    // ⚠️ セキュリティ注意: 
    // 理想的には本番環境でバックエンドAPIを使用すべきですが、
    // 静的サイトデプロイのため、直接LINE APIを呼び出します
  const channelSecret = import.meta.env.VITE_LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    throw new Error('Channel Secretが設定されていません');
  }

  // 本番環境では直接LINE APIを呼び出し、開発環境ではプロキシ経由
  const apiUrl = import.meta.env.DEV 
    ? '/api/line/oauth2/v2.1/token'
    : 'https://api.line.me/oauth2/v2.1/token';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: import.meta.env.VITE_LINE_REDIRECT_URI || `${window.location.origin}/auth/callback`,
      client_id: import.meta.env.VITE_LINE_CHANNEL_ID || '',
      client_secret: channelSecret,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('LINE API エラー:', errorData);
    throw new Error('トークン交換に失敗しました');
  }

  return response.json();
  } catch (error) {
    console.error('ネットワークエラー:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('ネットワーク接続エラー：インターネット接続を確認してください');
    }
    throw error;
  }
};

export const verifyIdToken = (idToken: string): LineUser => {
  try {
    // 本番環境では、IDトークンの署名検証も実装すべき
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    // トークンの有効期限チェック
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('IDトークンの有効期限が切れています');
    }

    // issuerの検証
    if (payload.iss !== 'https://access.line.me') {
      throw new Error('IDトークンのissuerが無効です');
    }

    // audienceの検証
    const channelId = import.meta.env.VITE_LINE_CHANNEL_ID;
    if (payload.aud !== channelId) {
      throw new Error('IDトークンのaudienceが無効です');
    }
    
    return {
      userId: payload.sub,
      displayName: payload.name || 'LINE ユーザー',
      pictureUrl: payload.picture,
      email: payload.email,
    };
  } catch (error) {
    console.error('IDトークン検証エラー:', error);
    throw new Error('IDトークンの検証に失敗しました');
  }
};

export const getUserProfile = async (accessToken: string): Promise<LineUser> => {
  // 本番環境では直接LINE APIを呼び出し、開発環境ではプロキシ経由
  const apiUrl = import.meta.env.DEV 
    ? '/api/line/v2/profile'
    : 'https://api.line.me/v2/profile';
    
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('プロフィール取得エラー:', errorData);
    throw new Error('ユーザープロフィール取得に失敗しました');
  }

  const profile = await response.json();
  
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    email: undefined, // プロフィールAPIではメールアドレスは取得できません
  };
};

// セッション管理のためのユーティリティ関数
export const isTokenExpired = (user: LineUser): boolean => {
  // 実装例：最後のログイン時刻をチェック
  const authData = localStorage.getItem('line_auth_timestamp');
  if (!authData) return true;

  const authTime = parseInt(authData);
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000; // 24時間

  return (now - authTime) > oneDay;
};

export const refreshAuthSession = (): void => {
  localStorage.setItem('line_auth_timestamp', Date.now().toString());
};