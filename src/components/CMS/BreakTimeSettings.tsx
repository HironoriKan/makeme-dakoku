import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, Save, RotateCcw, AlertCircle, Check, Plus, Trash2, MapPin } from 'lucide-react';

interface BreakTimeRule {
  min_work_hours: number;
  max_work_hours: number;
  break_minutes: number;
  description: string;
}

interface BreakTimeSetting {
  id: string;
  location_id: string | null;
  setting_name: string;
  break_rules: BreakTimeRule[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  applied_from: string;
  location?: {
    name: string;
    code: string;
  };
}

interface Location {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

const BreakTimeSettings: React.FC = () => {
  const [settings, setSettings] = useState<BreakTimeSetting[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingSetting, setEditingSetting] = useState<BreakTimeSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchLocations();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('break_time_settings')
        .select(`
          *,
          location:locations(name, code)
        `)
        .eq('is_active', true)
        .order('location_id', { ascending: true, nullsFirst: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('設定取得エラー:', err);
      setError(err instanceof Error ? err.message : '設定の取得に失敗しました');
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, code, is_active')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error('拠点取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (setting: BreakTimeSetting) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const appliedFromDate = new Date(setting.applied_from).toISOString();
      
      if (setting.id && setting.id !== 'new') {
        // 既存設定を更新
        const { error } = await supabase
          .from('break_time_settings')
          .update({
            setting_name: setting.setting_name,
            break_rules: setting.break_rules,
            applied_from: appliedFromDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', setting.id);

        if (error) throw error;
      } else {
        // 新規設定を作成
        const { error } = await supabase
          .from('break_time_settings')
          .insert({
            location_id: setting.location_id,
            setting_name: setting.setting_name,
            break_rules: setting.break_rules,
            applied_from: appliedFromDate,
            is_active: true
          });

        if (error) throw error;
      }

      setSuccessMessage('設定を保存しました');
      setEditingSetting(null);
      setShowCreateForm(false);
      await fetchSettings();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('設定保存エラー:', err);
      setError(err instanceof Error ? err.message : '設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (settingId: string) => {
    if (!confirm('この設定を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('break_time_settings')
        .update({ is_active: false })
        .eq('id', settingId);

      if (error) throw error;
      
      setSuccessMessage('設定を削除しました');
      await fetchSettings();
    } catch (err) {
      console.error('設定削除エラー:', err);
      setError(err instanceof Error ? err.message : '設定の削除に失敗しました');
    }
  };

  const createNewSetting = (locationId: string | null = null) => {
    const newSetting: BreakTimeSetting = {
      id: 'new',
      location_id: locationId,
      setting_name: locationId ? `拠点別設定 - ${locations.find(l => l.id === locationId)?.name || ''}` : '全体設定',
      break_rules: [
        {
          min_work_hours: 0,
          max_work_hours: 6,
          break_minutes: 0,
          description: '6時間未満の場合は休憩なし'
        },
        {
          min_work_hours: 6,
          max_work_hours: 8,
          break_minutes: 60,
          description: '6時間以上8時間以下の場合は1時間休憩'
        },
        {
          min_work_hours: 8,
          max_work_hours: 12,
          break_minutes: 90,
          description: '8時間超過12時間以下の場合は1時間30分休憩'
        }
      ],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      applied_from: new Date().toISOString().slice(0, 16)
    };
    setEditingSetting(newSetting);
    setShowCreateForm(true);
  };

  const addBreakRule = (setting: BreakTimeSetting) => {
    const newRule: BreakTimeRule = {
      min_work_hours: 0,
      max_work_hours: 0,
      break_minutes: 0,
      description: ''
    };
    
    setEditingSetting({
      ...setting,
      break_rules: [...setting.break_rules, newRule]
    });
  };

  const updateBreakRule = (setting: BreakTimeSetting, index: number, field: keyof BreakTimeRule, value: any) => {
    const updatedRules = [...setting.break_rules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    
    setEditingSetting({
      ...setting,
      break_rules: updatedRules
    });
  };

  const removeBreakRule = (setting: BreakTimeSetting, index: number) => {
    const updatedRules = setting.break_rules.filter((_, i) => i !== index);
    setEditingSetting({
      ...setting,
      break_rules: updatedRules
    });
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
          <Clock className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">休憩時間設定</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => createNewSetting()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>全体設定を追加</span>
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>拠点別設定を追加</span>
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

      {/* 拠点選択（新規作成時） */}
      {showCreateForm && !editingSetting && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">拠点を選択してください</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map(location => (
              <button
                key={location.id}
                onClick={() => createNewSetting(location.id)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">{location.name}</div>
                    <div className="text-sm text-gray-500">{location.code}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 設定編集フォーム */}
      {editingSetting && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingSetting.location_id ? '拠点別設定' : '全体設定'}の編集
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={() => setEditingSetting(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleSave(editingSetting)}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '保存中...' : '保存'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  設定名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingSetting.setting_name}
                  onChange={(e) => setEditingSetting({...editingSetting, setting_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  適用開始日時 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={editingSetting.applied_from}
                  onChange={(e) => setEditingSetting({...editingSetting, applied_from: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 休憩時間ルール */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">休憩時間ルール</h4>
                <button
                  onClick={() => addBreakRule(editingSetting)}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>ルール追加</span>
                </button>
              </div>

              <div className="space-y-4">
                {editingSetting.break_rules.map((rule, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">最小拘束時間</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={rule.min_work_hours}
                          onChange={(e) => updateBreakRule(editingSetting, index, 'min_work_hours', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">最大拘束時間</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={rule.max_work_hours}
                          onChange={(e) => updateBreakRule(editingSetting, index, 'max_work_hours', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">休憩時間（分）</label>
                        <input
                          type="number"
                          min="0"
                          value={rule.break_minutes}
                          onChange={(e) => updateBreakRule(editingSetting, index, 'break_minutes', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">説明</label>
                        <input
                          type="text"
                          value={rule.description}
                          onChange={(e) => updateBreakRule(editingSetting, index, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <button
                          onClick={() => removeBreakRule(editingSetting, index)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 既存設定一覧 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">現在の設定</h3>
        
        {settings.map(setting => (
          <div key={setting.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {setting.location_id ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <MapPin className="w-3 h-3 mr-1" />
                      拠点別: {setting.location?.name || '不明'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      全体設定
                    </span>
                  )}
                  <h4 className="text-lg font-medium text-gray-900">{setting.setting_name}</h4>
                </div>
                
                <div className="space-y-2 mb-4">
                  {setting.break_rules.map((rule, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      拘束時間 {rule.min_work_hours}時間以上{rule.max_work_hours}時間以下 → 休憩 {rule.break_minutes}分
                      {rule.description && <span className="text-gray-500 ml-2">({rule.description})</span>}
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500">
                  適用開始: {new Date(setting.applied_from).toLocaleString('ja-JP')} | 
                  更新: {new Date(setting.updated_at).toLocaleString('ja-JP')}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingSetting(setting)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(setting.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BreakTimeSettings;