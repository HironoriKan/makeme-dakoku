// デバッグ機能付きサンプルデータ削除スクリプト

async function debugCleanup() {
  console.log('🔍 デバッグモード: サンプルデータ削除を開始します...\n');
  
  try {
    // Supabaseクライアントを取得
    const supabase = window.supabase;
    
    if (!supabase) {
      console.error('❌ Supabaseクライアントが利用できません');
      console.log('利用可能なwindowオブジェクト:', Object.keys(window).filter(k => k.includes('supabase') || k.includes('Supabase')));
      return;
    }

    console.log('✅ Supabaseクライアント確認済み');

    // 1. 現在のユーザー権限を確認
    console.log('\n=== 現在のユーザー情報確認 ===');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('認証エラー:', authError);
    } else {
      console.log('現在のユーザー:', user?.email || 'Anonymous');
    }

    // 2. 削除対象ユーザーの確認（詳細）
    console.log('\n=== 削除対象ユーザーの詳細確認 ===');
    const { data: usersToDelete, error: userFetchError } = await supabase
      .from('users')
      .select('id, display_name, line_user_id, created_at, is_admin')
      .gte('id', 5)
      .order('id');

    if (userFetchError) {
      console.error('ユーザー取得エラー:', userFetchError);
      return;
    }

    console.log(`削除対象ユーザー数: ${usersToDelete?.length || 0}`);
    usersToDelete?.forEach(user => {
      console.log(`- ID: ${user.id}, 名前: ${user.display_name}, 管理者: ${user.is_admin}`);
    });

    if (!usersToDelete || usersToDelete.length === 0) {
      console.log('✅ 削除対象のユーザーが存在しません');
      return;
    }

    // 3. 関連データ数の詳細確認
    console.log('\n=== 関連データ数の詳細確認 ===');
    
    const tables = ['time_records', 'daily_reports', 'shifts', 'user_location_access'];
    const dataCounts = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true })
          .gte('user_id', 5);
        
        if (error) {
          console.error(`${table}データ取得エラー:`, error);
          dataCounts[table] = { count: 'エラー', error };
        } else {
          dataCounts[table] = { count: data?.length || 0 };
        }
      } catch (err) {
        console.error(`${table}例外エラー:`, err);
        dataCounts[table] = { count: 'エラー', error: err };
      }
    }
    
    console.log('データ数確認結果:', dataCounts);

    // 4. 削除権限のテスト（1件だけ）
    console.log('\n=== 削除権限テスト ===');
    
    // 最初にtime_recordsから1件テスト削除
    const { data: testTimeRecord } = await supabase
      .from('time_records')
      .select('id')
      .gte('user_id', 5)
      .limit(1)
      .single();
    
    if (testTimeRecord) {
      console.log('time_records削除テスト開始...');
      const { error: testError } = await supabase
        .from('time_records')
        .delete()
        .eq('id', testTimeRecord.id);
      
      if (testError) {
        console.error('❌ 削除権限テスト失敗:', testError);
        console.error('エラー詳細:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        return;
      } else {
        console.log('✅ 削除権限テスト成功');
      }
    }

    // 5. バッチ削除実行（詳細ログ付き）
    console.log('\n=== バッチ削除実行 ===');
    
    const deletionOrder = [
      { table: 'time_records', label: '時刻記録データ' },
      { table: 'daily_reports', label: '日報データ' },
      { table: 'shifts', label: 'シフトデータ' },
      { table: 'user_location_access', label: 'ユーザー拠点アクセスデータ' },
      { table: 'users', label: 'ユーザーデータ' }
    ];

    for (const { table, label } of deletionOrder) {
      try {
        console.log(`${label}を削除中...`);
        
        const { data, error } = await supabase
          .from(table)
          .delete()
          .gte('user_id', 5);
        
        if (error) {
          console.error(`❌ ${label}削除エラー:`, error);
          console.error('詳細:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        console.log(`✅ ${label}削除完了`);
        
      } catch (err) {
        console.error(`❌ ${label}削除中に例外発生:`, err);
        throw err;
      }
    }

    // 6. 削除後確認
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
    
    // 3秒後にページを更新
    setTimeout(() => {
      console.log('🔄 ページを更新します...');
      window.location.reload();
    }, 3000);

  } catch (error) {
    console.error('\n❌ 削除処理中にエラーが発生:', error);
    console.error('エラーの種類:', error.constructor.name);
    console.error('エラーメッセージ:', error.message);
    
    if (error.details) {
      console.error('エラー詳細:', error.details);
    }
    
    if (error.hint) {
      console.error('ヒント:', error.hint);
    }
    
    if (error.code) {
      console.error('エラーコード:', error.code);
    }
  }
}

// 実行
debugCleanup();