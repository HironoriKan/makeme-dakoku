import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LineLogin: React.FC = () => {
  const { login, error, isLoading, clearError } = useAuth();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // コンポーネントマウント後にボトムシートをアニメーション表示
    const timer = setTimeout(() => {
      setShowBottomSheet(true);
    }, 300);
    
    // ログインボタンを遅延表示
    const buttonTimer = setTimeout(() => {
      setShowLoginButton(true);
      // パーティクルを生成
      generateParticles();
    }, 800);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(buttonTimer);
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
    };
  }, []);

  // パーティクル生成
  const generateParticles = () => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  };

  // リップル効果
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);

    // リップルを自動削除
    rippleTimeoutRef.current = setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // ハプティックフィードバック（サポートされている場合）
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // ログインボタンクリックハンドラー
  const handleLogin = (event: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(event);
    triggerHapticFeedback();
    login();
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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/30 to-green-900/20"></div>
      
      {/* パーティクル背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animation: `float 4s infinite ease-in-out ${particle.delay}s`
            }}
          />
        ))}
      </div>
      
      {/* CSSアニメーション */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.7; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 185, 0, 0.4); }
          50% { box-shadow: 0 0 40px rgba(0, 185, 0, 0.8), 0 0 60px rgba(0, 185, 0, 0.4); }
        }
        .ripple-effect {
          animation: ripple 0.6s linear;
        }
        .shimmer-effect {
          background: linear-gradient(110deg, 
            rgba(255, 255, 255, 0) 20%, 
            rgba(255, 255, 255, 0.3) 40%, 
            rgba(255, 255, 255, 0.3) 60%, 
            rgba(255, 255, 255, 0) 80%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
      
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
        className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-white via-gray-50 to-white rounded-t-3xl shadow-2xl transition-all duration-700 ease-out z-20 ${
          showBottomSheet ? 'translate-y-0 scale-100' : 'translate-y-full scale-95'
        }`}
        style={{ 
          minHeight: '50vh',
          width: '100%',
          maxWidth: '428px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* ボトムシートハンドル */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-green-400 rounded-full animate-pulse"></div>
        </div>
        
        {/* グラデーション装飾 */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-100/20 via-blue-100/20 to-transparent rounded-t-3xl pointer-events-none"></div>

        <div className="px-6 pb-6">
          {/* ログイン説明 */}
          <div className="text-center mb-6 mt-2 relative">
            <div className="relative inline-block">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-3 animate-pulse">
                ようこそ！✨
              </h2>
              <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-purple-200 via-blue-200 to-green-200 rounded-lg opacity-20 blur-sm"></div>
            </div>
            <p className="text-gray-700 text-base leading-relaxed font-medium mb-2">
              <span className="inline-block animate-bounce">🚀</span> 登録不要・LINEアカウントで
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              誰でも簡単にシフトと案件を管理できます！
            </p>
            
            {/* フローティング装飾アイコン */}
            <div className="absolute -top-4 -left-4 text-yellow-400 text-xl animate-spin" style={{ animationDuration: '3s' }}>⭐</div>
            <div className="absolute -top-2 -right-6 text-pink-400 text-lg animate-bounce" style={{ animationDelay: '0.5s' }}>💫</div>
            <div className="absolute -bottom-2 left-4 text-blue-400 text-sm animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="relative bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4 mb-4 shadow-lg animate-pulse">
              <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl opacity-20 blur-sm"></div>
              <div className="relative z-10">
                <div className="flex items-start space-x-2">
                  <span className="text-red-500 text-xl animate-bounce">⚠️</span>
                  <div className="flex-1">
                    <div className="text-sm text-red-700 font-medium mb-2">{error}</div>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 bg-red-100 hover:bg-red-200 rounded-full transition-all duration-200"
                      onClick={clearError}
                    >
                      閉じる ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🚀 限界を超えてリッチなログインボタン */}
          <div className="space-y-4">
            <div 
              className={`relative transform transition-all duration-300 ${
                showLoginButton ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
              }`}
            >
              <button
                ref={buttonRef}
                onClick={handleLogin}
                disabled={isLoading}
                className={`
                  relative w-full py-5 text-xl font-bold rounded-2xl text-white 
                  transition-all duration-300 transform overflow-hidden
                  ${isLoading
                    ? 'bg-gray-400 cursor-not-allowed scale-95'
                    : 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 hover:scale-[1.02] active:scale-95 cursor-pointer'
                  }
                  shadow-2xl hover:shadow-green-500/30
                `}
                style={{
                  background: !isLoading ? 'linear-gradient(135deg, #00B900, #00A000, #00B900, #00C000)' : undefined,
                  backgroundSize: !isLoading ? '300% 300%' : undefined,
                  animation: !isLoading ? 'pulse-glow 2s infinite, shimmer 3s infinite' : undefined,
                }}
              >
                {/* リップル効果 */}
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="absolute bg-white/30 rounded-full ripple-effect pointer-events-none"
                    style={{
                      left: ripple.x - 10,
                      top: ripple.y - 10,
                      width: 20,
                      height: 20,
                    }}
                  />
                ))}
                
                {/* シマー効果 */}
                {!isLoading && (
                  <div className="absolute inset-0 shimmer-effect pointer-events-none"></div>
                )}
                
                {/* フローティング装飾 */}
                <div className="absolute top-2 left-4 text-white/20 text-sm animate-pulse" style={{ animationDelay: '0s' }}>✨</div>
                <div className="absolute top-3 right-8 text-white/20 text-xs animate-bounce" style={{ animationDelay: '1s' }}>⭐</div>
                <div className="absolute bottom-2 right-4 text-white/20 text-sm animate-ping" style={{ animationDelay: '0.5s' }}>💫</div>
                
                {/* ボタンコンテンツ */}
                <div className="relative z-10">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        <div className="absolute top-0 left-0 w-6 h-6 border-4 border-transparent border-t-green-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                      </div>
                      <span className="font-bold text-lg animate-pulse">ログイン中... 🚀</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="relative">
                        <svg className="w-8 h-8 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                      </div>
                      <span className="font-black text-xl drop-shadow-sm tracking-wide">
                        🎯 LINEでログイン
                      </span>
                      <div className="text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>
                        🚀
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 3Dエフェクト用のボーダー */}
                <div className="absolute inset-0 rounded-2xl border-2 border-white/20 pointer-events-none"></div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-white/10 pointer-events-none"></div>
              </button>
              
              {/* グロー効果 */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-2xl opacity-20 blur animate-pulse"></div>
            </div>

            {/* Googleログインボタン（未実装・リッチな未来予告版） */}
            <div className="relative group">
              <button
                disabled
                className="relative w-full py-4 text-lg font-semibold rounded-xl text-gray-500 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 cursor-not-allowed shadow-lg border-2 border-gray-200 overflow-hidden transition-all duration-300"
              >
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Googleでログイン</span>
                  <span className="text-sm">🔮</span>
                </div>
                
                {/* 未来予告エフェクト */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              
              {/* 3D未来予告バッジ */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12 animate-pulse">
                <span className="drop-shadow-sm">Coming Soon! 🚀</span>
              </div>
            </div>

            {/* リッチな利用規約 */}
            <div className="text-center mt-6 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl border border-purple-200/50">
              <div className="flex justify-center mb-2">
                <span className="text-lg animate-bounce">📋</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                ログインすることで、
                <a 
                  href="#" 
                  className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-2 underline-offset-2 hover:decoration-blue-300 transition-all duration-200"
                >
                  利用規約
                </a>
                および
                <a 
                  href="#" 
                  className="text-purple-600 hover:text-purple-700 font-semibold underline decoration-2 underline-offset-2 hover:decoration-purple-300 transition-all duration-200"
                >
                  プライバシーポリシー
                </a>
                <br />
                に同意したものとみなします。
              </p>
              <div className="mt-2 flex justify-center space-x-2 text-xs">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">🔒 安全</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">📱 簡単</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">⚡ 高速</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineLogin;