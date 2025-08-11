import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LineLogin: React.FC = () => {
  const { login, error, isLoading, clearError } = useAuth();


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* メインコンテンツカード */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-slate-800 via-gray-700 to-slate-600 bg-clip-text text-transparent mb-4 tracking-tight whitespace-nowrap">
              メイクミー勤怠
            </h1>
            <p className="text-gray-600 text-base">LINEアカウントでログイン</p>
          </div>

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

          <div className="space-y-6">
            <button
              onClick={login}
              disabled={isLoading}
              className={`w-full py-4 text-lg font-medium rounded-xl text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#00B900] hover:bg-[#009900]'
              }`}
            >
              {isLoading ? 'ログイン中...' : 'LINEでログイン'}
            </button>

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