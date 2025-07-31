-- 【優先度高-1】拠点マスターテーブル作成
-- 実行日時: 2025-01-31
-- 目的: ハードコードされた場所選択をマスターテーブル化

-- =============================================================================
-- Step 1: 拠点マスターテーブル作成
-- =============================================================================

CREATE TABLE locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- コメント追加
COMMENT ON TABLE locations IS '勤務拠点マスターテーブル';
COMMENT ON COLUMN locations.name IS '拠点名（表示用）';
COMMENT ON COLUMN locations.code IS '拠点コード（システム用）';
COMMENT ON COLUMN locations.display_order IS '表示順序';

-- =============================================================================
-- Step 2: 初期データ投入
-- =============================================================================

INSERT INTO locations (name, code, display_order) VALUES 
    ('本社', 'HQ', 1),
    ('支社', 'BRANCH', 2),
    ('在宅', 'REMOTE', 3);

-- =============================================================================
-- Step 3: time_records テーブルに location_id カラム追加
-- =============================================================================

-- 新しいカラム追加（nullable で開始）
ALTER TABLE time_records ADD COLUMN location_id UUID REFERENCES locations(id);

-- インデックス追加
CREATE INDEX idx_time_records_location_id ON time_records(location_id);

-- =============================================================================
-- Step 4: 既存データのマイグレーション
-- =============================================================================

-- 既存の note カラムから拠点を推測してマイグレーション
UPDATE time_records SET location_id = (
    SELECT id FROM locations WHERE 
    CASE 
        WHEN time_records.note LIKE '%本社%' THEN locations.code = 'HQ'
        WHEN time_records.note LIKE '%支社%' THEN locations.code = 'BRANCH'
        WHEN time_records.note LIKE '%在宅%' THEN locations.code = 'REMOTE'
        ELSE locations.code = 'HQ' -- デフォルトは本社
    END
    LIMIT 1
);

-- マイグレーション結果確認
SELECT 
    l.name as location_name,
    COUNT(tr.id) as record_count,
    MIN(tr.recorded_at) as earliest_record,
    MAX(tr.recorded_at) as latest_record
FROM time_records tr
LEFT JOIN locations l ON tr.location_id = l.id
GROUP BY l.name
ORDER BY record_count DESC;

-- =============================================================================
-- Step 5: updated_at トリガー設定
-- =============================================================================

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Step 6: 制約・バリデーション追加
-- =============================================================================

-- 有効な拠点のみ参照できるよう制約追加（後で有効化）
-- ALTER TABLE time_records ADD CONSTRAINT chk_time_records_active_location 
--     CHECK (location_id IS NULL OR EXISTS (
--         SELECT 1 FROM locations WHERE id = location_id AND is_active = true
--     ));

-- =============================================================================
-- 確認クエリ
-- =============================================================================

-- 作成されたテーブル確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'locations' 
ORDER BY ordinal_position;

-- 投入されたデータ確認
SELECT * FROM locations ORDER BY display_order;

-- time_records の更新状況確認
SELECT 
    COUNT(*) as total_records,
    COUNT(location_id) as migrated_records,
    COUNT(*) - COUNT(location_id) as unmigrated_records
FROM time_records;

-- マイグレーション詳細確認
SELECT 
    CASE 
        WHEN location_id IS NULL THEN 'マイグレーション未完了'
        ELSE l.name 
    END as location_status,
    COUNT(*) as count
FROM time_records tr
LEFT JOIN locations l ON tr.location_id = l.id
GROUP BY location_id, l.name
ORDER BY count DESC;