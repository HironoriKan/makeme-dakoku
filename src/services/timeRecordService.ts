import { supabase } from '../lib/supabase'
import { Database } from '../types/supabase'
import { LineUser } from '../types/auth'

type TimeRecord = Database['public']['Tables']['time_records']['Row']
type TimeRecordInsert = Database['public']['Tables']['time_records']['Insert']
type RecordType = Database['public']['Enums']['record_type']

export interface LocationData {
  latitude: number
  longitude: number
  locationName?: string
}

export interface TimeRecordData {
  recordType: RecordType
  locationId?: string
  location?: LocationData
  note?: string
}

export class TimeRecordService {
  static async createTimeRecord(
    lineUser: LineUser,
    recordData: TimeRecordData
  ): Promise<TimeRecord> {
    console.log('⏰ 打刻記録開始:', { lineUser: lineUser.userId, recordData });

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

    // 打刻データを準備
    const insertData: TimeRecordInsert = {
      user_id: user.id,
      record_type: recordData.recordType,
      recorded_at: new Date().toISOString(),
      location_id: recordData.locationId || null,
      location_lat: recordData.location?.latitude,
      location_lng: recordData.location?.longitude,
      location_name: recordData.location?.locationName,
      note: recordData.note
    }

    console.log('📝 打刻データ挿入:', insertData);

    // 打刻記録を作成
    const { data: timeRecord, error: insertError } = await supabase
      .from('time_records')
      .insert(insertData)
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ 打刻記録エラー:', insertError);
      throw new Error(`打刻記録の作成に失敗しました: ${insertError.message}`)
    }

    console.log('✅ 打刻記録成功:', timeRecord);
    return timeRecord
  }

  static async getUserTimeRecords(
    lineUser: LineUser,
    limit: number = 20
  ): Promise<TimeRecord[]> {
    console.log('📋 打刻履歴取得開始:', lineUser.userId);

    // ユーザーの打刻記録を取得
    const { data: records, error } = await supabase
      .from('time_records')
      .select(`
        *,
        users!inner(line_user_id)
      `)
      .eq('users.line_user_id', lineUser.userId)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ 打刻履歴取得エラー:', error);
      throw new Error(`打刻履歴の取得に失敗しました: ${error.message}`)
    }

    console.log('✅ 打刻履歴取得成功:', records?.length, '件');
    return records || []
  }

  static async getTodayTimeRecords(lineUser: LineUser): Promise<TimeRecord[]> {
    console.log('📅 今日の打刻記録取得開始:', lineUser.userId);

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const { data: records, error } = await supabase
      .from('time_records')
      .select(`
        *,
        users!inner(line_user_id)
      `)
      .eq('users.line_user_id', lineUser.userId)
      .gte('recorded_at', startOfDay.toISOString())
      .lt('recorded_at', endOfDay.toISOString())
      .order('recorded_at', { ascending: true })

    if (error) {
      console.error('❌ 今日の打刻記録取得エラー:', error);
      throw new Error(`今日の打刻記録の取得に失敗しました: ${error.message}`)
    }

    console.log('✅ 今日の打刻記録取得成功:', records?.length, '件');
    return records || []
  }

  static getRecordTypeLabel(recordType: RecordType): string {
    const labels = {
      clock_in: '出勤',
      clock_out: '退勤',
      break_start: '休憩開始',
      break_end: '休憩終了'
    }
    return labels[recordType] || recordType
  }

  static getNextRecordType(currentRecords: TimeRecord[]): RecordType {
    if (currentRecords.length === 0) {
      return 'clock_in' // 初回は出勤
    }

    const lastRecord = currentRecords[currentRecords.length - 1]
    
    switch (lastRecord.record_type) {
      case 'clock_in':
        return 'break_start'
      case 'break_start':
        return 'break_end'
      case 'break_end':
        return 'break_start'
      case 'clock_out':
        return 'clock_in'
      default:
        return 'clock_in'
    }
  }

  static canClockOut(currentRecords: TimeRecord[]): boolean {
    if (currentRecords.length === 0) return false
    
    const lastRecord = currentRecords[currentRecords.length - 1]
    return lastRecord.record_type === 'clock_in' || lastRecord.record_type === 'break_end'
  }

  // 月間の打刻記録を取得
  static async getMonthlyTimeRecords(
    lineUser: LineUser,
    year: number,
    month: number
  ): Promise<TimeRecord[]> {
    console.log('📅 月間打刻記録取得開始:', { user: lineUser.userId, year, month });

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // 月末日

    const { data: records, error } = await supabase
      .from('time_records')
      .select(`
        *,
        users!inner(line_user_id)
      `)
      .eq('users.line_user_id', lineUser.userId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate + 'T23:59:59.999Z')
      .order('recorded_at', { ascending: true })

    if (error) {
      console.error('❌ 月間打刻記録取得エラー:', error);
      return []
    }

    console.log('✅ 月間打刻記録取得成功:', records?.length, '件');
    return records || []
  }

  // 特定日の打刻記録を取得
  static async getDayTimeRecords(
    lineUser: LineUser,
    date: string // YYYY-MM-DD format
  ): Promise<TimeRecord[]> {
    console.log('📅 日別打刻記録取得開始:', { user: lineUser.userId, date });

    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const { data: records, error } = await supabase
      .from('time_records')
      .select(`
        *,
        users!inner(line_user_id)
      `)
      .eq('users.line_user_id', lineUser.userId)
      .gte('recorded_at', startOfDay)
      .lte('recorded_at', endOfDay)
      .order('recorded_at', { ascending: true })

    if (error) {
      console.error('❌ 日別打刻記録取得エラー:', error);
      return []
    }

    console.log('✅ 日別打刻記録取得成功:', records?.length, '件');
    return records || []
  }

  // 今日の特定拠点での特定タイプの打刻をチェック
  static async hasTodayRecordForLocation(
    lineUser: LineUser,
    locationId: string,
    recordType: RecordType
  ): Promise<boolean> {
    console.log('🔍 今日の拠点別打刻チェック:', { user: lineUser.userId, locationId, recordType });

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const startOfDay = `${today}T00:00:00.000Z`
    const endOfDay = `${today}T23:59:59.999Z`

    const { data: records, error } = await supabase
      .from('time_records')
      .select(`
        id,
        record_type,
        location_id,
        users!inner(line_user_id)
      `)
      .eq('users.line_user_id', lineUser.userId)
      .eq('location_id', locationId)
      .eq('record_type', recordType)
      .gte('recorded_at', startOfDay)
      .lte('recorded_at', endOfDay)
      .limit(1)

    if (error) {
      console.error('❌ 拠点別打刻チェックエラー:', error);
      return false
    }

    const hasRecord = records && records.length > 0
    console.log(hasRecord ? '⚠️ 既に打刻済み' : '✅ 打刻可能');
    return hasRecord
  }
}