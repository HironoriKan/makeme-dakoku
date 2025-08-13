import React, { useState } from 'react';
import { X, DollarSign, Users, Package, CheckCircle, ChevronRight } from 'lucide-react';
import { DailyReportService, DailyReportData } from '../services/dailyReportService';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutTime: string | null;
}

interface ReportData {
  sales: string;
  customerCount: string;
  itemsSold: string;
}

const CheckoutReportModal: React.FC<CheckoutReportModalProps> = ({ isOpen, onClose, checkoutTime }) => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    sales: '',
    customerCount: '',
    itemsSold: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);

  // モーダルが開かれた時に既存の日報をチェック
  React.useEffect(() => {
    const checkExistingReport = async () => {
      if (!isOpen || !user) return;
      
      try {
        const todayReport = await DailyReportService.getTodayReport(user);
        if (todayReport) {
          setExistingReport(todayReport);
          // 既存データをフォームの初期値として設定
          setReportData({
            sales: todayReport.sales_amount > 0 ? todayReport.sales_amount.toString() : '',
            customerCount: todayReport.customer_count > 0 ? todayReport.customer_count.toString() : '',
            itemsSold: todayReport.items_sold > 0 ? todayReport.items_sold.toString() : ''
          });
        } else {
          // 既存データがない場合は空にリセット
          setReportData({
            sales: '',
            customerCount: '',
            itemsSold: ''
          });
        }
      } catch (error) {
        console.error('既存日報チェックエラー:', error);
      }
    };

    checkExistingReport();
  }, [isOpen, user]);

  const handleInputChange = (field: keyof ReportData, value: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('ユーザー情報が見つかりません');
      return;
    }

    setIsSubmitting(true);

    try {
      // フォームデータをDailyReportData形式に変換
      const dailyReportData: DailyReportData = {
        salesAmount: parseInt(reportData.sales) || 0,
        customerCount: parseInt(reportData.customerCount) || 0,
        itemsSold: parseInt(reportData.itemsSold) || 0,
        notes: undefined, // 備考は削除
        checkoutTime: checkoutTime || new Date().toISOString() // 退勤時刻を記録
      };

      // Supabaseに報告データを保存
      console.log('退勤報告データをDBに保存:', dailyReportData);
      await DailyReportService.createDailyReport(user, dailyReportData);
      
      setIsSubmitted(true);
      
      // 3秒後にモーダルを閉じる
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('報告送信エラー:', error);
      const message = error instanceof Error ? error.message : '報告の送信に失敗しました';
      alert(`エラー: ${message}`);
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // スキップ時は何も記録せずに完了画面に遷移
    setIsSubmitted(true);
    // 3秒後にモーダルを閉じる
    setTimeout(() => {
      handleClose();
    }, 3000);
  };

  const handleClose = () => {
    setReportData({
      sales: '',
      customerCount: '',
      itemsSold: ''
    });
    setIsSubmitted(false);
    setIsSubmitting(false);
    setExistingReport(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {!isSubmitted ? (
          <>
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">日報登録</h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* スキップ案内 */}
            <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                日報の登録は任意です。入力したい項目がある場合のみご記入ください。
              </p>
            </div>

            {/* 既存日報の警告メッセージ */}
            {existingReport && (
              <div className="mx-6 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">既存の日報があります</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>本日分の日報は既に登録済みです。</p>
                      <p className="mt-1">
                        <strong>売上:</strong> ¥{existingReport.sales_amount?.toLocaleString() || '0'}、
                        <strong>お客様:</strong> {existingReport.customer_count || 0}人、
                        <strong>アイテム:</strong> {existingReport.items_sold || 0}個
                      </p>
                      <p className="mt-1 text-xs">
                        ※ 入力欄に既存データが設定されています。編集して上書きできます。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* フォーム */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 売上 */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 mr-2" style={{ color: '#CB8585' }} />
                  売上（円）<span className="text-xs text-gray-500 ml-1">※任意</span>
                </label>
                <input
                  type="number"
                  value={reportData.sales}
                  onChange={(e) => handleInputChange('sales', e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CB8585] focus:border-transparent"
                  placeholder="例: 150000"
                />
                <p className="text-xs text-gray-500 mt-1">本日の総売上金額を入力してください</p>
              </div>

              {/* 購入お客様数 */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 mr-2" style={{ color: '#CB8585' }} />
                  購入お客様数（人）<span className="text-xs text-gray-500 ml-1">※任意</span>
                </label>
                <input
                  type="number"
                  value={reportData.customerCount}
                  onChange={(e) => handleInputChange('customerCount', e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CB8585] focus:border-transparent"
                  placeholder="例: 25"
                />
                <p className="text-xs text-gray-500 mt-1">商品を購入されたお客様の人数を入力してください</p>
              </div>

              {/* 販売アイテム数 */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 mr-2" style={{ color: '#CB8585' }} />
                  販売アイテム数（個）<span className="text-xs text-gray-500 ml-1">※任意</span>
                </label>
                <input
                  type="number"
                  value={reportData.itemsSold}
                  onChange={(e) => handleInputChange('itemsSold', e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CB8585] focus:border-transparent"
                  placeholder="例: 40"
                />
                <p className="text-xs text-gray-500 mt-1">販売した商品の総数を入力してください</p>
              </div>


              {/* 送信ボタン */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  スキップ
                </button>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#CB8585' }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = '#B87575';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = '#CB8585';
                      }
                    }}
                  >
                    {isSubmitting ? '送信中...' : '提出'}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          /* 送信完了画面 */
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E8' }}>
              <CheckCircle className="w-8 h-8" style={{ color: '#059669' }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">報告完了</h3>
            <p className="text-gray-600 mb-4">本日の業務報告を受け付けました。</p>
            <div className="text-2xl font-medium mb-6" style={{ color: '#CB8585' }}>
              お疲れ様でした！
            </div>
            <p className="text-sm text-gray-500">このメッセージは自動的に閉じられます</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutReportModal;