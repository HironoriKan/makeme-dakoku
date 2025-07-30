import React, { useState } from 'react';
import { X, DollarSign, Users, Package, MessageSquare, CheckCircle } from 'lucide-react';
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
  notes: string;
}

const CheckoutReportModal: React.FC<CheckoutReportModalProps> = ({ isOpen, onClose, checkoutTime }) => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    sales: '',
    customerCount: '',
    itemsSold: '',
    notes: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        notes: reportData.notes.trim() || undefined,
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

  const handleClose = () => {
    setReportData({
      sales: '',
      customerCount: '',
      itemsSold: '',
      notes: ''
    });
    setIsSubmitted(false);
    setIsSubmitting(false);
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
              <h2 className="text-xl font-semibold text-gray-900">退勤報告</h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* フォーム */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 売上 */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 mr-2" style={{ color: '#CB8585' }} />
                  売上（円）
                </label>
                <input
                  type="number"
                  value={reportData.sales}
                  onChange={(e) => handleInputChange('sales', e.target.value)}
                  required
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
                  購入お客様数（人）
                </label>
                <input
                  type="number"
                  value={reportData.customerCount}
                  onChange={(e) => handleInputChange('customerCount', e.target.value)}
                  required
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
                  販売アイテム数（個）
                </label>
                <input
                  type="number"
                  value={reportData.itemsSold}
                  onChange={(e) => handleInputChange('itemsSold', e.target.value)}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CB8585] focus:border-transparent"
                  placeholder="例: 40"
                />
                <p className="text-xs text-gray-500 mt-1">販売した商品の総数を入力してください</p>
              </div>

              {/* 備考 */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 mr-2" style={{ color: '#CB8585' }} />
                  備考（任意）
                </label>
                <textarea
                  value={reportData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CB8585] focus:border-transparent resize-none"
                  placeholder="特記事項や気になったことがあれば記入してください"
                />
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-end space-x-3 pt-4">
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