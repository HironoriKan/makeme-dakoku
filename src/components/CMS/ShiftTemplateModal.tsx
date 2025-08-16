import React, { useState, useEffect } from 'react';
import { Save, X, Clock, MapPin } from 'lucide-react';
import { 
  Modal, 
  Input, 
  Select, 
  TimeInput, 
  NumberInput,
  Textarea,
  Button,
  colors 
} from '../ui';
import { 
  CreateShiftTemplateRequest, 
  ShiftTemplateWithLocation, 
  ShiftType 
} from '../../types/batch-operations';

interface ShiftTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateShiftTemplateRequest) => Promise<void>;
  initialData?: ShiftTemplateWithLocation | null;
  title: string;
}

const ShiftTemplateModal: React.FC<ShiftTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  title
}) => {
  const [formData, setFormData] = useState<CreateShiftTemplateRequest>({
    name: '',
    description: '',
    location_id: '',
    shift_type: 'normal',
    start_time: '',
    end_time: '',
    break_duration: 60,
    break_start_time: '',
    applicable_days: [1, 2, 3, 4, 5, 6, 7], // 全曜日
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Array<{ id: string; name: string; code: string }>>([]);

  // 曜日選択用のオプション
  const dayOptions = [
    { value: 1, label: '月' },
    { value: 2, label: '火' },
    { value: 3, label: '水' },
    { value: 4, label: '木' },
    { value: 5, label: '金' },
    { value: 6, label: '土' },
    { value: 7, label: '日' },
  ];

  /**
   * 初期データ設定
   */
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description || '',
          location_id: initialData.location_id,
          shift_type: initialData.shift_type,
          start_time: initialData.start_time || '',
          end_time: initialData.end_time || '',
          break_duration: initialData.break_duration || 60,
          break_start_time: initialData.break_start_time || '',
          applicable_days: initialData.applicable_days || [1, 2, 3, 4, 5, 6, 7],
        });
      } else {
        // 新規作成時の初期値
        setFormData({
          name: '',
          description: '',
          location_id: '',
          shift_type: 'normal',
          start_time: '09:00',
          end_time: '18:00',
          break_duration: 60,
          break_start_time: '12:00',
          applicable_days: [1, 2, 3, 4, 5, 6, 7],
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  /**
   * 拠点一覧取得
   */
  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    try {
      // TODO: LocationService を使用して拠点一覧を取得
      // 暫定的にダミーデータ
      setLocations([
        { id: '1', name: '新宿店', code: 'SJK' },
        { id: '2', name: '渋谷店', code: 'SBY' },
        { id: '3', name: '池袋店', code: 'IKB' },
      ]);
    } catch (err) {
      console.error('拠点一覧取得エラー:', err);
    }
  };

  /**
   * フォーム入力変更
   */
  const handleInputChange = (field: keyof CreateShiftTemplateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  /**
   * 曜日選択変更
   */
  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      applicable_days: prev.applicable_days?.includes(day)
        ? prev.applicable_days.filter(d => d !== day)
        : [...(prev.applicable_days || []), day].sort()
    }));
  };

  /**
   * 全曜日選択/解除
   */
  const handleAllDaysToggle = () => {
    const allDays = [1, 2, 3, 4, 5, 6, 7];
    setFormData(prev => ({
      ...prev,
      applicable_days: prev.applicable_days?.length === 7 ? [] : allDays
    }));
  };

  /**
   * フォーム保存
   */
  const handleSave = async () => {
    setError(null);

    // バリデーション
    if (!formData.name.trim()) {
      setError('テンプレート名を入力してください');
      return;
    }

    if (!formData.location_id) {
      setError('拠点を選択してください');
      return;
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      setError('終了時間は開始時間より後にしてください');
      return;
    }

    if (!formData.applicable_days || formData.applicable_days.length === 0) {
      setError('適用曜日を最低1つ選択してください');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * シフトタイプ別のプリセット適用
   */
  const applyPreset = (shiftType: ShiftType) => {
    const presets = {
      early: {
        start_time: '08:00',
        end_time: '17:00',
        break_start_time: '12:00',
      },
      normal: {
        start_time: '09:00',
        end_time: '18:00',
        break_start_time: '12:30',
      },
      late: {
        start_time: '13:00',
        end_time: '22:00',
        break_start_time: '17:00',
      },
      off: {
        start_time: '',
        end_time: '',
        break_start_time: '',
      },
    };

    const preset = presets[shiftType];
    setFormData(prev => ({
      ...prev,
      shift_type: shiftType,
      ...preset,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={title}
      headerIcon={<Clock className="w-6 h-6" />}
      showFooter
      customFooter={
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            キャンセル
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            loading={loading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            保存
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 基本情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
          
          <Input
            label="テンプレート名"
            placeholder="例: A店舗早番パターン"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            fullWidth
          />

          <Textarea
            label="説明"
            placeholder="テンプレートの説明を入力（任意）"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={2}
            fullWidth
          />

          <Select
            label="拠点"
            value={formData.location_id}
            onChange={(e) => handleInputChange('location_id', e.target.value)}
            required
            fullWidth
          >
            <option value="">拠点を選択</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name} ({location.code})
              </option>
            ))}
          </Select>
        </div>

        {/* シフト設定 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">シフト設定</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              シフトタイプ
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'early', label: '早番', color: colors.success[500] },
                { value: 'normal', label: '通常', color: colors.primary[500] },
                { value: 'late', label: '遅番', color: colors.warning[500] },
                { value: 'off', label: '休み', color: colors.gray[500] },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => applyPreset(option.value as ShiftType)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.shift_type === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span 
                    className="block w-3 h-3 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.shift_type !== 'off' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <TimeInput
                  label="開始時間"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  fullWidth
                />
                <TimeInput
                  label="終了時間"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="休憩時間（分）"
                  value={formData.break_duration}
                  onChange={(e) => handleInputChange('break_duration', parseInt(e.target.value) || 0)}
                  min={0}
                  max={480}
                  fullWidth
                />
                <TimeInput
                  label="休憩開始時間"
                  value={formData.break_start_time}
                  onChange={(e) => handleInputChange('break_start_time', e.target.value)}
                  fullWidth
                />
              </div>
            </>
          )}
        </div>

        {/* 適用曜日 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">適用曜日</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="all-days"
                checked={formData.applicable_days?.length === 7}
                onChange={handleAllDaysToggle}
                className="rounded"
                style={{ accentColor: colors.primary[500] }}
              />
              <label htmlFor="all-days" className="text-sm font-medium text-gray-700">
                全曜日選択
              </label>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dayOptions.map(day => (
                <label
                  key={day.value}
                  className={`
                    flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${formData.applicable_days?.includes(day.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.applicable_days?.includes(day.value) || false}
                    onChange={() => handleDayToggle(day.value)}
                    className="mb-1 rounded"
                    style={{ accentColor: colors.primary[500] }}
                  />
                  <span className="text-sm font-medium">{day.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* プレビュー */}
        {formData.start_time && formData.end_time && formData.shift_type !== 'off' && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">プレビュー</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4 text-sm">
                <span className="font-medium">勤務時間:</span>
                <span>{formData.start_time} - {formData.end_time}</span>
                {formData.break_duration && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span>休憩: {formData.break_duration}分</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm mt-2">
                <span className="font-medium">適用曜日:</span>
                <span>
                  {formData.applicable_days?.map(day => 
                    dayOptions.find(opt => opt.value === day)?.label
                  ).join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShiftTemplateModal;