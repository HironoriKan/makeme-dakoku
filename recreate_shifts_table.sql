-- シフトテーブル再作成 (Supabaseダッシュボード SQL Editorで実行)
-- 注意: 既存のシフトデータは削除されます

-- Step 1: 既存のshiftsテーブルとenum型を削除
DROP TABLE IF EXISTS shifts CASCADE;
DROP TYPE IF EXISTS shift_type CASCADE;

-- Step 2: 新しいshift_type enumを作成
CREATE TYPE shift_type AS ENUM ('early', 'late', 'normal', 'off');

-- Step 3: 新しいshiftsテーブルを作成
CREATE TABLE shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_type shift_type NOT NULL,
    start_time TIME,
    end_time TIME,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 制約: 同じユーザー・同じ日付で重複不可
    UNIQUE(user_id, shift_date)
);

-- Step 4: インデックスを作成
CREATE INDEX idx_shifts_user_date ON shifts(user_id, shift_date);
CREATE INDEX idx_shifts_date ON shifts(shift_date);

-- Step 5: 確認クエリ
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shifts' 
ORDER BY ordinal_position;

-- enum値確認
SELECT unnest(enum_range(NULL::shift_type)) as shift_types;