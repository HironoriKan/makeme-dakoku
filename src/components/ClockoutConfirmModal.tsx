import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';

interface ClockoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hasExtraWork: boolean, overtimeMinutes?: number, earlyStartMinutes?: number) => void;
  onCancel: () => void;
}

const ClockoutConfirmModal: React.FC<ClockoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel
}) => {
  const [hasExtraWork, setHasExtraWork] = useState(false);
  const [showExtraWorkForm, setShowExtraWorkForm] = useState(false);
  const [overtimeHours, setOvertimeHours] = useState('');
  const [overtimeMinutes, setOvertimeMinutes] = useState('');
  const [earlyStartHours, setEarlyStartHours] = useState('');
  const [earlyStartMinutes, setEarlyStartMinutes] = useState('');

  if (!isOpen) return null;

  const handleExtraWorkResponse = (response: boolean) => {
    setHasExtraWork(response);
    if (response) {
      setShowExtraWorkForm(true);
    } else {
      onConfirm(false);
    }
  };

  const handleSubmitExtraWork = () => {
    const overtimeTotalMinutes = parseInt(overtimeHours || '0') * 60 + parseInt(overtimeMinutes || '0');
    const earlyStartTotalMinutes = parseInt(earlyStartHours || '0') * 60 + parseInt(earlyStartMinutes || '0');
    
    onConfirm(true, overtimeTotalMinutes, earlyStartTotalMinutes);
  };

  const resetForm = () => {
    setHasExtraWork(false);
    setShowExtraWorkForm(false);
    setOvertimeHours('');
    setOvertimeMinutes('');
    setEarlyStartHours('');
    setEarlyStartMinutes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">退勤確認</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showExtraWorkForm ? (
          <div>
            <p className="text-gray-700 mb-6">
              残業などシフト外での稼働はありましたか？
            </p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => handleExtraWorkResponse(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                はい
              </button>
              <button
                onClick={() => handleExtraWorkResponse(false)}
                className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                いいえ
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              対象の時間を記録してください
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              ※任意入力です。該当する場合のみ入力してください。
            </p>

            <div className="space-y-4">
              {/* 残業時間 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ① 残業した時間
                </label>
                <div className="flex items-center justify-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(e.target.value)}
                    placeholder="0"
                    className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                  />
                  <span className="text-sm text-gray-600">時間</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={overtimeMinutes}
                    onChange={(e) => setOvertimeMinutes(e.target.value)}
                    placeholder="0"
                    className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                  />
                  <span className="text-sm text-gray-600">分</span>
                </div>
              </div>

              {/* 早出時間 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ② シフトより早く稼働した時間
                </label>
                <div className="flex items-center justify-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={earlyStartHours}
                    onChange={(e) => setEarlyStartHours(e.target.value)}
                    placeholder="0"
                    className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                  />
                  <span className="text-sm text-gray-600">時間</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={earlyStartMinutes}
                    onChange={(e) => setEarlyStartMinutes(e.target.value)}
                    placeholder="0"
                    className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                  />
                  <span className="text-sm text-gray-600">分</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3 mt-6">
              <button
                onClick={handleSubmitExtraWork}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                提出
              </button>
              <button
                onClick={handleCancel}
                className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockoutConfirmModal;