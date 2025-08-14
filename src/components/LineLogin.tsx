import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LineLogin: React.FC = () => {
  const { login, error, isLoading, clearError } = useAuth();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0, sheetY: 0 });
  const [sheetPosition, setSheetPosition] = useState(0);
  const bottomSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // オーバースクロールを無効化
    document.body.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    
    // クリーンアップ
    return () => {
      document.body.style.overscrollBehavior = '';
      document.body.style.overflow = '';
    };
  }, []);

  const handleShowBottomSheet = () => {
    setShowBottomSheet(true);
    setSheetPosition(0);
  };

  const handleHideBottomSheet = () => {
    setShowBottomSheet(false);
    setSheetPosition(0);
  };

  // タッチ開始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!bottomSheetRef.current) return;
    
    const touch = e.touches[0];
    const rect = bottomSheetRef.current.getBoundingClientRect();
    
    setIsDragging(true);
    setDragStart({
      y: touch.clientY,
      sheetY: sheetPosition
    });
  };

  // タッチ移動
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !bottomSheetRef.current) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStart.y;
    const newPosition = Math.max(0, dragStart.sheetY + deltaY);
    
    setSheetPosition(newPosition);
  };

  // タッチ終了
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // 50px以上下にドラッグした場合は閉じる
    if (sheetPosition > 50) {
      handleHideBottomSheet();
    } else {
      // 元の位置に戻す
      setSheetPosition(0);
    }
  };

  // 背景タップで閉じる
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleHideBottomSheet();
    }
  };

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
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center pt-12 sm:pt-20">
        <img 
          src="/images/MakeMeKINTAI-サービス名2.png" 
          alt="Make Me KINTAI"
          className="w-4/5 h-auto object-contain mb-8"
          style={{ 
            maxWidth: '342px', // 428px * 0.8 = 342.4px
            aspectRatio: 'auto'
          }}
        />
        
        {/* CTAボタン（ボトムシートを表示するトリガー） */}
        <div className="mt-4 relative">
          <div id="btn_animation">
            <button
              onClick={handleShowBottomSheet}
              className="btn relative block w-[200px] h-[78px] leading-[78px] text-2xl rounded-[39px] no-underline text-white text-center transition-all duration-200"
              style={{
                backgroundColor: '#63d4db',
                color: '#fbfbfb'
              }}
            >
              サインイン
            </button>
          </div>
        </div>

        {/* アニメーション用CSS */}
        <style jsx>{`
          #btn_animation .btn::before, 
          #btn_animation .btn::after {
            content: "";
            position: absolute;
            z-index: -10;
            width: 200px;
            height: 78px;
            top: 0;
            left: 0;
            border-radius: 39px;
            background: #a6f9ff;
            transform: translate3d(0, 0, 0);
          }

          #btn_animation .btn::before {
            animation: anime 2s ease-out infinite;
          }

          #btn_animation .btn::after {
            animation: anime 2s ease-out 2s infinite;
          }

          @keyframes anime {
            0% {
              transform: scale(0.95);
              opacity: 1;
            }
            90% {
              opacity: 0.1;
            }
            100% {
              transform: scale(1.2, 1.4);
              opacity: 0;
            }
          }
        `}</style>
      </div>
      
      {/* ボトムシート背景オーバーレイ */}
      {showBottomSheet && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-15 transition-opacity duration-300 ${
            showBottomSheet ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleBackgroundClick}
        />
      )}

      {/* ボトムシート */}
      <div 
        ref={bottomSheetRef}
        className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-white rounded-t-3xl shadow-2xl z-20 ${
          isDragging ? '' : 'transition-transform duration-300 ease-out'
        } ${showBottomSheet ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ 
          minHeight: '50vh',
          width: '100%',
          maxWidth: '428px', // iPhone 14 Pro Max サイズ
          transform: `translateX(-50%) translateY(${showBottomSheet ? sheetPosition : 100}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ボトムシートハンドル */}
        <div className="flex justify-center pt-4 pb-2 cursor-pointer" onClick={handleHideBottomSheet}>
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
          <div className="space-y-4">
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

            {/* Googleログインボタン（未実装） */}
            <div className="relative">
              <button
                disabled
                className="w-full py-4 text-lg font-medium rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed border border-gray-300 opacity-60"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2 opacity-50" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#cccccc"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#cccccc"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#cccccc"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#cccccc"/>
                  </svg>
                  Googleでログイン
                </div>
              </button>
              
              {/* Coming Soon バッジ（控えめに） */}
              <div className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs px-2 py-1 rounded-full">
                Coming Soon
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