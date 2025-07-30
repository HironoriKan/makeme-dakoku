-- 日次報告テーブル作成 (Supabaseダッシュボード SQL Editorで実行)

-- Step 1: daily_reportsテーブルを作成
CREATE TABLE daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    sales_amount INTEGER NOT NULL DEFAULT 0,
    customer_count INTEGER NOT NULL DEFAULT 0,
    items_sold INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Step 2: インデックスを作成
CREATE INDEX idx_daily_reports_user_date ON daily_reports(user_id, report_date);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- Step 3: RLS（Row Level Security）を有効化
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Step 4: RLSポリシーを作成（一旦シンプルに）
CREATE POLICY "Users can manage their own daily reports" ON daily_reports
    FOR ALL USING (true);

-- Step 5: updated_atを自動更新するトリガー関数を作成（存在しない場合）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: daily_reportsテーブルにupdated_at自動更新トリガーを設定
CREATE TRIGGER update_daily_reports_updated_at
    BEFORE UPDATE ON daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: 確認クエリ
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_reports' 
ORDER BY ordinal_position;