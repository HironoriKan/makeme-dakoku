import { supabase } from '../lib/supabase';

/**
 * サンプルデータクリーンアップスクリプト
 * ユーザーID#5以降のユーザーとそれに関連するデータを削除
 */

export class SampleDataCleanup {
  
  // 削除対象のユーザーIDを確認
  static async checkUsersToDelete() {
    console.log('=== 削除対象ユーザーの確認 ===');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, display_name, line_user_id, created_at')
      .gte('id', 5)
      .order('id');

    if (error) {
      console.error('ユーザーデータ取得エラー:', error);
      return [];
    }

    console.log(`削除対象ユーザー数: ${users?.length || 0}`);
    users?.forEach(user => {
      console.log(`- ID: ${user.id}, 名前: ${user.display_name}, LINE ID: ${user.line_user_id}`);
    });

    return users || [];
  }

  // 保持対象のユーザーを確認
  static async checkUsersToKeep() {
    console.log('\n=== 保持対象ユーザーの確認 ===');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, display_name, line_user_id, created_at')
      .lt('id', 5)
      .order('id');

    if (error) {
      console.error('ユーザーデータ取得エラー:', error);
      return [];
    }

    console.log(`保持対象ユーザー数: ${users?.length || 0}`);
    users?.forEach(user => {
      console.log(`- ID: ${user.id}, 名前: ${user.display_name}, LINE ID: ${user.line_user_id}`);
    });

    return users || [];
  }

  // 関連データの数を確認
  static async checkRelatedDataCounts() {
    console.log('\n=== 削除対象の関連データ数確認 ===');

    // 時刻記録データ
    const { data: timeRecords, error: timeError } = await supabase
      .from('time_records')
      .select('id, user_id')
      .gte('user_id', 5);

    if (!timeError) {
      console.log(`時刻記録データ: ${timeRecords?.length || 0}件`);
    }

    // シフトデータ
    const { data: shifts, error: shiftError } = await supabase
      .from('shifts')
      .select('id, user_id')
      .gte('user_id', 5);

    if (!shiftError) {
      console.log(`シフトデータ: ${shifts?.length || 0}件`);
    }

    // 日報データ
    const { data: dailyReports, error: reportError } = await supabase
      .from('daily_reports')
      .select('id, user_id')
      .gte('user_id', 5);

    if (!reportError) {
      console.log(`日報データ: ${dailyReports?.length || 0}件`);
    }

    // ユーザー拠点アクセスデータ
    const { data: userLocationAccess, error: accessError } = await supabase
      .from('user_location_access')
      .select('id, user_id')
      .gte('user_id', 5);

    if (!accessError) {
      console.log(`ユーザー拠点アクセスデータ: ${userLocationAccess?.length || 0}件`);
    }

    return {
      timeRecords: timeRecords?.length || 0,
      shifts: shifts?.length || 0,
      dailyReports: dailyReports?.length || 0,
      userLocationAccess: userLocationAccess?.length || 0
    };
  }

  // 段階的にデータを削除
  static async deleteUserAndRelatedData() {
    console.log('\n=== データ削除開始 ===');
    
    try {
      // 1. 時刻記録データを削除
      console.log('1. 時刻記録データを削除中...');
      const { error: timeRecordsError } = await supabase
        .from('time_records')
        .delete()
        .gte('user_id', 5);

      if (timeRecordsError) {
        console.error('時刻記録データ削除エラー:', timeRecordsError);
        throw timeRecordsError;
      }
      console.log('✓ 時刻記録データ削除完了');

      // 2. 日報データを削除
      console.log('2. 日報データを削除中...');
      const { error: dailyReportsError } = await supabase
        .from('daily_reports')
        .delete()
        .gte('user_id', 5);

      if (dailyReportsError) {
        console.error('日報データ削除エラー:', dailyReportsError);
        throw dailyReportsError;
      }
      console.log('✓ 日報データ削除完了');

      // 3. シフトデータを削除
      console.log('3. シフトデータを削除中...');
      const { error: shiftsError } = await supabase
        .from('shifts')
        .delete()
        .gte('user_id', 5);

      if (shiftsError) {
        console.error('シフトデータ削除エラー:', shiftsError);
        throw shiftsError;
      }
      console.log('✓ シフトデータ削除完了');

      // 4. ユーザー拠点アクセスデータを削除
      console.log('4. ユーザー拠点アクセスデータを削除中...');
      const { error: userLocationAccessError } = await supabase
        .from('user_location_access')
        .delete()
        .gte('user_id', 5);

      if (userLocationAccessError) {
        console.error('ユーザー拠点アクセスデータ削除エラー:', userLocationAccessError);
        throw userLocationAccessError;
      }
      console.log('✓ ユーザー拠点アクセスデータ削除完了');

      // 5. 最後にユーザーデータを削除
      console.log('5. ユーザーデータを削除中...');
      const { error: usersError } = await supabase
        .from('users')
        .delete()
        .gte('id', 5);

      if (usersError) {
        console.error('ユーザーデータ削除エラー:', usersError);
        throw usersError;
      }
      console.log('✓ ユーザーデータ削除完了');

      console.log('\n🎉 すべての削除処理が完了しました！');
      
    } catch (error) {
      console.error('削除処理中にエラーが発生:', error);
      throw error;
    }
  }

  // 削除後の確認
  static async verifyDeletion() {
    console.log('\n=== 削除後の確認 ===');
    
    // 残存ユーザーを確認
    const { data: remainingUsers, error } = await supabase
      .from('users')
      .select('id, display_name')
      .order('id');

    if (error) {
      console.error('確認エラー:', error);
      return;
    }

    console.log(`残存ユーザー数: ${remainingUsers?.length || 0}`);
    remainingUsers?.forEach(user => {
      console.log(`- ID: ${user.id}, 名前: ${user.display_name}`);
    });

    // 関連データの残存確認
    await this.checkRelatedDataCounts();
  }

  // 完全な削除プロセスを実行
  static async executeFullCleanup() {
    try {
      console.log('🧹 サンプルデータクリーンアップを開始します\n');
      
      // 1. 事前確認
      await this.checkUsersToKeep();
      await this.checkUsersToDelete();
      await this.checkRelatedDataCounts();
      
      // 2. 削除実行
      await this.deleteUserAndRelatedData();
      
      // 3. 削除後確認
      await this.verifyDeletion();
      
      console.log('\n✅ クリーンアップ処理が正常に完了しました');
      
    } catch (error) {
      console.error('❌ クリーンアップ処理中にエラーが発生:', error);
      throw error;
    }
  }
}

// デバッグ用: ブラウザのコンソールから実行可能
(window as any).SampleDataCleanup = SampleDataCleanup;