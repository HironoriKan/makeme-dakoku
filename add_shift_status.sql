-- シフトステータス機能追加 (Supabaseダッシュボード SQL Editorで実行)

-- Step 1: shift_status enumを作成
CREATE TYPE shift_status AS ENUM ('adjusting', 'confirmed');

-- Step 2: shiftsテーブルにshift_statusカラムを追加
ALTER TABLE shifts 
ADD COLUMN shift_status shift_status DEFAULT 'adjusting' NOT NULL;

-- Step 3: インデックスを作成（ステータスでの絞り込みが多い場合）
CREATE INDEX idx_shifts_status ON shifts(shift_status);

-- Step 4: 確認クエリ
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shifts' 
ORDER BY ordinal_position;

-- shift_status enum値確認
SELECT unnest(enum_range(NULL::shift_status)) as shift_statuses;