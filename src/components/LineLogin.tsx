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
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15h-2v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95 0-5.52-4.48-10-10-10z"/>
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

        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">初回セットアップが必要です</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  LINEログインを使用するには、以下の環境変数の設定が必要です：
                </p>
                <ul className="mt-2 list-disc list-inside">
                  <li><code className="text-xs bg-blue-100 px-1 rounded">VITE_LINE_CHANNEL_ID</code></li>
                  <li><code className="text-xs bg-blue-100 px-1 rounded">VITE_LINE_REDIRECT_URI</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineLogin;