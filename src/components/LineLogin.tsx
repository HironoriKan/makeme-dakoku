import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const LineLogin: React.FC = () => {
  const { login, error, isLoading, clearError } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-lg flex items-center justify-center mb-6" style={{ backgroundColor: '#CB8585' }}>
            <div className="text-white text-3xl font-bold">勤</div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">メイクミー勤怠</h2>
          <p className="text-gray-600">LINEアカウントでログインしてください</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="text-sm bg-red-100 text-red-800 rounded-md px-2 py-1 hover:bg-red-200 transition-colors"
                    onClick={clearError}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LINE Login Button */}
        <div className="space-y-4">
          <button
            onClick={login}
            disabled={isLoading}
            className={`w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white transition-all duration-200 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#00B900] hover:bg-[#009900] active:scale-95'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ログイン中...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 2.4.85 4.6 2.26 6.33L3 22l3.67-1.26C8.4 21.15 10.6 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-2.1 0-4.08-.68-5.68-1.84L4 19l.84-2.32C3.68 15.08 3 13.1 3 11c0-4.96 4.04-9 9-9s9 4.04 9 9-4.04 9-9 9z"/>
                  <circle cx="8" cy="12" r="1"/>
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="16" cy="12" r="1"/>
                </svg>
                LINEでログイン
              </div>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              ログインすることで、利用規約およびプライバシーポリシーに同意したものとみなします。
            </p>
          </div>
        </div>


      </div>
    </div>
  );
};

export default LineLogin;