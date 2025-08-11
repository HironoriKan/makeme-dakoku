import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gbfqtdcgoiuwuhvmamdo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZnF0ZGNnb2l1d3Vodm1hbWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjE1MjAsImV4cCI6MjA2OTQzNzUyMH0.P88rqeA3iq5DC_DLfA5c7r79E6VwZvAxYhwPfzF0Ja8'
);

async function addUserProfileFields() {
  try {
    console.log('ユーザープロファイルフィールドの追加を開始します...');

    // 各フィールドを個別に追加
    const fields = [
      { name: 'address', type: 'TEXT', comment: '住所' },
      { name: 'self_pr', type: 'TEXT', comment: '自己PR' },
      { name: 'career', type: 'TEXT', comment: '経歴・職歴' }
    ];

    for (const field of fields) {
      console.log(`フィールド ${field.name} を追加中...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${field.name} ${field.type};`
      });

      if (error) {
        console.error(`${field.name} の追加でエラー:`, error);
      } else {
        console.log(`${field.name} フィールドが正常に追加されました`);
      }

      // コメントを追加
      const { error: commentError } = await supabase.rpc('exec_sql', {
        sql: `COMMENT ON COLUMN users.${field.name} IS '${field.comment}';`
      });

      if (commentError) {
        console.warn(`${field.name} のコメント追加でエラー:`, commentError);
      }
    }

    console.log('ユーザープロファイルフィールドの追加が完了しました。');
  } catch (error) {
    console.error('マイグレーション実行エラー:', error);
  }
}

addUserProfileFields();