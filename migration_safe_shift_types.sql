-- 安全なenum型変更（Supabaseダッシュボードで実行）
-- 既存データを保持しながらenum型を完全に置き換える

BEGIN;

-- Step 1: 新しいenum型を作成
CREATE TYPE shift_type_new AS ENUM ('early', 'late', 'normal', 'off');

-- Step 2: 新しい列を追加
ALTER TABLE shifts ADD COLUMN shift_type_new shift_type_new;

-- Step 3: 既存データを新しい値にマッピング
UPDATE shifts SET shift_type_new = CASE 
    WHEN shift_type = 'morning' THEN 'early'::shift_type_new
    WHEN shift_type = 'afternoon' THEN 'late'::shift_type_new
    WHEN shift_type = 'evening' THEN 'normal'::shift_type_new
    WHEN shift_type = 'night' THEN 'normal'::shift_type_new
    WHEN shift_type = 'off' THEN 'off'::shift_type_new
    ELSE 'normal'::shift_type_new
END;

-- Step 4: 古い列を削除
ALTER TABLE shifts DROP COLUMN shift_type;

-- Step 5: 新しい列を元の名前にリネーム
ALTER TABLE shifts RENAME COLUMN shift_type_new TO shift_type;

-- Step 6: 古いenum型を削除
DROP TYPE shift_type_old;

-- Step 7: 新しいenum型を元の名前にリネーム
ALTER TYPE shift_type_new RENAME TO shift_type_old;

COMMIT;

-- 確認クエリ
SELECT DISTINCT shift_type FROM shifts ORDER BY shift_type;