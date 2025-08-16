import React, { useState, useEffect } from 'react';
import { Play, Calendar, Users, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { 
  Modal, 
  Button, 
  DateInput,
  Select,
  InfoPanel,
  Card,
  colors 
} from '../ui';
import { 
  ShiftTemplateWithLocation, 
  ApplyTemplateRequest, 
  ApplyTemplateResponse 
} from '../../types/batch-operations';
import ShiftTemplateService from '../../services/shiftTemplateService';

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ShiftTemplateWithLocation | null;
  onApplied: () => void;
}

const ApplyTemplateModal: React.FC<ApplyTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onApplied
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplyTemplateResponse | null>(null);

  // ユーザー一覧
  const [users, setUsers] = useState<Array<{ id: string; name: string; employee_number: number }>>([]);
  
  // 適用対象日の一覧（計算）
  const [targetDates, setTargetDates] = useState<string[]>([]);

  /**
   * モーダルが開かれた時の初期化
   */
  useEffect(() => {
    if (isOpen && template) {
      // 今日から1週間後までをデフォルト範囲とする
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(nextWeek.toISOString().split('T')[0]);
      setSelectedUserIds([]);
      setOverrideExisting(false);
      setError(null);
      setResult(null);
      
      fetchUsers();
    }
  }, [isOpen, template]);

  /**
   * 日付範囲が変更された時の対象日計算
   */
  useEffect(() => {
    if (startDate && endDate && template) {
      calculateTargetDates();
    }
  }, [startDate, endDate, template]);

  /**
   * ユーザー一覧取得
   */
  const fetchUsers = async () => {
    try {
      // TODO: UserService を使用してユーザー一覧を取得
      // 暫定的にダミーデータ
      setUsers([
        { id: '1', name: '山田太郎', employee_number: 1001 },
        { id: '2', name: '佐藤花子', employee_number: 1002 },
        { id: '3', name: '田中次郎', employee_number: 1003 },
        { id: '4', name: '鈴木美咲', employee_number: 1004 },
      ]);
    } catch (err) {
      console.error('ユーザー一覧取得エラー:', err);
    }
  };

  /**
   * 適用対象日の計算
   */
  const calculateTargetDates = () => {
    if (!startDate || !endDate || !template?.applicable_days) {
      setTargetDates([]);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // 日曜日を7に変換
      
      if (template.applicable_days.includes(dayOfWeek)) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }

    setTargetDates(dates);
  };

  /**
   * ユーザー選択変更
   */
  const handleUserSelection = (userId: string, selected: boolean) => {
    setSelectedUserIds(prev => 
      selected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  /**
   * 全ユーザー選択/解除
   */
  const handleSelectAllUsers = (selectAll: boolean) => {
    setSelectedUserIds(selectAll ? users.map(user => user.id) : []);
  };

  /**
   * テンプレート適用実行
   */
  const handleApplyTemplate = async () => {
    setError(null);

    // バリデーション
    if (selectedUserIds.length === 0) {
      setError('適用するユーザーを選択してください');
      return;
    }

    if (targetDates.length === 0) {
      setError('適用する日付がありません');
      return;
    }

    if (!template) {
      setError('テンプレートが選択されていません');
      return;
    }

    setLoading(true);
    try {
      const request: ApplyTemplateRequest = {
        template_id: template.id,
        target_user_ids: selectedUserIds,
        target_dates: targetDates,
        override_existing: overrideExisting,
      };

      const response = await ShiftTemplateService.applyTemplate(request);
      setResult(response);
      
      if (response.error_count === 0) {
        // 全て成功した場合は少し遅延してモーダルを閉じる
        setTimeout(() => {
          onApplied();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '適用に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 適用対象の総数計算
   */
  const totalTargets = selectedUserIds.length * targetDates.length;

  if (!template) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="シフトテンプレート適用"
      headerIcon={<Play className="w-6 h-6" />}
      showFooter
      customFooter={
        !result ? (
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              キャンセル
            </Button>
            <Button 
              variant="primary" 
              onClick={handleApplyTemplate} 
              loading={loading}
              disabled={selectedUserIds.length === 0 || targetDates.length === 0}
              leftIcon={<Play className="w-4 h-4" />}
            >
              適用実行 ({totalTargets}件)
            </Button>
          </div>
        ) : (
          <Button variant="primary" onClick={onClose}>
            閉じる
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* テンプレート情報 */}
        <Card variant="outlined">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-2">適用するテンプレート</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium">名前:</span>
                <span>{template.name}</span>
              </div>
              {template.description && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">説明:</span>
                  <span className="text-gray-600">{template.description}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="font-medium">拠点:</span>
                <span>{template.location?.name}</span>
              </div>
              {template.start_time && template.end_time && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">時間:</span>
                  <span>{template.start_time} - {template.end_time}</span>
                  {template.break_duration && (
                    <span className="text-gray-500">(休憩{template.break_duration}分)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* エラー表示 */}
        {error && (
          <InfoPanel
            type="error"
            message={error}
            closable
            onClose={() => setError(null)}
          />
        )}

        {/* 結果表示 */}
        {result && (
          <Card variant="outlined">
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-medium text-gray-900">適用結果</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.success_count}</div>
                  <div className="text-sm text-green-700">成功</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{result.error_count}</div>
                  <div className="text-sm text-red-700">エラー</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">エラー詳細</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-xs p-2 bg-red-50 rounded">
                        <span className="font-medium">{error.user_id}</span> - {error.date}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {!result && (
          <>
            {/* 適用期間設定 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                適用期間
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <DateInput
                  label="開始日"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  required
                />
                <DateInput
                  label="終了日"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  required
                />
              </div>

              {targetDates.length > 0 && (
                <InfoPanel
                  type="info"
                  message={`適用曜日の条件に基づき、${targetDates.length}日が対象となります`}
                />
              )}
            </div>

            {/* ユーザー選択 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  対象ユーザー
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="select-all-users"
                    checked={selectedUserIds.length === users.length}
                    onChange={(e) => handleSelectAllUsers(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: colors.primary[500] }}
                  />
                  <label htmlFor="select-all-users" className="text-sm font-medium">
                    全選択
                  </label>
                </div>
              </div>

              <Card variant="outlined">
                <div className="p-4 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-2">
                    {users.map(user => (
                      <label
                        key={user.id}
                        className={`
                          flex items-center p-3 rounded-lg border cursor-pointer transition-all
                          ${selectedUserIds.includes(user.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                          className="mr-3 rounded"
                          style={{ accentColor: colors.primary[500] }}
                        />
                        <div className="flex-1">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            #{user.employee_number}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* オプション設定 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">オプション</h3>
              
              <label className="flex items-start space-x-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <input
                  type="checkbox"
                  checked={overrideExisting}
                  onChange={(e) => setOverrideExisting(e.target.checked)}
                  className="mt-1 rounded"
                  style={{ accentColor: colors.warning[500] }}
                />
                <div>
                  <div className="font-medium text-yellow-800">既存シフトを上書き</div>
                  <div className="text-sm text-yellow-700">
                    既にシフトが設定されている日付についても、テンプレートの内容で上書きします
                  </div>
                </div>
              </label>
            </div>

            {/* 適用概要 */}
            {totalTargets > 0 && (
              <Card style={{ backgroundColor: colors.primary[50] }}>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">適用概要</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">対象ユーザー:</span>
                      <span className="font-medium ml-1">{selectedUserIds.length}人</span>
                    </div>
                    <div>
                      <span className="text-gray-600">対象日数:</span>
                      <span className="font-medium ml-1">{targetDates.length}日</span>
                    </div>
                    <div>
                      <span className="text-gray-600">総作成数:</span>
                      <span className="font-medium ml-1">{totalTargets}件</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ApplyTemplateModal;