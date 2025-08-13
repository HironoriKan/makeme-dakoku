import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings, Save, RotateCcw, AlertCircle, Check } from 'lucide-react';

interface AttendanceLogicConfig {
  normal_work_status: string;
  late_arrival_status: string;
  early_departure_status: string;
  absence_status: string;
  conflict_status: string;
}

interface AttendanceLogicSetting {
  id: string;
  setting_name: string;
  setting_key: string;
  setting_value: AttendanceLogicConfig;
  description: string;
  created_at: string;
  updated_at: string;
  applied_from: string;
}

const AttendanceLogicSettings: React.FC = () => {
  const [settings, setSettings] = useState<AttendanceLogicSetting | null>(null);
  const [config, setConfig] = useState<AttendanceLogicConfig>({
    normal_work_status: '通常勤務',
    late_arrival_status: '遅刻',
    early_departure_status: '早退',
    absence_status: '欠勤',
    conflict_status: '判定困難'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [appliedFrom, setAppliedFrom] = useState<string>('');

  const statusOptions = ['通常勤務', '遅刻', '早退', '欠勤', '判定困難'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('attendance_logic_settings')
        .select('*')
        .eq('setting_key', 'attendance_status_logic')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
        setConfig(data.setting_value);
        setAppliedFrom(new Date(data.applied_from).toISOString().slice(0, 16));
      } else {
        // デフォルト設定で新規作成
        setAppliedFrom(new Date().toISOString().slice(0, 16));
      }
    } catch (err) {
      console.error('設定取得エラー:', err);
      setError(err instanceof Error ? err.message : '設定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof AttendanceLogicConfig, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const appliedFromDate = new Date(appliedFrom).toISOString();
      
      if (settings) {
        // 既存設定を更新
        const { error } = await supabase
          .from('attendance_logic_settings')
          .update({
            setting_value: config,
            applied_from: appliedFromDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // 新規設定を作成
        const { error } = await supabase
          .from('attendance_logic_settings')
          .insert({
            setting_name: '勤怠ステータス判定ロジック',
            setting_key: 'attendance_status_logic',
            setting_value: config,
            applied_from: appliedFromDate,
            description: 'シフト時間と打刻時間の比較による自動ステータス判定設定'
          });

        if (error) throw error;
      }

      setSuccessMessage('設定を保存しました');
      await fetchSettings();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('設定保存エラー:', err);
      setError(err instanceof Error ? err.message : '設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      normal_work_status: '通常勤務',
      late_arrival_status: '遅刻',
      early_departure_status: '早退',
      absence_status: '欠勤',
      conflict_status: '判定困難'
    });
    setAppliedFrom(new Date().toISOString().slice(0, 16));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">勤怠ロジック設定</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>リセット</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </div>

      {/* エラー・成功メッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <div className="text-sm text-green-700">{successMessage}</div>
          </div>
        </div>
      )}

      {/* 設定フォーム */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">ステータス判定設定</h2>
          <p className="text-sm text-gray-600 mt-1">
            シフト時間と打刻時間の比較による自動ステータス判定のルールを設定します
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* 適用開始日時 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              適用開始日時 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={appliedFrom}
              onChange={(e) => setAppliedFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              この日時以降の勤怠データに新しい設定が適用されます
            </p>
          </div>

          {/* ステータス設定 */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                通常勤務
              </label>
              <select
                value={config.normal_work_status}
                onChange={(e) => handleConfigChange('normal_work_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">シフト時間通りまたは延長勤務の場合</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                遅刻
              </label>
              <select
                value={config.late_arrival_status}
                onChange={(e) => handleConfigChange('late_arrival_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">シフト開始時間より遅く打刻した場合</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                早退
              </label>
              <select
                value={config.early_departure_status}
                onChange={(e) => handleConfigChange('early_departure_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">シフト終了時間より早く退勤打刻した場合</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                欠勤
              </label>
              <select
                value={config.absence_status}
                onChange={(e) => handleConfigChange('absence_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">シフトはあるが打刻記録がない場合</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                判定困難
              </label>
              <select
                value={config.conflict_status}
                onChange={(e) => handleConfigChange('conflict_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">複数の条件が該当する場合や判定が困難な状況</p>
            </div>
          </div>
        </div>
      </div>

      {/* 現在の設定情報 */}
      {settings && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">現在の設定情報</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>作成日時: {new Date(settings.created_at).toLocaleString('ja-JP')}</p>
            <p>更新日時: {new Date(settings.updated_at).toLocaleString('ja-JP')}</p>
            <p>適用開始日時: {new Date(settings.applied_from).toLocaleString('ja-JP')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceLogicSettings;