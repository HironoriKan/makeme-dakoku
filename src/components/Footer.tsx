import React from 'react';
import { Heart, Clock } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* App Info */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{backgroundColor: '#CB8585'}}>
              <Clock className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">メイクミー勤怠</span>
          </div>
          <p className="text-xs text-gray-500">スマートな勤怠管理システム</p>
        </div>

        {/* Links */}
        <div className="flex justify-center space-x-6 mb-4">
          <a 
            href="#" 
            className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // プライバシーポリシーのモーダルなどを開く処理
            }}
          >
            プライバシーポリシー
          </a>
          <a 
            href="#" 
            className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // 利用規約のモーダルなどを開く処理
            }}
          >
            利用規約
          </a>
          <a 
            href="#" 
            className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // お問い合わせフォームなどを開く処理
            }}
          >
            お問い合わせ
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <span className="text-xs text-gray-500">Made with</span>
            <Heart className="w-3 h-3 text-red-500 fill-current" />
            <span className="text-xs text-gray-500">by Make Me Team</span>
          </div>
          <p className="text-xs text-gray-400">
            © {currentYear} Make Me 勤怠. All rights reserved.
          </p>
        </div>

        {/* Version Info */}
        <div className="text-center mt-3">
          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
            v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;