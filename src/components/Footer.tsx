import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8" style={{ backgroundColor: '#9c9c9c' }}>
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="text-left space-y-2">
          {/* App Name */}
          <div>
            <h3 className="text-sm font-medium text-white">メイクミー勤怠</h3>
          </div>
          
          {/* Links */}
          <div className="space-y-1">
            <a 
              href="#" 
              className="block text-xs text-white hover:text-gray-200 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // プライバシーポリシーのモーダルなどを開く処理
              }}
            >
              プライバシーポリシー
            </a>
            <a 
              href="#" 
              className="block text-xs text-white hover:text-gray-200 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // 利用規約のモーダルなどを開く処理
              }}
            >
              利用規約
            </a>
            <a 
              href="#" 
              className="block text-xs text-white hover:text-gray-200 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // お問い合わせフォームなどを開く処理
              }}
            >
              お問い合わせ
            </a>
          </div>

          {/* Copyright */}
          <div className="pt-2 border-t border-gray-400">
            <p className="text-xs text-white">
              © {currentYear} Make Me Team. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;