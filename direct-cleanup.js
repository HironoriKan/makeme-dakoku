// サンプルデータ直接削除スクリプト
// ブラウザのコンソールで実行する用

async function directCleanup() {
  console.log('🧹 サンプルデータ直接削除を開始します...\n');
  
  try {
    // Supabaseクライアントを取得
    const supabase = window.supabase || (() => {
      console.error('Supabaseクライアントが見つかりません');
      return null;
    })();
    
    if (!supabase) {
      console.error('❌ Supabaseクライアントが利用できません');
      return;
    }

    // 1. 削除対象ユーザーの確認
    console.log('=== 削除対象ユーザーの確認 ===');
    const { data: usersToDelete } = await supabase
      .from('users')
      .select('id, display_name, line_user_id')
      .gte('id', 5)
      .order('id');

    console.log(`削除対象ユーザー数: ${usersToDelete?.length || 0}`);
    usersToDelete?.forEach(user => {
      console.log(`- ID: ${user.id}, 名前: ${user.display_name}`);
    });

    if (!usersToDelete || usersToDelete.length === 0) {
      console.log('✅ 削除対象のユーザーが存在しません');
      return;
    }

    // 2. 段階的削除実行
    console.log('\n=== データ削除開始 ===');
    
    // 時刻記録データを削除
    console.log('1. 時刻記録データを削除中...');
    const { error: timeError } = await supabase
      .from('time_records')
      .delete()
      .gte('user_id', 5);
    
    if (timeError) throw timeError;
    console.log('✓ 時刻記録データ削除完了');

    // 日報データを削除
    console.log('2. 日報データを削除中...');
    const { error: reportError } = await supabase
      .from('daily_reports')
      .delete()
      .gte('user_id', 5);
    
    if (reportError) throw reportError;
    console.log('✓ 日報データ削除完了');

    // シフトデータを削除
    console.log('3. シフトデータを削除中...');
    const { error: shiftError } = await supabase
      .from('shifts')
      .delete()
      .gte('user_id', 5);
    
    if (shiftError) throw shiftError;
    console.log('✓ シフトデータ削除完了');

    // ユーザー拠点アクセスデータを削除
    console.log('4. ユーザー拠点アクセスデータを削除中...');
    const { error: accessError } = await supabase
      .from('user_location_access')
      .delete()
      .gte('user_id', 5);
    
    if (accessError) throw accessError;
    console.log('✓ ユーザー拠点アクセスデータ削除完了');

    // ユーザーデータを削除
    console.log('5. ユーザーデータを削除中...');
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .gte('id', 5);
    
    if (userError) throw userError;
    console.log('✓ ユーザーデータ削除完了');

    // 3. 削除後確認
    console.log('\n=== 削除後の確認 ===');
    const { data: remainingUsers } = await supabase
      .from('users')
      .select('id, display_name')
      .order('id');

    console.log(`残存ユーザー数: ${remainingUsers?.length || 0}`);
    remainingUsers?.forEach(user => {
      console.log(`- ID: ${user.id}, 名前: ${user.display_name}`);
    });

    console.log('\n🎉 サンプルデータ削除が完了しました！');
    console.log('📝 ページを更新してダッシュボードの変更を確認してください。');
    
    // 3秒後にページを更新
    setTimeout(() => {
      console.log('🔄 ページを更新します...');
      window.location.reload();
    }, 3000);

  } catch (error) {
    console.error('❌ 削除処理中にエラーが発生:', error);
    console.error('詳細:', error.message || error);
  }
}

// 実行
directCleanup();