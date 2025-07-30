import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { exchangeCodeForToken, verifyIdToken, getUserProfile, refreshAuthSession } from '../utils/auth';
import { LineUser } from '../types/auth';
import { UserServiceSimple } from '../services/userServiceSimple';

const AuthCallback: React.FC = () => {
  const { logout } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          console.error('LINE認証エラー:', error);
          alert('ログインがキャンセルされました。');
          window.location.href = '/';
          return;
        }

        if (!code || !state) {
          console.error('認証パラメータが不足しています');
          alert('認証に失敗しました。もう一度お試しください。');
          window.location.href = '/';
          return;
        }

        const storedState = localStorage.getItem('line_login_state');
        console.log('🔍 State検証:', {
          received: state,
          stored: storedState,
          match: state === storedState
        });
        
        if (state !== storedState) {
          console.error('State パラメータが一致しません');
          // 古いstateをクリアして再試行を促す
          localStorage.removeItem('line_login_state');
          alert('セキュリティエラーが発生しました。ブラウザを更新してもう一度お試しください。');
          window.location.href = '/';
          return;
        }

        // 1. 認証コードをアクセストークンに交換
        const tokenResponse = await exchangeCodeForToken(code);
        
        let user: LineUser;

        // 2. IDトークンからユーザー情報を取得（OpenID Connect）
        if (tokenResponse.id_token) {
          user = verifyIdToken(tokenResponse.id_token);
        } else {
          // 3. プロフィールAPIからユーザー情報を取得（fallback）
          user = await getUserProfile(tokenResponse.access_token);
        }

        // Supabaseにユーザー情報を保存または更新
        try {
          console.log('📝 Supabaseにユーザー情報を保存開始');
          const dbUser = await UserServiceSimple.findOrCreateUser(user);
          console.log('✅ DBユーザー情報保存成功:', dbUser);
        } catch (dbError) {
          console.error('❌ DB操作エラー:', dbError);
          // DBエラーでもログイン処理は継続（フォールバック）
        }

        // ユーザー情報をローカルストレージに保存
        localStorage.setItem('line_auth_user', JSON.stringify(user));
        localStorage.removeItem('line_login_state');
        
        // セッション開始時刻を記録
        refreshAuthSession();

        console.log('ログイン成功:', user.displayName);

        // メインページにリダイレクト
        window.location.href = '/';

      } catch (error) {
        console.error('認証処理エラー:', error);
        
        // エラーの種類に応じたメッセージ表示
        if (error instanceof Error) {
          if (error.message.includes('トークン交換')) {
            alert('LINEログインの設定に問題があります。管理者にお問い合わせください。');
          } else if (error.message.includes('IDトークン')) {
            alert('ユーザー情報の取得に失敗しました。もう一度お試しください。');
          } else if (error.message.includes('Channel Secret')) {
            alert('開発環境の設定が不完全です。Channel Secretを確認してください。');
          } else {
            alert(`認証エラー: ${error.message}`);
          }
        } else {
          alert('認証処理中にエラーが発生しました。');
        }
        
        // エラー時はログイン状態をクリア
        localStorage.removeItem('line_auth_user');
        localStorage.removeItem('line_login_state');
        localStorage.removeItem('line_auth_timestamp');
        
        window.location.href = '/';
      }
    };

    handleCallback();
  }, [logout]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#CB8585' }}>
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">認証処理中...</h2>
        <p className="text-gray-600">LINEサーバーと通信しています</p>
        <div className="mt-4">
          <div className="flex items-center justify-center space-x-1 text-gray-400 text-sm">
            <span>認証コードを処理中</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;