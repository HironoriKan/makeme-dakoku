/**
 * シフトテンプレートサービス
 * 店舗別シフトパターンの管理機能
 */

import { supabase } from '../lib/supabase';
import { 
  ShiftTemplate,
  ShiftTemplateInsert,
  ShiftTemplateUpdate,
  ShiftTemplateWithLocation,
  CreateShiftTemplateRequest,
  ApplyTemplateRequest,
  ApplyTemplateResponse,
  ShiftTemplateFilters,
  ApiResponse,
  PaginatedResponse,
  ShiftType
} from '../types/batch-operations';

export class ShiftTemplateService {
  /**
   * シフトテンプレート一覧取得
   */
  static async getTemplates(
    filters: ShiftTemplateFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<ShiftTemplateWithLocation>> {
    try {
      let query = supabase
        .from('shift_templates')
        .select(`
          *,
          location:locations(
            id,
            name,
            code
          )
        `)
        .order('created_at', { ascending: false });

      // フィルター適用
      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }

      if (filters.shift_type) {
        query = query.eq('shift_type', filters.shift_type);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // ページネーション
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error('❌ シフトテンプレート取得エラー:', error);
      throw new Error(`テンプレート取得に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * シフトテンプレート詳細取得
   */
  static async getTemplate(id: string): Promise<ShiftTemplateWithLocation> {
    try {
      const { data, error } = await supabase
        .from('shift_templates')
        .select(`
          *,
          location:locations(
            id,
            name,
            code
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('テンプレートが見つかりません');
      }

      return data;
    } catch (error) {
      console.error('❌ シフトテンプレート詳細取得エラー:', error);
      throw new Error(`テンプレート詳細取得に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 拠点別テンプレート取得
   */
  static async getTemplatesByLocation(locationId: string): Promise<ShiftTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true)
        .order('shift_type', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ 拠点別テンプレート取得エラー:', error);
      throw new Error(`拠点テンプレート取得に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * シフトテンプレート作成
   */
  static async createTemplate(request: CreateShiftTemplateRequest): Promise<ShiftTemplate> {
    try {
      // 同一拠点・同一名のテンプレートチェック
      const { data: existing } = await supabase
        .from('shift_templates')
        .select('id')
        .eq('location_id', request.location_id)
        .eq('name', request.name)
        .single();

      if (existing) {
        throw new Error('同じ名前のテンプレートが既に存在します');
      }

      const templateData: ShiftTemplateInsert = {
        name: request.name,
        description: request.description,
        location_id: request.location_id,
        shift_type: request.shift_type,
        start_time: request.start_time,
        end_time: request.end_time,
        break_duration: request.break_duration || 60,
        break_start_time: request.break_start_time,
        applicable_days: request.applicable_days || [1, 2, 3, 4, 5, 6, 7],
        is_active: true,
      };

      const { data, error } = await supabase
        .from('shift_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ シフトテンプレート作成成功:', data);
      return data;
    } catch (error) {
      console.error('❌ シフトテンプレート作成エラー:', error);
      throw new Error(`テンプレート作成に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * シフトテンプレート更新
   */
  static async updateTemplate(id: string, updates: Partial<CreateShiftTemplateRequest>): Promise<ShiftTemplate> {
    try {
      const updateData: ShiftTemplateUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('shift_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('更新対象のテンプレートが見つかりません');
      }

      console.log('✅ シフトテンプレート更新成功:', data);
      return data;
    } catch (error) {
      console.error('❌ シフトテンプレート更新エラー:', error);
      throw new Error(`テンプレート更新に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * シフトテンプレート削除
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shift_templates')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      console.log('✅ シフトテンプレート削除成功:', id);
    } catch (error) {
      console.error('❌ シフトテンプレート削除エラー:', error);
      throw new Error(`テンプレート削除に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * シフトテンプレート適用
   */
  static async applyTemplate(request: ApplyTemplateRequest): Promise<ApplyTemplateResponse> {
    try {
      console.log('📝 シフトテンプレート適用開始:', request);

      // テンプレート存在確認
      const template = await this.getTemplate(request.template_id);
      if (!template) {
        throw new Error('指定されたテンプレートが見つかりません');
      }

      let successCount = 0;
      let errorCount = 0;
      const createdShifts: string[] = [];
      const errors: Array<{ user_id: string; date: string; error: string }> = [];

      // 各ユーザー・各日付に対してシフト作成
      for (const userId of request.target_user_ids) {
        for (const date of request.target_dates) {
          try {
            // 既存シフトチェック
            const { data: existingShift } = await supabase
              .from('shifts')
              .select('id')
              .eq('user_id', userId)
              .eq('shift_date', date)
              .single();

            if (existingShift && !request.override_existing) {
              errors.push({
                user_id: userId,
                date,
                error: '既存のシフトがあります'
              });
              errorCount++;
              continue;
            }

            // シフト作成データ
            const shiftData = {
              user_id: userId,
              shift_date: date,
              shift_type: template.shift_type,
              start_time: template.start_time,
              end_time: template.end_time,
              shift_status: 'adjusting' as const,
              note: `テンプレート適用: ${template.name}`,
              created_at: new Date().toISOString(),
            };

            if (existingShift && request.override_existing) {
              // 既存シフト更新
              const { data, error } = await supabase
                .from('shifts')
                .update({
                  shift_type: shiftData.shift_type,
                  start_time: shiftData.start_time,
                  end_time: shiftData.end_time,
                  note: shiftData.note,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingShift.id)
                .select()
                .single();

              if (error) throw error;
              createdShifts.push(data.id);
            } else {
              // 新規シフト作成
              const { data, error } = await supabase
                .from('shifts')
                .insert(shiftData)
                .select()
                .single();

              if (error) throw error;
              createdShifts.push(data.id);
            }

            successCount++;

          } catch (shiftError) {
            console.error(`シフト作成エラー (${userId}, ${date}):`, shiftError);
            errors.push({
              user_id: userId,
              date,
              error: shiftError instanceof Error ? shiftError.message : 'Unknown error'
            });
            errorCount++;
          }
        }
      }

      const response: ApplyTemplateResponse = {
        success_count: successCount,
        error_count: errorCount,
        created_shifts: createdShifts,
        errors,
      };

      console.log('✅ シフトテンプレート適用完了:', response);
      return response;

    } catch (error) {
      console.error('❌ シフトテンプレート適用エラー:', error);
      throw new Error(`テンプレート適用に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * シフトタイプ別テンプレート取得
   */
  static async getTemplatesByType(locationId: string, shiftType: ShiftType): Promise<ShiftTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*')
        .eq('location_id', locationId)
        .eq('shift_type', shiftType)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ シフトタイプ別テンプレート取得エラー:', error);
      throw new Error(`シフトタイプ別テンプレート取得に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * テンプレート複製
   */
  static async duplicateTemplate(id: string, newName: string): Promise<ShiftTemplate> {
    try {
      // 元テンプレート取得
      const originalTemplate = await this.getTemplate(id);

      // 複製データ作成
      const duplicateData: CreateShiftTemplateRequest = {
        name: newName,
        description: `${originalTemplate.description || ''} (複製)`,
        location_id: originalTemplate.location_id,
        shift_type: originalTemplate.shift_type,
        start_time: originalTemplate.start_time,
        end_time: originalTemplate.end_time,
        break_duration: originalTemplate.break_duration,
        break_start_time: originalTemplate.break_start_time,
        applicable_days: originalTemplate.applicable_days,
      };

      return await this.createTemplate(duplicateData);
    } catch (error) {
      console.error('❌ テンプレート複製エラー:', error);
      throw new Error(`テンプレート複製に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * テンプレート使用統計取得
   */
  static async getTemplateUsageStats(templateId: string): Promise<{
    total_applications: number;
    recent_applications: number;
    most_recent_use: string | null;
  }> {
    try {
      // テンプレート適用回数を取得（note フィールドから推定）
      const { data, error } = await supabase
        .from('shifts')
        .select('created_at')
        .like('note', `%テンプレート適用:%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentApplications = (data || []).filter(
        item => new Date(item.created_at) > oneWeekAgo
      );

      return {
        total_applications: (data || []).length,
        recent_applications: recentApplications.length,
        most_recent_use: (data || [])[0]?.created_at || null,
      };
    } catch (error) {
      console.error('❌ テンプレート使用統計取得エラー:', error);
      return {
        total_applications: 0,
        recent_applications: 0,
        most_recent_use: null,
      };
    }
  }

  /**
   * 一括テンプレート有効化/無効化
   */
  static async toggleTemplatesStatus(templateIds: string[], isActive: boolean): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('shift_templates')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString() 
        })
        .in('id', templateIds)
        .select();

      if (error) {
        throw error;
      }

      console.log(`✅ テンプレート${isActive ? '有効化' : '無効化'}完了:`, data?.length);
      return data?.length || 0;
    } catch (error) {
      console.error('❌ テンプレート状態変更エラー:', error);
      throw new Error(`テンプレート状態変更に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default ShiftTemplateService;