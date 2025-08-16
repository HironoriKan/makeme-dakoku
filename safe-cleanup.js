// 安全な段階的サンプルデータ削除スクリプト

async function safeCleanup() {
  console.log('🛡️ 安全モード: サンプルデータ削除を開始します...\n');
  
  const supabase = window.supabase;
  
  if (!supabase) {
    console.error('❌ Supabaseクライアントが利用できません');
    return;
  }

  try {
    // Step 1: 削除対象ユーザーの特定
    const { data: targetUsers } = await supabase
      .from('users')
      .select('id')
      .gte('id', 5)
      .order('id');

    if (!targetUsers || targetUsers.length === 0) {
      console.log('✅ 削除対象のユーザーが存在しません');
      return;
    }

    const userIds = targetUsers.map(u => u.id);
    console.log('削除対象ユーザーID:', userIds);

    // Step 2: 1つずつ段階的削除
    console.log('\n=== 段階的削除開始 ===');

    // 2-1. time_records を個別削除
    console.log('\n📋 時刻記録データを個別削除中...');
    for (const userId of userIds) {
      const { data: records } = await supabase
        .from('time_records')
        .select('id')
        .eq('user_id', userId);
      
      if (records && records.length > 0) {
        for (const record of records) {
          const { error } = await supabase
            .from('time_records')
            .delete()
            .eq('id', record.id);
          
          if (error) {
            console.error(`時刻記録ID ${record.id} 削除エラー:`, error);
          } else {
            console.log(`✓ 時刻記録ID ${record.id} 削除完了`);
          }
        }
      }
    }

    // 2-2. daily_reports を個別削除
    console.log('\n📊 日報データを個別削除中...');
    for (const userId of userIds) {
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('user_id', userId);
      
      if (reports && reports.length > 0) {
        for (const report of reports) {
          const { error } = await supabase
            .from('daily_reports')
            .delete()
            .eq('id', report.id);
          
          if (error) {
            console.error(`日報ID ${report.id} 削除エラー:`, error);
          } else {
            console.log(`✓ 日報ID ${report.id} 削除完了`);
          }
        }
      }
    }

    // 2-3. shifts を個別削除
    console.log('\n📅 シフトデータを個別削除中...');
    for (const userId of userIds) {
      const { data: shifts } = await supabase
        .from('shifts')
        .select('id')
        .eq('user_id', userId);
      
      if (shifts && shifts.length > 0) {
        for (const shift of shifts) {
          const { error } = await supabase
            .from('shifts')
            .delete()
            .eq('id', shift.id);
          
          if (error) {
            console.error(`シフトID ${shift.id} 削除エラー:`, error);
          } else {
            console.log(`✓ シフトID ${shift.id} 削除完了`);
          }
        }
      }
    }

    // 2-4. user_location_access を個別削除
    console.log('\n🏢 ユーザー拠点アクセスデータを個別削除中...');
    for (const userId of userIds) {
      const { data: accesses } = await supabase
        .from('user_location_access')
        .select('id')
        .eq('user_id', userId);
      
      if (accesses && accesses.length > 0) {
        for (const access of accesses) {
          const { error } = await supabase
            .from('user_location_access')
            .delete()
            .eq('id', access.id);
          
          if (error) {
            console.error(`拠点アクセスID ${access.id} 削除エラー:`, error);
          } else {
            console.log(`✓ 拠点アクセスID ${access.id} 削除完了`);
          }
        }
      }
    }

    // 2-5. users を個別削除
    console.log('\n👤 ユーザーデータを個別削除中...');
    for (const userId of userIds) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error(`ユーザーID ${userId} 削除エラー:`, error);
      } else {
        console.log(`✓ ユーザーID ${userId} 削除完了`);
      }
    }

    // Step 3: 最終確認
    console.log('\n=== 最終確認 ===');
    const { data: finalUsers } = await supabase
      .from('users')
      .select('id, display_name')
      .order('id');

    console.log(`残存ユーザー数: ${finalUsers?.length || 0}`);
    finalUsers?.forEach(user => {
      console.log(`- ID: ${user.id}, 名前: ${user.display_name}`);
    });

    console.log('\n🎉 安全削除が完了しました！');
    
    setTimeout(() => {
      console.log('🔄 ページを更新します...');
      window.location.reload();
    }, 3000);

  } catch (error) {
    console.error('❌ 安全削除中にエラーが発生:', error);
  }
}

// 実行
safeCleanup();