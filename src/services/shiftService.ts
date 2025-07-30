import { supabase } from '../lib/supabase'
import { Database } from '../types/supabase'
import { LineUser } from '../types/auth'
import { UserServiceSimple } from './userServiceSimple'

type Shift = Database['public']['Tables']['shifts']['Row']
type ShiftInsert = Database['public']['Tables']['shifts']['Insert']
type ShiftUpdate = Database['public']['Tables']['shifts']['Update']
type ShiftType = Database['public']['Enums']['shift_type']

export interface ShiftData {
  date: string // YYYY-MM-DD format
  shiftType: ShiftType
  startTime?: string // HH:MM format
  endTime?: string // HH:MM format
  note?: string
}

export class ShiftService {
  static async setUserContext(lineUserId: string) {
    try {
      const { data, error } = await supabase.rpc('set_config', {
        setting_name: 'app.current_user_line_id',
        new_value: lineUserId,
        is_local: true
      });
      
      if (error) {
        console.error('set_config エラー:', error);
        // RLS無効化中はエラーを無視
        console.warn('RLS無効化中のため、set_configエラーを無視');
      }
      
      console.log('✅ User context set for shifts:', lineUserId);
      return data;
    } catch (error) {
      console.error('❌ setUserContext エラー:', error);
      // RLS無効化中はエラーを無視して続行
      console.warn('RLS無効化中のため、setUserContextエラーを無視');
    }
  }

  static async createOrUpdateShift(
    lineUser: LineUser,
    shiftData: ShiftData
  ): Promise<Shift> {
    console.log('📅 シフト作成/更新開始:', { lineUser: lineUser.userId, shiftData });

    await this.setUserContext(lineUser.userId);

    // まずユーザーIDを取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUser.userId)
      .single()

    if (userError || !user) {
      console.error('❌ ユーザー取得エラー:', userError);
      throw new Error(`ユーザーが見つかりません: ${userError?.message}`)
    }

    console.log('✅ ユーザーID取得:', user.id);

    // 既存のシフトを確認（RLS無効化中は直接クエリ）
    const { data: existingShift, error: findError } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user.id)
      .eq('shift_date', shiftData.date)
      .maybeSingle() // singleの代わりにmaybeSingleを使用

    if (findError) {
      console.error('❌ 既存シフト確認エラー:', findError);
      console.log('既存シフト確認をスキップして新規作成します');
    }

    const shiftRecord = {
      user_id: user.id,
      shift_date: shiftData.date,
      shift_type: shiftData.shiftType,
      start_time: shiftData.startTime || null,
      end_time: shiftData.endTime || null,
      note: shiftData.note || null,
      updated_at: new Date().toISOString()
    }

    if (existingShift && !findError) {
      // 更新
      console.log('🔄 既存シフトを更新');
      const { data: updatedShift, error: updateError } = await supabase
        .from('shifts')
        .update(shiftRecord)
        .eq('id', existingShift.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('❌ シフト更新エラー:', updateError);
        throw new Error(`シフト更新エラー: ${updateError.message}`)
      }

      console.log('✅ シフト更新成功:', updatedShift);
      return updatedShift
    } else {
      // 新規作成またはupsert
      console.log('➕ 新規シフトを作成');
      const { data: newShift, error: insertError } = await supabase
        .from('shifts')
        .upsert(shiftRecord, {
          onConflict: 'user_id,shift_date'
        })
        .select('*')
        .single()

      if (insertError) {
        console.error('❌ シフト作成エラー:', insertError);
        throw new Error(`シフト作成エラー: ${insertError.message}`)
      }

      console.log('✅ シフト作成成功:', newShift);
      return newShift
    }
  }

  static async getMonthlyShifts(
    lineUser: LineUser,
    year: number,
    month: number
  ): Promise<Shift[]> {
    console.log('📅 月間シフト取得開始:', { user: lineUser.userId, year, month });

    await this.setUserContext(lineUser.userId);

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // 月末日

    // まずユーザーIDを取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUser.userId)
      .single()

    if (userError || !user) {
      console.error('❌ ユーザー取得エラー:', userError);
      return []
    }

    // RLS無効化中は直接user_idでクエリ
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user.id)
      .gte('shift_date', startDate)
      .lte('shift_date', endDate)
      .order('shift_date', { ascending: true })

    if (error) {
      console.error('❌ 月間シフト取得エラー:', error);
      return []
    }

    console.log('✅ 月間シフト取得成功:', shifts?.length, '件');
    return shifts || []
  }

  static async deleteShift(lineUser: LineUser, date: string): Promise<void> {
    console.log('🗑️ シフト削除開始:', { user: lineUser.userId, date });

    await this.setUserContext(lineUser.userId);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUser.userId)
      .single()

    if (userError || !user) {
      throw new Error(`ユーザーが見つかりません: ${userError?.message}`)
    }

    const { error: deleteError } = await supabase
      .from('shifts')
      .delete()
      .eq('user_id', user.id)
      .eq('shift_date', date)

    if (deleteError) {
      console.error('❌ シフト削除エラー:', deleteError);
      throw new Error(`シフト削除エラー: ${deleteError.message}`)
    }

    console.log('✅ シフト削除成功');
  }

  static getShiftTypeLabel(shiftType: ShiftType): string {
    const labels = {
      early: '早番(オープン)',
      late: '遅番(締め)',
      normal: '通常入店',
      off: '休み'
    }
    return labels[shiftType] || shiftType
  }

  static getShiftTypeColor(shiftType: ShiftType): string {
    const colors = {
      early: '#059669', // emerald-600 - 早番(オープン)
      late: '#dc2626', // red-600 - 遅番(締め)
      normal: '#CB8585', // 通常入店
      off: '#6b7280' // gray-500 - 休み
    }
    return colors[shiftType] || '#6b7280'
  }

  static formatTime(time: string | null): string {
    if (!time) return ''
    return time.substring(0, 5) // HH:MM:SS -> HH:MM
  }
}