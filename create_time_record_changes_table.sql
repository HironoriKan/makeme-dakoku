-- 打刻記録変更履歴テーブル作成 (Supabaseダッシュボード SQL Editorで実行)

-- Step 1: change_type enumを作成
CREATE TYPE change_type AS ENUM ('edit', 'delete');

-- Step 2: time_record_changesテーブルを作成
CREATE TABLE time_record_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    time_record_id UUID REFERENCES time_records(id) ON DELETE SET NULL,
    change_type change_type NOT NULL,
    reason TEXT NOT NULL,
    
    -- 変更前の値（削除の場合に記録）
    original_record_type record_type,
    original_recorded_at TIMESTAMP WITH TIME ZONE,
    original_location_name VARCHAR,
    original_note TEXT,
    
    -- 変更後の値（編集の場合に記録）
    new_record_type record_type,
    new_recorded_at TIMESTAMP WITH TIME ZONE,
    new_location_name VARCHAR,
    new_note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Step 3: インデックスを作成
CREATE INDEX idx_time_record_changes_user_id ON time_record_changes(user_id);
CREATE INDEX idx_time_record_changes_time_record_id ON time_record_changes(time_record_id);
CREATE INDEX idx_time_record_changes_created_at ON time_record_changes(created_at);

-- Step 4: updated_atを自動更新するトリガーを設定
CREATE TRIGGER update_time_record_changes_updated_at
    BEFORE UPDATE ON time_record_changes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: 確認クエリ
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'time_record_changes' 
ORDER BY ordinal_position;

-- change_type enum値確認
SELECT unnest(enum_range(NULL::change_type)) as change_types;