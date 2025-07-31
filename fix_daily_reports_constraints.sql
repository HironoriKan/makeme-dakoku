-- 日報テーブルの重複防止対策
-- Supabase SQL Editorで実行してください

-- Step 1: user_id と report_date の一意制約を追加
ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_user_date_unique 
UNIQUE (user_id, report_date);

-- Step 2: 既存の重複データがある場合の確認クエリ
-- （実行前に重複があるかチェック）
SELECT 
    user_id, 
    report_date, 
    COUNT(*) as duplicate_count 
FROM daily_reports 
GROUP BY user_id, report_date 
HAVING COUNT(*) > 1;

-- Step 3: 重複データがある場合の重複削除（必要な場合のみ実行）
-- 最新のレコードを残して古いレコードを削除
/*
DELETE FROM daily_reports 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, report_date) id
    FROM daily_reports 
    ORDER BY user_id, report_date, created_at DESC
);
*/

-- Step 4: 制約追加後の確認
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'daily_reports')
AND contype = 'u';