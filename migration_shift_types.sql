-- Supabaseダッシュボードで実行するSQL
-- SQL Editor > New query で以下を実行してください

-- Step 1: 新しいenum値を既存のenum型に追加
ALTER TYPE shift_type ADD VALUE IF NOT EXISTS 'early';
ALTER TYPE shift_type ADD VALUE IF NOT EXISTS 'late';  
ALTER TYPE shift_type ADD VALUE IF NOT EXISTS 'normal';

-- Step 2: 既存のデータを新しい値に変換
UPDATE shifts SET shift_type = 'early' WHERE shift_type = 'morning';
UPDATE shifts SET shift_type = 'late' WHERE shift_type = 'afternoon';
UPDATE shifts SET shift_type = 'normal' WHERE shift_type = 'evening';
UPDATE shifts SET shift_type = 'normal' WHERE shift_type = 'night';
-- 'off' はそのまま

-- Step 3: 古いenum値を削除（注意：既存データがない場合のみ）
-- この操作は非可逆的なので、バックアップを取ってから実行してください
-- ALTER TYPE shift_type DROP VALUE 'morning';
-- ALTER TYPE shift_type DROP VALUE 'afternoon';
-- ALTER TYPE shift_type DROP VALUE 'evening';
-- ALTER TYPE shift_type DROP VALUE 'night';

-- 確認用クエリ
SELECT DISTINCT shift_type FROM shifts;