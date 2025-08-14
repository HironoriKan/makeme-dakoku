import { supabase } from '../lib/supabase'
import { LineUser } from '../types/auth'

export interface DailyReportData {
  salesAmount: number
  customerCount: number
  itemsSold: number
  notes?: string
  checkoutTime: string // 退勤時刻 (ISO string)
}

export interface DailyReport {
  id: string
  user_id: string
  report_date: string
  sales_amount: number
  customer_count: number
  items_sold: number
  customer_unit_price: number
  items_per_customer: number
  checkout_time: string | null
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
      .from('daily_reports_with_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('report_date', today)
      .maybeSingle()

    if (findError) {
      console.error('❌ 既存報告確認エラー:', findError)
      throw new Error(`既存報告確認エラー: ${findError.message}`)
    }

    if (existingReport) {
      // 既存の日報がある場合は上書き更新
      console.log('⚠️ 既存の日報が見つかりました。データを上書き更新します:', existingReport.id)
      
      // フォームから送信されたデータで更新（計算項目は含めない）
      const updateData = {
        sales_amount: reportData.salesAmount,
        customer_count: reportData.customerCount,
        items_sold: reportData.itemsSold,
        // 退勤時刻は常に最新を記録
        checkout_time: reportData.checkoutTime,
        // 備考は新しい内容で上書き（追記ではなく）
        notes: reportData.notes || null,
        updated_at: new Date().toISOString()
      }

      const { data: updatedReport, error: updateError } = await supabase
        .from('daily_reports')
        .update(updateData)
        .eq('id', existingReport.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('❌ 日次報告更新エラー:', updateError)
        throw new Error(`日次報告更新エラー: ${updateError.message}`)
      }

      console.log('✅ 既存日報を安全に更新:', updatedReport)
      
      // 更新後、ビューから計算項目付きのデータを取得して返す
      const { data: reportWithMetrics, error: viewError } = await supabase
        .from('daily_reports_with_metrics')
        .select('*')
        .eq('id', updatedReport.id)
        .single()

      if (viewError) {
        console.error('❌ ビューからの取得エラー:', viewError)
        throw new Error(`ビューからの取得エラー: ${viewError.message}`)
      }

      return reportWithMetrics
    }

    // 新規作成の場合（計算項目は含めない）
    const reportRecord = {
      user_id: user.id,
      report_date: today,
      sales_amount: reportData.salesAmount,
      customer_count: reportData.customerCount,
      items_sold: reportData.itemsSold,
      checkout_time: reportData.checkoutTime,
      notes: reportData.notes || null,
    }

    console.log('💾 新規日次報告を作成')
    const { data: newReport, error: insertError } = await supabase
      .from('daily_reports')
      .insert(reportRecord)
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ 日次報告作成エラー:', insertError)
      throw new Error(`日次報告作成エラー: ${insertError.message}`)
    }

    console.log('✅ 日次報告新規作成成功:', newReport)
    
    // 新規作成後、ビューから計算項目付きのデータを取得して返す
    const { data: reportWithMetrics, error: viewError } = await supabase
      .from('daily_reports_with_metrics')
      .select('*')
      .eq('id', newReport.id)
      .single()

    if (viewError) {
      console.error('❌ ビューからの取得エラー:', viewError)
      throw new Error(`ビューからの取得エラー: ${viewError.message}`)
    }

    return reportWithMetrics
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
      .from('daily_reports_with_metrics')
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
      .from('daily_reports_with_metrics')
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