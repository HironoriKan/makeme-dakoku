-- 最終的なenum型変更（Supabaseダッシュボードで実行）
-- より簡単で安全な方法

-- Step 1: 新しいenum値を既存の型に追加
ALTER TYPE shift_type ADD VALUE IF NOT EXISTS 'early';
ALTER TYPE shift_type ADD VALUE IF NOT EXISTS 'late';  
ALTER TYPE shift_type ADD VALUE IF NOT EXISTS 'normal';

-- Step 2: 既存データを新しい値に変換
UPDATE shifts SET shift_type = 'early' WHERE shift_type = 'morning';
UPDATE shifts SET shift_type = 'late' WHERE shift_type = 'afternoon';
UPDATE shifts SET shift_type = 'normal' WHERE shift_type = 'evening';
UPDATE shifts SET shift_type = 'normal' WHERE shift_type = 'night';

-- Step 3: 確認クエリ（実行後にこれを実行して結果を確認）
SELECT shift_type, COUNT(*) as count 
FROM shifts 
GROUP BY shift_type 
ORDER BY shift_type;

-- 注意: 古いenum値('morning', 'afternoon', 'evening', 'night')は
-- PostgreSQLの制限により削除できませんが、データ上は使用されなくなります