-- daily_reportsテーブルに新しいカラムを追加 (Supabaseダッシュボード SQL Editorで実行)

-- Step 1: 計算指標と退勤時刻のカラムを追加
ALTER TABLE daily_reports 
ADD COLUMN customer_unit_price INTEGER DEFAULT 0,
ADD COLUMN items_per_customer DECIMAL(4,1) DEFAULT 0.0,
ADD COLUMN checkout_time TIMESTAMP WITH TIME ZONE;

-- Step 2: 既存レコードの指標を計算して更新（必要に応じて）
UPDATE daily_reports 
SET 
    customer_unit_price = CASE 
        WHEN customer_count > 0 THEN ROUND(sales_amount::decimal / customer_count) 
        ELSE 0 
    END,
    items_per_customer = CASE 
        WHEN customer_count > 0 THEN ROUND((items_sold::decimal / customer_count), 1) 
        ELSE 0.0 
    END
WHERE customer_unit_price IS NULL OR items_per_customer IS NULL;

-- Step 3: 確認クエリ
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_reports' 
ORDER BY ordinal_position;