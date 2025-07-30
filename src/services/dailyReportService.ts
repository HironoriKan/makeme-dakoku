import { supabase } from '../lib/supabase'
import { LineUser } from '../types/auth'

export interface DailyReportData {
  salesAmount: number
  customerCount: number
  itemsSold: number
  notes?: string
}

export interface DailyReport {
  id: string
  user_id: string
  report_date: string
  sales_amount: number
  customer_count: number
  items_sold: number
  notes: string | null
  created_at: string
  updated_at: string | null
}

export class DailyReportService {
  static async setUserContext(lineUserId: string) {
    // RLS無効化中はset_configをスキップ
    console.log('✅ User context (RLS無効化中のためスキップ):', lineUserId)
    return true
  }

  static async createDailyReport(
    lineUser: LineUser,
    reportData: DailyReportData
  ): Promise<DailyReport> {
    console.log('📊 日次報告作成開始:', { lineUser: lineUser.userId, reportData })

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

    console.log('✅ ユーザーID取得:', user.id)

    // 今日の日付を取得
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 既存の今日の報告があるかチェック
    const { data: existingReport, error: findError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('report_date', today)
      .maybeSingle()

    if (findError) {
      console.error('❌ 既存報告確認エラー:', findError)
    }

    const reportRecord = {
      user_id: user.id,
      report_date: today,
      sales_amount: reportData.salesAmount,
      customer_count: reportData.customerCount,
      items_sold: reportData.itemsSold,
      notes: reportData.notes || null,
      updated_at: new Date().toISOString()
    }

    // upsertを使用して新規作成または更新を一度に処理
    console.log('💾 日次報告をupsert処理')
    const { data: upsertedReport, error: upsertError } = await supabase
      .from('daily_reports')
      .upsert(reportRecord, {
        onConflict: 'user_id,report_date'
      })
      .select('*')
      .single()

    if (upsertError) {
      console.error('❌ 日次報告upsertエラー:', upsertError)
      throw new Error(`日次報告保存エラー: ${upsertError.message}`)
    }

    console.log('✅ 日次報告upsert成功:', upsertedReport)
    return upsertedReport
  }

  static async getTodayReport(lineUser: LineUser): Promise<DailyReport | null> {
    console.log('📊 今日の報告取得開始:', { user: lineUser.userId })

    await this.setUserContext(lineUser.userId)

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUser.userId)
      .single()

    if (userError || !user) {
      console.error('❌ ユーザー取得エラー:', userError)
      return null
    }

    const today = new Date().toISOString().split('T')[0]

    const { data: report, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('report_date', today)
      .maybeSingle()

    if (error) {
      console.error('❌ 今日の報告取得エラー:', error)
      return null
    }

    console.log('✅ 今日の報告取得:', report ? '見つかりました' : '見つかりませんでした')
    return report
  }

  static async getMonthlyReports(
    lineUser: LineUser,
    year: number,
    month: number
  ): Promise<DailyReport[]> {
    console.log('📊 月次報告取得開始:', { user: lineUser.userId, year, month })

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

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', user.id)
      .gte('report_date', startDate)
      .lte('report_date', endDate)
      .order('report_date', { ascending: false })

    if (error) {
      console.error('❌ 月次報告取得エラー:', error)
      return []
    }

    console.log('✅ 月次報告取得成功:', reports?.length, '件')
    return reports || []
  }
}