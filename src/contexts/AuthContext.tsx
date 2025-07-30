import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, AuthContextValue, LineUser, LineLoginConfig } from '../types/auth';
import { isTokenExpired, refreshAuthSession } from '../utils/auth';

const AUTH_STORAGE_KEY = 'line_auth_user';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: LineUser }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// LINE Login設定（環境変数から取得）
const lineConfig: LineLoginConfig = {
  channelId: import.meta.env.VITE_LINE_CHANNEL_ID || '',
  redirectUri: import.meta.env.VITE_LINE_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  scope: 'profile openid email',
};



const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUser) {
          const user: LineUser = JSON.parse(storedUser);
          
          // セッションの有効期限をチェック
          if (isTokenExpired(user)) {
            // セッションが期限切れの場合はログアウト
            console.log('セッションが期限切れです。再ログインが必要です。');
            localStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem('line_auth_timestamp');
            dispatch({ type: 'SET_LOADING', payload: false });
          } else {
            // セッションが有効な場合はログイン状態を復元
            refreshAuthSession();
            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('認証初期化エラー:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('line_auth_timestamp');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();

    // セッション期限チェックのためのタイマー（1時間ごと）
    const sessionCheckInterval = setInterval(() => {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const user: LineUser = JSON.parse(storedUser);
        if (isTokenExpired(user)) {
          console.log('セッションタイムアウトが検出されました。');
          logout();
        }
      }
    }, 60 * 60 * 1000); // 1時間

    return () => clearInterval(sessionCheckInterval);
  }, []);

  const generateState = (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  const login = () => {
    if (!lineConfig.channelId) {
      dispatch({ 
        type: 'LOGIN_ERROR', 
        payload: 'LINE Channel IDが設定されていません。環境変数 VITE_LINE_CHANNEL_ID を確認してください。' 
      });
      return;
    }

    dispatch({ type: 'LOGIN_START' });

    const state = generateState();
    localStorage.setItem('line_login_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: lineConfig.channelId,
      redirect_uri: lineConfig.redirectUri,
      state: state,
      scope: lineConfig.scope,
      // nonce: generateState(), // OIDC対応の場合
    });

    const authUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
    
    try {
      window.location.href = authUrl;
    } catch (error) {
      console.error('ログイン処理エラー:', error);
      dispatch({ 
        type: 'LOGIN_ERROR', 
        payload: 'ログイン処理中にエラーが発生しました。' 
      });
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('line_login_state');
    localStorage.removeItem('line_auth_timestamp');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};