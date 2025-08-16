# サンプルデータ削除手順

## 1. ブラウザでCMSダッシュボードにアクセス
- URL: https://makeme-dakoku-i6n39qh8n-make-me-cloud.vercel.app/admin
- ログイン後、ダッシュボードを表示

## 2. ブラウザの開発者ツールを開く
- F12キーまたは右クリック→「検証」
- Consoleタブを選択

## 3. コンソールで削除コマンドを実行
以下のコマンドをコンソールに貼り付けて実行：

```javascript
// サンプルデータ削除の実行
async function executeCleanup() {
  if (!window.SampleDataCleanup) {
    console.error('SampleDataCleanup is not available');
    return;
  }
  
  console.log('🧹 サンプルデータ削除を開始します...');
  
  try {
    await window.SampleDataCleanup.executeFullCleanup();
    console.log('\n✅ 削除完了！ページを更新してください。');
    
    // ページを自動更新
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error('\n❌ 削除失敗:', error);
  }
}

// 実行
executeCleanup();
```

## 4. 実行確認
- コンソールに削除プロセスのログが表示されます
- 「✅ 削除完了！」が表示されれば成功
- 3秒後に自動でページが更新されます

## 5. 結果確認
- ダッシュボードのデータが更新されていることを確認
- ユーザー数、出勤率などが正確な値になっているはず

## 削除対象データ
- ユーザーID#5以降のユーザー
- 関連する打刻記録 (time_records)
- 関連するシフトデータ (shifts)  
- 関連する日報データ (daily_reports)
- 関連するユーザー拠点アクセス (user_location_access)

## 保持されるデータ  
- ユーザーID#1〜#4のユーザーとそのデータ
- 拠点データ (locations)
- その他のマスタデータ