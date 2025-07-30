import { supabase } from '../lib/supabase'
import { Database } from '../types/supabase'
import { LineUser } from '../types/auth'
import { UserServiceSimple } from './userServiceSimple'

type Shift = Database['public']['Tables']['shifts']['Row']
type ShiftInsert = Database['public']['Tables']['shifts']['Insert']
type ShiftUpdate = Database['public']['Tables']['shifts']['Update']
type ShiftType = Database['public']['Enums']['shift_type']
type ShiftStatus = Database['public']['Enums']['shift_status']

export interface ShiftData {
  date: string // YYYY-MM-DD format
  shiftType: ShiftType | ''  // 空文字列でnullを表現
  shiftStatus?: ShiftStatus // デフォルトは'adjusting'
  startTime?: string // HH:MM format
  endTime?: string // HH:MM format
  note?: string
}

export class ShiftService {
  static async setUserContext(lineUserId: string) {
    // RLS無効化中はset_configをスキップ
    console.log('✅ User context (RLS無効化中のためスキップ):', lineUserId);
    return true;
  }

  static async createOrUpdateShift(
    lineUser: LineUser,
    shiftData: ShiftData
  ): Promise<Shift | null> {
    console.log('📅 シフト作成/更新開始:', { lineUser: lineUser.userId, shiftData });

    await this.setUserContext(lineUser.userId);

    // シフトタイプが空文字列の場合は削除処理
    if (!shiftData.shiftType) {
      console.log('🗑️ シフトタイプが空のため削除処理を実行');
      await this.deleteShift(lineUser, shiftData.date);
      return null;
    }

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

    // 既存のシフトを確認
    const { data: existingShift, error: findError } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user.id)
      .eq('shift_date', shiftData.date)
      .maybeSingle()

    if (findError) {
      console.error('❌ 既存シフト確認エラー:', findError);
      throw new Error(`既存シフト確認エラー: ${findError.message}`);
    }

    const shiftRecord = {
      user_id: user.id,
      shift_date: shiftData.date,
      shift_type: shiftData.shiftType,
      shift_status: shiftData.shiftStatus || 'adjusting' as ShiftStatus,
      start_time: shiftData.startTime || null,
      end_time: shiftData.endTime || null,
      note: shiftData.note || null,
      updated_at: new Date().toISOString()
    }

    // upsertを使用して新規作成または更新を一度に処理
    console.log('💾 シフトをupsert処理');
    const { data: upsertedShift, error: upsertError } = await supabase
      .from('shifts')
      .upsert(shiftRecord, {
        onConflict: 'user_id,shift_date'
      })
      .select('*')
      .single()

    if (upsertError) {
      console.error('❌ シフトupsertエラー:', upsertError);
      throw new Error(`シフト保存エラー: ${upsertError.message}`)
    }

    console.log('✅ シフトupsert成功:', upsertedShift);
    return upsertedShift
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
      off: '休み希望'
    }
    return labels[shiftType] || shiftType
  }

  static getShiftTypeColor(shiftType: ShiftType): string {
    const colors = {
      early: '#059669', // emerald-600 - 早番(オープン)
      late: '#dc2626', // red-600 - 遅番(締め)
      normal: '#CB8585', // 通常入店
      off: '#6b7280' // gray-500 - 休み希望
    }
    return colors[shiftType] || '#6b7280'
  }

  static formatTime(time: string | null): string {
    if (!time) return ''
    return time.substring(0, 5) // HH:MM:SS -> HH:MM
  }

  static getShiftStatusLabel(shiftStatus: ShiftStatus): string {
    const labels = {
      adjusting: 'シフト調整中',
      confirmed: 'シフト確定'
    }
    return labels[shiftStatus] || shiftStatus
  }

  static isShiftEditable(shift: Shift): boolean {
    return shift.shift_status === 'adjusting'
  }

  static canConfirmShift(shift: Shift): boolean {
    return shift.shift_status === 'adjusting'
  }
}