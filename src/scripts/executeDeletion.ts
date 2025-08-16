import { SampleDataCleanup } from './cleanupSampleData';

// サンプルデータ削除の実行
async function executeDeletion() {
  console.log('🧹 サンプルデータ削除を開始します...\n');
  
  try {
    await SampleDataCleanup.executeFullCleanup();
    console.log('\n✅ 削除完了！');
  } catch (error) {
    console.error('\n❌ 削除失敗:', error);
  }
}

// 実行
executeDeletion();