/**
 * バッチ承認サービス
 * シフトの一括承認機能
 */

import { supabase } from '../lib/supabase';
import { 
  BatchApprovalRequest,
  BatchApprovalResponse,
  BatchApprovalTarget,
  BatchApprovalUIData,
  BatchApprovalFilters,
  BatchOperationStatus,
  ShiftStatus,
  ShiftType,
  PaginatedResponse
} from '../types/batch-operations';

export class BatchApprovalService {
  /**
   * 承認待ちシフト一覧取得（ユーザー単位でグループ化）
   */
  static async getPendingShiftsGroupedByUser(
    filters: BatchApprovalFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<BatchApprovalUIData>> {
    try {
      let shiftsQuery = supabase
        .from('shifts')
        .select(`
          id,
          user_id,
          shift_date,
          shift_type,
          start_time,
          end_time,
          shift_status,
          note,
          users!inner(
            id,
            display_name,
            employee_number
          )
        `)
        .eq('shift_status', 'adjusting')
        .order('shift_date', { ascending: true });

      // フィルター適用
      if (filters.user_id) {
        shiftsQuery = shiftsQuery.eq('user_id', filters.user_id);
      }

      if (filters.date_from) {
        shiftsQuery = shiftsQuery.gte('shift_date', filters.date_from);
      }

      if (filters.date_to) {
        shiftsQuery = shiftsQuery.lte('shift_date', filters.date_to);
      }

      if (filters.shift_type) {
        shiftsQuery = shiftsQuery.eq('shift_type', filters.shift_type);
      }

      if (filters.location_id) {
        // ユーザーの拠点で絞り込み（user_locations経由）
        shiftsQuery = shiftsQuery.in('user_id', 
          supabase
            .from('user_locations')
            .select('user_id')
            .eq('location_id', filters.location_id)
            .eq('is_active', true)
        );
      }

      const { data: shifts, error: shiftsError } = await shiftsQuery;

      if (shiftsError) {
        throw shiftsError;
      }

      // ユーザー単位でグループ化
      const userShiftsMap = new Map<string, {
        user_id: string;
        user_name: string;
        shifts: Array<{
          id: string;
          date: string;
          shift_type: ShiftType;
          start_time?: string;
          end_time?: string;
          status: ShiftStatus;
          selected: boolean;
        }>;
      }>();

      (shifts || []).forEach(shift => {
        const userId = shift.user_id;
        const userName = shift.users?.display_name || `ユーザー${shift.users?.employee_number}`;

        if (!userShiftsMap.has(userId)) {
          userShiftsMap.set(userId, {
            user_id: userId,
            user_name: userName,
            shifts: [],
          });
        }

        userShiftsMap.get(userId)!.shifts.push({
          id: shift.id,
          date: shift.shift_date,
          shift_type: shift.shift_type,
          start_time: shift.start_time,
          end_time: shift.end_time,
          status: shift.shift_status,
          selected: false,
        });
      });

      // BatchApprovalUIData形式に変換
      const groupedData: BatchApprovalUIData[] = Array.from(userShiftsMap.values()).map(userGroup => ({
        user_id: userGroup.user_id,
        user_name: userGroup.user_name,
        shifts: userGroup.shifts,
        total_pending: userGroup.shifts.length,
        selected_count: 0,
      }));

      // ページネーション適用
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = groupedData.slice(from, to);

      return {
        data: paginatedData,
        total: groupedData.length,
        page,
        pageSize,
        totalPages: Math.ceil(groupedData.length / pageSize),
      };

    } catch (error) {
      console.error('❌ 承認待ちシフト取得エラー:', error);
      throw new Error(`承認待ちシフト取得に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 承認待ちシフト詳細一覧取得（フラット形式）
   */
  static async getPendingShifts(
    filters: BatchApprovalFilters = {}
  ): Promise<BatchApprovalTarget[]> {
    try {
      let query = supabase
        .from('shifts')
        .select(`
          id,
          user_id,
          shift_date,
          shift_type,
          start_time,
          end_time,
          shift_status,
          users!inner(
            display_name,
            employee_number
          )
        `)
        .eq('shift_status', 'adjusting')
        .order('shift_date', { ascending: true })
        .order('user_id', { ascending: true });

      // フィルター適用（getPendingShiftsGroupedByUserと同じロジック）
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.date_from) {
        query = query.gte('shift_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('shift_date', filters.date_to);
      }

      if (filters.shift_type) {
        query = query.eq('shift_type', filters.shift_type);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(shift => ({
        shift_id: shift.id,
        user_name: shift.users?.display_name || `#${shift.users?.employee_number}`,
        shift_date: shift.shift_date,
        shift_type: shift.shift_type,
        start_time: shift.start_time,
        end_time: shift.end_time,
        current_status: shift.shift_status,
      }));

    } catch (error) {
      console.error('❌ 承認待ちシフト詳細取得エラー:', error);
      throw new Error(`承認待ちシフト詳細取得に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * バッチ承認実行
   */
  static async batchApproveShifts(request: BatchApprovalRequest): Promise<BatchApprovalResponse> {
    try {
      console.log('📝 バッチ承認開始:', request);

      if (request.shift_ids.length === 0) {
        throw new Error('承認するシフトが選択されていません');
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ shift_id: string; error: string }> = [];

      // バッチ操作記録用
      const batchOperationData = {
        operation_type: 'shift_approve' as const,
        target_count: request.shift_ids.length,
        operation_data: {
          shift_ids: request.shift_ids,
          approver_notes: request.approver_notes,
        },
        executed_at: new Date().toISOString(),
        status: 'processing' as const,
      };

      // 各シフトを個別に承認処理
      for (const shiftId of request.shift_ids) {
        try {
          // シフト存在確認と状態チェック
          const { data: shift, error: checkError } = await supabase
            .from('shifts')
            .select('id, shift_status, user_id, shift_date')
            .eq('id', shiftId)
            .single();

          if (checkError) {
            throw new Error(`シフト確認エラー: ${checkError.message}`);
          }

          if (!shift) {
            throw new Error('シフトが見つかりません');
          }

          if (shift.shift_status !== 'adjusting') {
            throw new Error('既に承認済みまたは調整中ではありません');
          }

          // シフト承認実行
          const updateData = {
            shift_status: 'confirmed' as const,
            updated_at: new Date().toISOString(),
            ...(request.approver_notes && {
              note: shift.note ? 
                `${shift.note}\n[承認時メモ] ${request.approver_notes}` : 
                `[承認時メモ] ${request.approver_notes}`
            }),
          };

          const { error: updateError } = await supabase
            .from('shifts')
            .update(updateData)
            .eq('id', shiftId);

          if (updateError) {
            throw updateError;
          }

          successCount++;
          console.log(`✅ シフト承認成功: ${shiftId}`);

        } catch (shiftError) {
          console.error(`❌ シフト承認エラー (${shiftId}):`, shiftError);
          errors.push({
            shift_id: shiftId,
            error: shiftError instanceof Error ? shiftError.message : 'Unknown error'
          });
          errorCount++;
        }
      }

      // バッチ操作履歴記録
      try {
        await supabase
          .from('batch_operations')
          .insert({
            ...batchOperationData,
            success_count: successCount,
            error_count: errorCount,
            error_details: errors.length > 0 ? errors : null,
            completed_at: new Date().toISOString(),
            status: errorCount === 0 ? 'completed' : 'partial',
          });
      } catch (logError) {
        console.error('❌ バッチ操作履歴記録エラー:', logError);
        // 履歴記録エラーは処理を止めない
      }

      const response: BatchApprovalResponse = {
        success_count: successCount,
        error_count: errorCount,
        errors,
      };

      console.log('✅ バッチ承認完了:', response);
      return response;

    } catch (error) {
      console.error('❌ バッチ承認エラー:', error);
      throw new Error(`バッチ承認に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ユーザー単位一括承認
   */
  static async approveAllUserShifts(
    userId: string, 
    dateFrom?: string, 
    dateTo?: string,
    approverNotes?: string
  ): Promise<BatchApprovalResponse> {
    try {
      console.log('📝 ユーザー単位一括承認開始:', { userId, dateFrom, dateTo });

      // 対象ユーザーの承認待ちシフト取得
      let query = supabase
        .from('shifts')
        .select('id')
        .eq('user_id', userId)
        .eq('shift_status', 'adjusting');

      if (dateFrom) {
        query = query.gte('shift_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('shift_date', dateTo);
      }

      const { data: shifts, error } = await query;

      if (error) {
        throw error;
      }

      if (!shifts || shifts.length === 0) {
        return {
          success_count: 0,
          error_count: 0,
          errors: [],
        };
      }

      const shiftIds = shifts.map(shift => shift.id);
      
      return await this.batchApproveShifts({
        shift_ids: shiftIds,
        approver_notes: approverNotes,
      });

    } catch (error) {
      console.error('❌ ユーザー単位一括承認エラー:', error);
      throw new Error(`ユーザー単位一括承認に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * バッチ操作履歴取得
   */
  static async getBatchOperationHistory(
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<BatchOperationStatus>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('batch_operations')
        .select(`
          id,
          operation_type,
          target_count,
          success_count,
          error_count,
          status,
          executed_at,
          completed_at,
          executed_by,
          error_details
        `)
        .order('executed_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      const history: BatchOperationStatus[] = (data || []).map(record => ({
        id: record.id,
        operation_type: record.operation_type,
        target_count: record.target_count,
        success_count: record.success_count,
        error_count: record.error_count,
        status: record.status,
        executed_at: record.executed_at,
        completed_at: record.completed_at,
        executed_by: record.executed_by || 'system',
        error_details: record.error_details,
      }));

      return {
        data: history,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };

    } catch (error) {
      console.error('❌ バッチ操作履歴取得エラー:', error);
      throw new Error(`バッチ操作履歴取得に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 承認統計情報取得
   */
  static async getApprovalStats(dateFrom?: string, dateTo?: string): Promise<{
    total_pending: number;
    total_confirmed: number;
    pending_by_type: Record<ShiftType, number>;
    confirmed_today: number;
  }> {
    try {
      let baseQuery = supabase.from('shifts').select('shift_status, shift_type');

      if (dateFrom) {
        baseQuery = baseQuery.gte('shift_date', dateFrom);
      }

      if (dateTo) {
        baseQuery = baseQuery.lte('shift_date', dateTo);
      }

      const { data, error } = await baseQuery;

      if (error) {
        throw error;
      }

      const stats = {
        total_pending: 0,
        total_confirmed: 0,
        pending_by_type: {
          normal: 0,
          early: 0,
          late: 0,
          off: 0,
        } as Record<ShiftType, number>,
        confirmed_today: 0,
      };

      (data || []).forEach(shift => {
        if (shift.shift_status === 'adjusting') {
          stats.total_pending++;
          stats.pending_by_type[shift.shift_type]++;
        } else if (shift.shift_status === 'confirmed') {
          stats.total_confirmed++;
        }
      });

      // 今日承認された件数
      const today = new Date().toISOString().split('T')[0];
      const { data: todayConfirmed, error: todayError } = await supabase
        .from('shifts')
        .select('id', { count: 'exact' })
        .eq('shift_status', 'confirmed')
        .gte('updated_at', `${today}T00:00:00`)
        .lte('updated_at', `${today}T23:59:59`);

      if (!todayError) {
        stats.confirmed_today = todayConfirmed?.length || 0;
      }

      return stats;

    } catch (error) {
      console.error('❌ 承認統計取得エラー:', error);
      return {
        total_pending: 0,
        total_confirmed: 0,
        pending_by_type: { normal: 0, early: 0, late: 0, off: 0 },
        confirmed_today: 0,
      };
    }
  }

  /**
   * シフト承認の取り消し（confirmed → adjusting）
   */
  static async cancelApproval(shiftIds: string[]): Promise<BatchApprovalResponse> {
    try {
      console.log('📝 承認取り消し開始:', shiftIds);

      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ shift_id: string; error: string }> = [];

      for (const shiftId of shiftIds) {
        try {
          const { data: shift, error: checkError } = await supabase
            .from('shifts')
            .select('shift_status')
            .eq('id', shiftId)
            .single();

          if (checkError || !shift) {
            throw new Error('シフトが見つかりません');
          }

          if (shift.shift_status !== 'confirmed') {
            throw new Error('承認済みシフトではありません');
          }

          const { error: updateError } = await supabase
            .from('shifts')
            .update({
              shift_status: 'adjusting',
              updated_at: new Date().toISOString(),
            })
            .eq('id', shiftId);

          if (updateError) {
            throw updateError;
          }

          successCount++;

        } catch (shiftError) {
          errors.push({
            shift_id: shiftId,
            error: shiftError instanceof Error ? shiftError.message : 'Unknown error'
          });
          errorCount++;
        }
      }

      return { success_count: successCount, error_count: errorCount, errors };

    } catch (error) {
      console.error('❌ 承認取り消しエラー:', error);
      throw new Error(`承認取り消しに失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default BatchApprovalService;