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
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url('/images/メイクミー勤怠FV2.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      {/* ボトムシート */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-500 ease-out z-20 ${
          showBottomSheet ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ minHeight: '60vh' }}
      >
        {/* ボトムシートハンドル */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div className="px-6 pb-8">
          {/* サービスロゴ */}
          <div className="text-center mb-8 mt-4">
            <img 
              src="/images/MakeMeKINTAI-サービス名.png" 
              alt="Make Me KINTAI"
              className="mx-auto max-w-xs w-full h-auto"
              style={{ maxHeight: '120px' }}
            />
            <p className="text-gray-600 text-base mt-4">LINEアカウントでログイン</p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
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
          <div className="space-y-6">
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