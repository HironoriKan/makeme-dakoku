import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LineLogin: React.FC = () => {
  const { login, error, isLoading, clearError } = useAuth();
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  useEffect(() => {
    // コンポーネントマウント後にボトムシートをアニメーション表示
    const timer = setTimeout(() => {
      setShowBottomSheet(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="h-screen relative overflow-hidden fixed inset-0"
      style={{
        backgroundImage: `url('/images/メイクミー勤怠FV2.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      {/* サービスロゴ（背景の上部に配置） */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-12 sm:pt-20">
        <img 
          src="/images/MakeMeKINTAI-サービス名2.png" 
          alt="Make Me KINTAI"
          className="w-4/5 h-auto object-contain"
          style={{ 
            maxWidth: '342px', // 428px * 0.8 = 342.4px
            aspectRatio: 'auto'
          }}
        />
      </div>
      
      {/* ボトムシート */}
      <div 
        className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-white rounded-t-3xl shadow-2xl transition-transform duration-500 ease-out z-20 ${
          showBottomSheet ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          minHeight: '50vh',
          width: '100%',
          maxWidth: '428px' // iPhone 14 Pro Max サイズ
        }}
      >
        {/* ボトムシートハンドル */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div className="px-6 pb-6">
          {/* ログイン説明 */}
          <div className="text-center mb-6 mt-2">
            <p className="text-gray-800 text-lg font-semibold mb-2">ようこそ！！</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              登録不要・LINEアカウントで、<br />
              誰でも簡単にシフトと案件を管理!
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="text-sm text-red-700 mb-2">{error}</div>
              <button
                type="button"
                className="text-xs text-red-600 hover:text-red-800"
                onClick={clearError}
              >
                閉じる
              </button>
            </div>
          )}

          {/* ログインボタン */}
          <div className="space-y-3">
            <button
              onClick={login}
              disabled={isLoading}
              className={`w-full py-4 text-lg font-medium rounded-xl text-white transition-all duration-200 transform ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#00B900] hover:bg-[#009900] hover:scale-105 active:scale-95'
              } shadow-lg`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ログイン中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                  LINEでログイン
                </div>
              )}
            </button>

            {/* Googleログインボタン（未実装・グレーアウト） */}
            <div className="relative">
              <button
                disabled
                className="w-full py-4 text-lg font-medium rounded-xl text-gray-400 bg-gray-200 cursor-not-allowed shadow-lg opacity-60"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Googleでログイン
                </div>
              </button>
              <div className="absolute bottom-1 right-2">
                <span className="text-xs text-gray-400 bg-white px-1 rounded">実装予定</span>
              </div>
            </div>

            {/* 利用規約 */}
            <div className="text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                ログインすることで、
                <a href="#" className="text-blue-600 hover:text-blue-700 underline">利用規約</a>
                および
                <a href="#" className="text-blue-600 hover:text-blue-700 underline">プライバシーポリシー</a>
                に同意したものとみなします。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineLogin;