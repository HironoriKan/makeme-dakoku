import { supabase } from '../lib/supabase'
import { LineUser } from '../types/auth'
import { Database } from '../types/supabase'

type TimeRecord = Database['public']['Tables']['time_records']['Row']
type RecordType = Database['public']['Enums']['record_type']

export interface TimeRecordEditData {
  recordType: RecordType
  recordedAt: string
  locationName?: string
  note?: string
  reason: string
}

export interface TimeRecordDeleteData {
  reason: string
}

export interface TimeRecordChange {
  id: string
  user_id: string
  time_record_id: string | null
  change_type: 'edit' | 'delete'
  reason: string
  original_record_type: RecordType | null
  original_recorded_at: string | null
  original_location_name: string | null
  original_note: string | null
  new_record_type: RecordType | null
  new_recorded_at: string | null
  new_location_name: string | null
  new_note: string | null
  created_at: string
  updated_at: string | null
}

export class TimeRecordChangeService {
  static async setUserContext(lineUserId: string) {
    // RLS無効化中はset_configをスキップ
    console.log('✅ User context (RLS無効化中のためスキップ):', lineUserId)
    return true
  }

  static async editTimeRecord(
    lineUser: LineUser,
    timeRecordId: string,
    editData: TimeRecordEditData
  ): Promise<TimeRecord> {
    console.log('✏️ 打刻記録編集開始:', { user: lineUser.userId, timeRecordId, editData })

    await this.setUserContext(lineUser.userId)

    // まずユーザーIDを取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUser.userId)
      .single()

    if (userError || !user) {
      console.error('❌ ユーザー取得エラー:', userError)
      throw new Error(`ユーザーが見つかりません: ${userError?.message}`)
    }

    // 元の打刻記録を取得
    const { data: originalRecord, error: fetchError } = await supabase
      .from('time_records')
      .select('*')
      .eq('id', timeRecordId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !originalRecord) {
      console.error('❌ 元の打刻記録取得エラー:', fetchError)
      throw new Error(`打刻記録が見つかりません: ${fetchError?.message}`)
    }

    // 打刻記録を更新
    const { data: updatedRecord, error: updateError } = await supabase
      .from('time_records')
      .update({
        record_type: editData.recordType,
        recorded_at: editData.recordedAt,
        location_name: editData.locationName || null,
        note: editData.note || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', timeRecordId)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ 打刻記録更新エラー:', updateError)
      throw new Error(`打刻記録更新エラー: ${updateError.message}`)
    }

    // 変更履歴を記録
    const { error: changeError } = await supabase
      .from('time_record_changes')
      .insert({
        user_id: user.id,
        time_record_id: timeRecordId,
        change_type: 'edit',
        reason: editData.reason,
        original_record_type: originalRecord.record_type,
        original_recorded_at: originalRecord.recorded_at,
        original_location_name: originalRecord.location_name,
        original_note: originalRecord.note,
        new_record_type: editData.recordType,
        new_recorded_at: editData.recordedAt,
        new_location_name: editData.locationName || null,
        new_note: editData.note || null
      })

    if (changeError) {
      console.error('❌ 変更履歴記録エラー:', changeError)
      // 変更履歴の記録に失敗しても打刻記録の更新は成功させる
      console.warn('変更履歴の記録に失敗しましたが、打刻記録の更新は完了しました')
    }

    console.log('✅ 打刻記録編集成功:', updatedRecord)
    return updatedRecord
  }

  static async deleteTimeRecord(
    lineUser: LineUser,
    timeRecordId: string,
    deleteData: TimeRecordDeleteData
  ): Promise<void> {
    console.log('🗑️ 打刻記録削除開始:', { user: lineUser.userId, timeRecordId, deleteData })

    await this.setUserContext(lineUser.userId)

    // まずユーザーIDを取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUser.userId)
      .single()

    if (userError || !user) {
      console.error('❌ ユーザー取得エラー:', userError)
      throw new Error(`ユーザーが見つかりません: ${userError?.message}`)
    }

    // 元の打刻記録を取得
    const { data: originalRecord, error: fetchError } = await supabase
      .from('time_records')
      .select('*')
      .eq('id', timeRecordId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !originalRecord) {
      console.error('❌ 元の打刻記録取得エラー:', fetchError)
      throw new Error(`打刻記録が見つかりません: ${fetchError?.message}`)
    }

    // 変更履歴を記録（削除前に記録）
    const { error: changeError } = await supabase
      .from('time_record_changes')
      .insert({
        user_id: user.id,
        time_record_id: timeRecordId,
        change_type: 'delete',
        reason: deleteData.reason,
        original_record_type: originalRecord.record_type,
        original_recorded_at: originalRecord.recorded_at,
        original_location_name: originalRecord.location_name,
        original_note: originalRecord.note,
        new_record_type: null,
        new_recorded_at: null,
        new_location_name: null,
        new_note: null
      })

    if (changeError) {
      console.error('❌ 変更履歴記録エラー:', changeError)
      throw new Error(`変更履歴記録エラー: ${changeError.message}`)
    }

    // 打刻記録を削除
    const { error: deleteError } = await supabase
      .from('time_records')
      .delete()
      .eq('id', timeRecordId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ 打刻記録削除エラー:', deleteError)
      throw new Error(`打刻記録削除エラー: ${deleteError.message}`)
    }

    console.log('✅ 打刻記録削除成功')
  }

  static async getChangeHistory(
    lineUser: LineUser,
    timeRecordId?: string
  ): Promise<TimeRecordChange[]> {
    console.log('📋 変更履歴取得開始:', { user: lineUser.userId, timeRecordId })

    await this.setUserContext(lineUser.userId)

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUser.userId)
      .single()

    if (userError || !user) {
      console.error('❌ ユーザー取得エラー:', userError)
      return []
    }

    let query = supabase
      .from('time_record_changes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (timeRecordId) {
      query = query.eq('time_record_id', timeRecordId)
    }

    const { data: changes, error } = await query

    if (error) {
      console.error('❌ 変更履歴取得エラー:', error)
      return []
    }

    console.log('✅ 変更履歴取得成功:', changes?.length, '件')
    return changes || []
  }

  static getChangeTypeLabel(changeType: 'edit' | 'delete'): string {
    const labels = {
      edit: '編集',
      delete: '削除'
    }
    return labels[changeType] || changeType
  }

  static formatChangeDescription(change: TimeRecordChange): string {
    if (change.change_type === 'delete') {
      return `${this.getRecordTypeLabel(change.original_record_type!)}を削除`
    }

    const changes: string[] = []
    
    if (change.original_record_type !== change.new_record_type) {
      changes.push(`種別: ${this.getRecordTypeLabel(change.original_record_type!)} → ${this.getRecordTypeLabel(change.new_record_type!)}`)
    }
    
    if (change.original_recorded_at !== change.new_recorded_at) {
      const originalTime = new Date(change.original_recorded_at!).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      const newTime = new Date(change.new_recorded_at!).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      changes.push(`時刻: ${originalTime} → ${newTime}`)
    }

    return changes.length > 0 ? changes.join(', ') : '編集'
  }

  private static getRecordTypeLabel(recordType: RecordType): string {
    const labels = {
      clock_in: '出勤',
      clock_out: '退勤',
      break_start: '休憩開始',
      break_end: '休憩終了'
    }
    return labels[recordType] || recordType
  }
}